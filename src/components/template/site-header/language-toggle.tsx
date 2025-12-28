"use client"

import { usePathname, useRouter } from "next/navigation"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()

  const currentLang = pathname.split("/")[1] || "en"
  const nextLang = currentLang === "ar" ? "en" : "ar"

  const switchLanguage = () => {
    const segments = pathname.split("/")
    segments[1] = nextLang
    document.cookie = `NEXT_LOCALE=${nextLang}; path=/; max-age=31536000; samesite=lax`
    router.push(segments.join("/"))
  }

  return (
    <button
      onClick={switchLanguage}
      className="hover:text-foreground transition-colors cursor-pointer"
    >
      <Languages className="size-4" />
      <span className="sr-only">
        Switch to {nextLang === "ar" ? "Arabic" : "English"}
      </span>
    </button>
  )
}
