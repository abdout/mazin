"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { useParams } from "next/navigation"
import enDict from "@/components/internationalization/en.json"
import arDict from "@/components/internationalization/ar.json"

type CtaKind = "home" | "dashboard" | "login"

export function PageErrorBoundary({
  error,
  reset,
  cta = "dashboard",
}: {
  error: Error & { digest?: string }
  reset: () => void
  cta?: CtaKind
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const params = useParams<{ lang: string }>()
  const lang = params?.lang === "en" ? "en" : "ar"
  const t = (lang === "ar" ? arDict : enDict).errorPage

  const target =
    cta === "home" ? `/${lang}` :
    cta === "login" ? `/${lang}/login` :
    `/${lang}/dashboard`
  const ctaLabel =
    cta === "home" ? t.goHome :
    cta === "login" ? t.backToLogin :
    t.goDashboard

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold mb-3">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.retry}
          </button>
          <a
            href={target}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </div>
  )
}
