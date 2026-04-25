// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Dictionary } from "@/components/internationalization/types"
import { auth } from "@/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProfile } from "../profile/queries"
import { AuditLogList } from "./audit-log-list"
import { can } from "@/lib/authorization"
import { getAuthContext } from "@/lib/auth-context"

type Locale = "ar" | "en"

interface SecurityContentProps {
  dictionary: Dictionary
  locale: Locale
}

export async function SecurityContent({ dictionary, locale }: SecurityContentProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/settings/security`)
  }

  const profile = await getProfile(session.user.id)
  const t = dictionary.settings?.securityTab
  const comingSoon = t?.comingSoon ?? (locale === "ar" ? "قريباً" : "Coming soon")
  const ctx = await getAuthContext()
  const canSeeAudit = can(ctx, "read", "audit-log")

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{t?.twoFactorTitle ?? "Two-factor authentication"}</CardTitle>
            <CardDescription>
              {profile?.isTwoFactorEnabled
                ? t?.twoFactorStatusEnabled ??
                  "Enabled — codes sent to your email on sign-in."
                : t?.twoFactorStatusDisabled ??
                  "Disabled — enable to require an emailed code at sign-in."}
            </CardDescription>
          </div>
          <Badge variant={profile?.isTwoFactorEnabled ? "default" : "secondary"}>
            {profile?.isTwoFactorEnabled
              ? locale === "ar"
                ? "مفعّل"
                : "Enabled"
              : locale === "ar"
                ? "غير مفعّل"
                : "Disabled"}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{comingSoon}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t?.passwordTitle ?? "Password"}</CardTitle>
          <CardDescription>
            {profile?.isOAuth
              ? locale === "ar"
                ? "مُدار من مزوّد تسجيل الدخول. لا يوجد كلمة مرور للتعديل."
                : "Managed by your sign-in provider. No password to change."
              : t?.passwordDescription ??
                "Change the password you use to sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{comingSoon}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t?.sessionsTitle ?? "Active sessions"}</CardTitle>
          <CardDescription>
            {t?.sessionsDescription ??
              "Review and revoke devices signed in to your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{comingSoon}</p>
        </CardContent>
      </Card>

      {canSeeAudit && <AuditLogList />}
    </div>
  )
}
