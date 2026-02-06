import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { isRTL, type Locale } from "@/components/internationalization"
import { SidebarProvider } from "@/components/ui/sidebar"
import { PlatformHeader } from "@/components/template/platform-header"
import { PlatformSidebar } from "@/components/template/platform-sidebar"
import { PageHeadingProvider } from "@/components/platform/context/page-heading-context"

export default async function PlatformLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const session = await auth()
  const { lang: langParam } = await params
  const lang = langParam as Locale

  if (!session?.user?.id) {
    redirect(`/${lang}/login`)
  }

  const dict = await getDictionary(lang)
  const rtl = isRTL(lang)

  return (
    <SidebarProvider>
      <div
        className="flex min-h-svh w-full flex-col"
        dir={rtl ? "rtl" : "ltr"}
      >
        {/* Skip to main content link for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
          style={rtl ? { right: "1rem" } : { left: "1rem" }}
        >
          {lang === "ar" ? "انتقل إلى المحتوى الرئيسي" : "Skip to main content"}
        </a>

        <header role="banner">
          <PlatformHeader
            dictionary={dict}
            locale={lang}
            userRole={session.user.role}
          />
        </header>

        <div className="flex pt-6">
          <nav role="navigation" aria-label={lang === "ar" ? "القائمة الرئيسية" : "Main navigation"}>
            <PlatformSidebar
              dictionary={dict}
              locale={lang}
              userRole={session.user.role}
              side={rtl ? "right" : "left"}
            />
          </nav>

          <PageHeadingProvider>
            <main
              id="main-content"
              role="main"
              className="dashboard-container overflow-hidden pb-10 transition-[margin] duration-200 ease-in-out"
            >
              {children}
            </main>
          </PageHeadingProvider>
        </div>
      </div>
    </SidebarProvider>
  )
}
