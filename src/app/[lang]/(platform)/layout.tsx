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
        <PlatformHeader
          dictionary={dict}
          locale={lang}
          userRole={session.user.role}
        />
        <div className="flex pt-6">
          <PlatformSidebar
            dictionary={dict}
            locale={lang}
            userRole={session.user.role}
            side={rtl ? "right" : "left"}
          />
          <PageHeadingProvider>
            <div className="dashboard-container overflow-hidden pb-10 transition-[margin] duration-200 ease-in-out">
              {children}
            </div>
          </PageHeadingProvider>
        </div>
      </div>
    </SidebarProvider>
  )
}
