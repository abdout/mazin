"use server"

/**
 * Team roster server actions.
 *
 * Source of truth: `User` rows where `type = STAFF`, plus pending `StaffInvite`
 * rows for people who haven't yet completed onboarding. Per-member load is the
 * count of tasks where the user appears in `Task.assignedTo` (today an array of
 * IDs — Story 12.3 will replace this with a `TaskAssignee` join table).
 */

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { UserRole } from "@prisma/client"
import { logAudit } from "@/lib/audit"
import type { TeamMember } from "./types"

const VALID_ROLES = ["ADMIN", "MANAGER", "CLERK", "VIEWER"] as const

export async function listTeamMembers(): Promise<TeamMember[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const [users, invites] = await Promise.all([
    db.user.findMany({
      where: { type: "STAFF" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        sessions: {
          orderBy: { expires: "desc" },
          take: 1,
          select: { expires: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.staffInvite.findMany({
      where: { status: "PENDING" },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
  ])

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const userIds = users.map((u) => u.id)

  // Cheap rollup of open + recently-completed tasks per user.
  const [openTasks, doneTasks] = await Promise.all([
    db.task.findMany({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] }, assignedTo: { hasSome: userIds } },
      select: { assignedTo: true },
    }),
    db.task.findMany({
      where: { status: "DONE", completedAt: { gte: since }, assignedTo: { hasSome: userIds } },
      select: { assignedTo: true },
    }),
  ])

  function countFor(userId: string, rows: { assignedTo: string[] }[]) {
    return rows.reduce((sum, r) => sum + (r.assignedTo.includes(userId) ? 1 : 0), 0)
  }

  const userMembers: TeamMember[] = users.map((u) => {
    const lastSession = u.sessions[0]?.expires
    const isActive = lastSession ? lastSession > new Date() : false
    return {
      id: u.id,
      name: u.name ?? u.email,
      email: u.email,
      avatar: u.image ?? undefined,
      role: u.role as TeamMember["role"],
      status: isActive ? "ACTIVE" : "INACTIVE",
      joinedAt: u.createdAt,
      lastActive: lastSession ?? undefined,
      load: {
        open: countFor(u.id, openTasks),
        done7d: countFor(u.id, doneTasks),
      },
    }
  })

  const inviteMembers: TeamMember[] = invites.map((i) => ({
    id: `invite:${i.id}`,
    name: i.email,
    email: i.email,
    role: i.role as TeamMember["role"],
    status: "PENDING",
    joinedAt: i.createdAt,
  }))

  return [...userMembers, ...inviteMembers]
}

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(VALID_ROLES),
})

export async function updateTeamMemberRole(
  input: z.input<typeof updateRoleSchema>
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Only ADMIN can change roles. Self-demotion still allowed (the operator can
  // hand off ownership) — no extra guard needed.
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  const validated = updateRoleSchema.parse(input)
  const before = await db.user.findUnique({
    where: { id: validated.userId },
    select: { role: true },
  })
  if (!before) throw new Error("User not found")

  await db.user.update({
    where: { id: validated.userId },
    data: { role: validated.role as UserRole },
  })

  await logAudit({
    actor: {
      userId: session.user.id,
      email: session.user.email ?? "",
    },
    action: "ROLE_CHANGE",
    resource: "user",
    resourceId: validated.userId,
    metadata: { from: before.role, to: validated.role },
  })

  revalidatePath("/team")
  revalidatePath("/settings/team")
  return { success: true }
}
