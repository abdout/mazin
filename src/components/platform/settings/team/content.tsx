// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Dictionary } from "@/components/internationalization/types"
import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getTeamMembers } from "@/components/platform/task/actions"
import { can } from "@/lib/authorization"
import { getAuthContext } from "@/lib/auth-context"
import { InviteForm } from "./invite-form"
import { PendingInvites } from "./pending-invites"

type Locale = "ar" | "en"

interface TeamContentProps {
  dictionary: Dictionary
  locale: Locale
}

function initials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (first + last).toUpperCase() || "?"
}

export async function TeamContent({ dictionary, locale }: TeamContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/team`)
  }

  const t = dictionary.settings?.teamTab
  const result = await getTeamMembers()
  const members = result.success ? result.members ?? [] : []
  const ctx = await getAuthContext()
  const canInvite = can(ctx, "update", "team")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{t?.title ?? "Team"}</CardTitle>
            <CardDescription>{t?.description}</CardDescription>
          </div>
          {canInvite && <InviteForm />}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t?.empty ?? "No team members yet."}
            </p>
          ) : (
            <ul className="divide-y">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 py-3">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.id === session.user.id
                        ? locale === "ar"
                          ? "أنت"
                          : "You"
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canInvite && <PendingInvites />}
    </div>
  )
}
