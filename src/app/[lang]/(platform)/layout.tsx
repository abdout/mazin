import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/template/sidebar/app-sidebar"
import { AppHeader } from "@/components/template/header/app-header"

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

  if (!session) {
    redirect(`/${lang}/login`)
  }

  const dict = await getDictionary(lang)

  return (
    <SidebarProvider>
      <AppSidebar dictionary={dict} locale={lang} />
      <main className="flex-1 flex flex-col">
        <AppHeader dictionary={dict} locale={lang} user={session.user} />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
