"use client"

import { useState, useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { Dictionary, Locale } from "@/components/internationalization"
import { TeamTable } from "./team-table"
import type { TeamMember, TeamMemberRole, TeamMemberStatus } from "./types"
import { updateTeamMemberRole } from "./actions"

interface TeamPageClientProps {
  dictionary: Dictionary
  locale: Locale
  /** Real team data hydrated from `listTeamMembers` on the server. */
  initialMembers: TeamMember[]
}

export function TeamPageClient({
  dictionary,
  locale,
  initialMembers,
}: TeamPageClientProps) {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [, startTransition] = useTransition()

  const handleAdd = useCallback(() => {
    // Goes to settings/team where the real invite flow lives.
    router.push(`/${locale}/settings/team`)
  }, [router, locale])

  const handleEdit = useCallback(
    (member: TeamMember) => {
      router.push(`/${locale}/team/${member.id}/edit`)
    },
    [router, locale]
  )

  const handleDelete = useCallback(
    (id: string) => {
      // Deletion is destructive — defer to the server-side invite flow rather
      // than mutating local state silently. For now leave a placeholder.
      toast.info(
        dictionary.team?.deleteHint ??
          "Use Settings → Team to revoke a member"
      )
      void id
    },
    [dictionary]
  )

  const handleChangeRole = useCallback(
    (id: string, role: TeamMemberRole) => {
      // Optimistic UI; fall back to a refresh if the server rejects.
      const previous = members
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role } : m))
      )
      startTransition(async () => {
        try {
          await updateTeamMemberRole({ userId: id, role })
          toast.success(dictionary.common?.success ?? "")
        } catch (err) {
          setMembers(previous)
          toast.error(err instanceof Error ? err.message : "Failed to update role")
        }
      })
    },
    [dictionary, members]
  )

  const handleChangeStatus = useCallback(
    (id: string, status: TeamMemberStatus) => {
      // Status is derived from session activity / invite state — operator can't
      // toggle it directly. No-op until a real onboarding suspend flow exists.
      void id
      void status
      toast.info(
        dictionary.team?.statusHint ??
          "Status reflects session activity; revoke via Settings → Team"
      )
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
