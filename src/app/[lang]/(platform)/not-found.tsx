import Link from "next/link"
import { headers } from "next/headers"

export default async function PlatformNotFound() {
  const headersList = await headers()
  const pathname = headersList.get("x-next-pathname") || ""
  const locale = pathname.startsWith("/en") ? "en" : "ar"
  const isArabic = locale === "ar"

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-8xl font-bold text-muted-foreground/30 mb-4">404</div>
        <h1 className="text-2xl font-bold mb-3" dir={isArabic ? "rtl" : "ltr"}>
          {isArabic ? "الصفحة غير موجودة" : "Page Not Found"}
        </h1>
        <p className="text-muted-foreground mb-8" dir={isArabic ? "rtl" : "ltr"}>
          {isArabic
            ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
            : "The page you're looking for doesn't exist or has been moved."}
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isArabic ? "لوحة التحكم" : "Dashboard"}
        </Link>
      </div>
    </div>
  )
}
