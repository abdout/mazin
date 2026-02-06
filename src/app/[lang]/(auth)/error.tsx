"use client"

import { useParams } from "next/navigation"

const messages = {
  ar: {
    title: "حدث خطأ ما",
    description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
    retry: "حاول مرة أخرى",
    backToLogin: "العودة لتسجيل الدخول",
  },
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    retry: "Try Again",
    backToLogin: "Back to Login",
  },
} as const

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ lang: string }>()
  const lang = params?.lang === "en" ? "en" : "ar"
  const t = messages[lang]

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
            href={`/${lang}/login`}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            {t.backToLogin}
          </a>
        </div>
      </div>
    </div>
  )
}
