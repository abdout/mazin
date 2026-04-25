import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization"
import { InviteAcceptForm } from "@/components/auth/join/invite-accept-form"

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ lang: string; token: string }>
}) {
  const { lang, token } = await params
  const locale = lang as Locale

  const invite = await db.staffInvite.findUnique({ where: { token } })

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">You&apos;ve been invited</h1>
        <p className="text-muted-foreground mt-1">
          Set up your account to join as <strong>{invite.role}</strong>.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Email: <code className="font-mono">{invite.email}</code>
        </p>
      </div>

      <InviteAcceptForm token={token} lang={locale} />
    </div>
  )
}
