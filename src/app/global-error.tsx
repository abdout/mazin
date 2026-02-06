"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

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

  // Detect language from URL
  const isArabic = typeof window !== 'undefined' && window.location.pathname.startsWith('/ar')

  return (
    <html lang={isArabic ? 'ar' : 'en'} dir={isArabic ? 'rtl' : 'ltr'}>
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            {isArabic ? 'خطأ في التطبيق' : 'Application Error'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isArabic ? 'حدث خطأ حرج. يرجى تحديث الصفحة.' : 'A critical error occurred. Please refresh the page.'}
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isArabic ? 'تحديث الصفحة' : 'Refresh Page'}
          </button>
        </div>
      </body>
    </html>
  )
}
