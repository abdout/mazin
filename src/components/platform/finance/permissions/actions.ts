"use server"

import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"

import type {
  FinanceAction,
  FinanceModule,
} from "@/components/platform/finance/lib/permissions"
import {
  FINANCE_MODULES,
  getUserModulePermissions,
} from "@/components/platform/finance/lib/permissions"

const log = logger.forModule("permissions")

export type UserPermissionSummary = {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  permissions: Array<{
    module: FinanceModule
    actions: FinanceAction[]
  }>
}

export type ModulePermissionSummary = {
  module: FinanceModule
  users: Array<{
    userId: string
    userName: string
    userEmail: string
    userRole: string
    actions: FinanceAction[]
  }>
}

/**
 * Mazin is role-based — no per-user permission rows. We derive permissions
 * from the role matrix in finance/lib/permissions.ts instead of persisting
 * grant/revoke records. The action surfaces below reflect that: reads return
 * the derived view; grant/revoke are no-ops that return a clear error so the
 * UI can show "change the user's role to adjust permissions".
 */

export async function getAllUsersWithPermissions(): Promise<{
  success: boolean
  data?: UserPermissionSummary[]
  error?: string
}> {
  try {
    const ctx = await requireStaff()
    requireCan(ctx, "read", "settings")

    const users = await db.user.findMany({
      where: { type: "STAFF" },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "asc" },
    })

    const summaries = await Promise.all(
      users.map(async u => ({
        userId: u.id,
        userName: u.name ?? "—",
        userEmail: u.email,
        userRole: u.role,
        permissions: await Promise.all(
          FINANCE_MODULES.map(async module => ({
            module,
            actions: await getUserModulePermissions(u.id, "", module),
          }))
        ),
      }))
    )

    return { success: true, data: summaries }
  } catch (error) {
    log.error("Failed to get users with permissions", error as Error)
    return { success: false, error: "Failed to fetch users" }
  }
}

export async function getPermissionsByModule(): Promise<{
  success: boolean
  data?: ModulePermissionSummary[]
  error?: string
}> {
  try {
    const ctx = await requireStaff()
    requireCan(ctx, "read", "settings")

    const users = await db.user.findMany({
      where: { type: "STAFF" },
      select: { id: true, name: true, email: true, role: true },
    })

    const byModule = await Promise.all(
      FINANCE_MODULES.map(async module => ({
        module,
        users: await Promise.all(
          users.map(async u => ({
            userId: u.id,
            userName: u.name ?? "—",
            userEmail: u.email,
            userRole: u.role,
            actions: await getUserModulePermissions(u.id, "", module),
          }))
        ),
      }))
    )

    return { success: true, data: byModule }
  } catch (error) {
    log.error("Failed to get permissions by module", error as Error)
    return { success: false, error: "Failed to fetch module permissions" }
  }
}

/**
 * @returns always `{ success: false }` — permissions are role-derived.
 * Change the user's role via /settings/team to adjust their access.
 */
export async function grantPermission(
  _userId: string,
  _module: FinanceModule,
  _action: FinanceAction
): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: "Permissions are role-based. Change the user's role to grant access.",
  }
}

export async function revokePermission(
  _userId: string,
  _module: FinanceModule,
  _action: FinanceAction
): Promise<{ success: boolean; error?: string }> {
  return {
    success: false,
    error: "Permissions are role-based. Change the user's role to revoke access.",
  }
}

export async function bulkGrantPermissions(
  _userId: string,
  permissions: Array<{ module: FinanceModule; action: FinanceAction }>
): Promise<{
  success: boolean
  granted: number
  failed: number
  error?: string
}> {
  return {
    success: false,
    granted: 0,
    failed: permissions.length,
    error: "Permissions are role-based. Change the user's role instead.",
  }
}

export async function bulkRevokePermissions(
  _userId: string,
  permissions: Array<{ module: FinanceModule; action: FinanceAction }>
): Promise<{
  success: boolean
  revoked: number
  failed: number
  error?: string
}> {
  return {
    success: false,
    revoked: 0,
    failed: permissions.length,
    error: "Permissions are role-based. Change the user's role instead.",
  }
}

export async function copyPermissions(
  _fromUserId: string,
  _toUserId: string
): Promise<{ success: boolean; copied: number; error?: string }> {
  revalidatePath("/finance/permissions")
  return {
    success: false,
    copied: 0,
    error: "Permissions are role-based. Copy the role, not individual permissions.",
  }
}
