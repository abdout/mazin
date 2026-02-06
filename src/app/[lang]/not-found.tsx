import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="text-8xl font-bold text-muted-foreground/30 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-3">
          <span className="block" lang="ar" dir="rtl">الصفحة غير موجودة</span>
          <span className="block text-lg text-muted-foreground mt-1" lang="en">Page Not Found</span>
        </h1>
        <p className="text-muted-foreground mb-8">
          <span className="block" lang="ar" dir="rtl">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</span>
          <span className="block mt-1" lang="en">The page you&apos;re looking for doesn&apos;t exist or has been moved.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/ar"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            الصفحة الرئيسية
          </Link>
          <Link
            href="/en"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
