"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import enDict from "@/components/internationalization/en.json"
import arDict from "@/components/internationalization/ar.json"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  // Detect language from URL — global-error runs above the layout so we
  // can't reach `params.lang` here.
  const isArabic = typeof window !== "undefined" && window.location.pathname.startsWith("/ar")
  const t = (isArabic ? arDict : enDict).errorPage

  return (
    <html lang={isArabic ? "ar" : "en"} dir={isArabic ? "rtl" : "ltr"}>
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">{t.globalTitle}</h1>
          <p className="text-muted-foreground mb-6">{t.globalDescription}</p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.refresh}
          </button>
        </div>
      </body>
    </html>
  )
}
