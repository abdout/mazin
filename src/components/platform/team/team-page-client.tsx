"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { Dictionary, Locale } from "@/components/internationalization"
import { TeamTable } from "./team-table"
import type { TeamMember, TeamMemberRole, TeamMemberStatus } from "./types"

// Mock data for demonstration
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    department: "Engineering",
    joinedAt: new Date("2023-01-15"),
    lastActive: new Date(),
  },
  {
    id: "2",
    name: "Sara Ali",
    email: "sara@example.com",
    role: "MANAGER",
    status: "ACTIVE",
    department: "Design",
    joinedAt: new Date("2023-03-20"),
    lastActive: new Date(),
  },
  {
    id: "3",
    name: "Omar Khalid",
    email: "omar@example.com",
    role: "MEMBER",
    status: "ACTIVE",
    department: "Engineering",
    joinedAt: new Date("2023-06-10"),
    lastActive: new Date(),
  },
  {
    id: "4",
    name: "Fatima Noor",
    email: "fatima@example.com",
    role: "MEMBER",
    status: "PENDING",
    department: "Marketing",
    joinedAt: new Date("2024-01-05"),
  },
  {
    id: "5",
    name: "Yusuf Ibrahim",
    email: "yusuf@example.com",
    role: "VIEWER",
    status: "INACTIVE",
    department: "Sales",
    joinedAt: new Date("2022-11-30"),
    lastActive: new Date("2024-06-15"),
  },
  {
    id: "6",
    name: "Layla Mohammed",
    email: "layla@example.com",
    role: "MANAGER",
    status: "ACTIVE",
    department: "Operations",
    joinedAt: new Date("2023-08-22"),
    lastActive: new Date(),
  },
]

interface TeamPageClientProps {
  dictionary: Dictionary
  locale: Locale
}

export function TeamPageClient({ dictionary, locale }: TeamPageClientProps) {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers)

  const handleAdd = useCallback(() => {
    router.push(`/${locale}/team/new`)
  }, [router, locale])

  const handleEdit = useCallback(
    (member: TeamMember) => {
      router.push(`/${locale}/team/${member.id}/edit`)
    },
    [router, locale]
  )

  const handleDelete = useCallback(
    (id: string) => {
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success(dictionary.common?.success || "Member removed successfully")
    },
    [dictionary]
  )

  const handleChangeRole = useCallback(
    (id: string, role: TeamMemberRole) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role } : m))
      )
      toast.success(dictionary.common?.success || "Role updated successfully")
    },
    [dictionary]
  )

  const handleChangeStatus = useCallback(
    (id: string, status: TeamMemberStatus) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      )
      toast.success(dictionary.common?.success || "Status updated successfully")
    },
    [dictionary]
  )

  return (
    <TeamTable
      data={members}
      dictionary={dictionary}
      locale={locale}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onChangeRole={handleChangeRole}
      onChangeStatus={handleChangeStatus}
    />
  )
}
