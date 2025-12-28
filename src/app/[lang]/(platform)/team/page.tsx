import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { TeamPageClient } from "@/components/platform/team"

export default async function TeamPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  const navItems: PageNavItem[] = [
    { name: dict.team?.nav?.all || "All", href: `/${locale}/team` },
    { name: dict.team?.nav?.active || "Active", href: `/${locale}/team?status=active` },
    { name: dict.team?.nav?.inactive || "Inactive", href: `/${locale}/team?status=inactive` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading
          title={dict.team?.title || "Team"}
          description={dict.team?.description || "Manage your team members and their roles"}
        />
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <TeamPageClient dictionary={dict} locale={locale} />
      </div>
    </div>
  )
}
