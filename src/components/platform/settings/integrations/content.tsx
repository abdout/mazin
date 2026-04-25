// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Locale = "ar" | "en"

interface IntegrationsContentProps {
  dictionary: Dictionary
  locale: Locale
}

// Integration status is derived from env — nothing tenant-scoped. Rendered as
// a server component so we read env on the server.
function integrationStatus(): Array<{
  key: "whatsapp" | "resend" | "oauth"
  configured: boolean
}> {
  return [
    {
      key: "whatsapp",
      configured:
        !!process.env.WHATSAPP_PHONE_NUMBER_ID &&
        !!process.env.WHATSAPP_ACCESS_TOKEN,
    },
    { key: "resend", configured: !!process.env.RESEND_API_KEY },
    {
      key: "oauth",
      configured:
        !!process.env.GOOGLE_CLIENT_ID || !!process.env.GITHUB_CLIENT_ID,
    },
  ]
}

export function IntegrationsContent({ dictionary, locale }: IntegrationsContentProps) {
  const t = dictionary.settings?.integrationsTab
  const cards = integrationStatus()
  const labels = {
    whatsapp: t?.whatsapp ?? "WhatsApp",
    resend: t?.resend ?? "Resend",
    oauth: t?.oauth ?? "OAuth",
  } as const
  const descriptions = {
    whatsapp: t?.whatsappDescription ?? "",
    resend: t?.resendDescription ?? "",
    oauth: t?.oauthDescription ?? "",
  } as const

  return (
    <div className="space-y-4">
      {t?.description ? (
        <p className="text-sm text-muted-foreground">{t.description}</p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.key}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{labels[c.key]}</CardTitle>
                <Badge variant={c.configured ? "default" : "secondary"}>
                  {c.configured
                    ? t?.statusConfigured ??
                      (locale === "ar" ? "مهيّأ" : "Configured")
                    : t?.statusNotConfigured ??
                      (locale === "ar" ? "غير مهيّأ" : "Not configured")}
                </Badge>
              </div>
              <CardDescription>{descriptions[c.key]}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  )
}
