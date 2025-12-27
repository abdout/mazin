"use client"

import { usePathname, useRouter } from "next/navigation"

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
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      {currentLang === "ar" ? "EN" : "ع"}
    </button>
  )
}
