import Link from "next/link"
import { Plus } from "lucide-react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Button } from "@/components/ui/button"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import ProjectList from "@/components/platform/project/content"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  const nav = (dict.project?.nav ?? {}) as Record<string, string | undefined>
  const navItems: PageNavItem[] = [
    { name: nav.all ?? "All", href: `/${locale}/project` },
    { name: nav.active ?? "Active", href: `/${locale}/project?status=active` },
    { name: nav.completed ?? "Completed", href: `/${locale}/project?status=completed` },
    { name: nav.archived ?? "Archived", href: `/${locale}/project?status=archived` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <PageHeading title={dict.project?.title ?? "Projects"} />
          <Button asChild>
            <Link href={`/${locale}/project/new`}>
              <Plus className="h-4 w-4 me-2" />
              {dict.project?.newProject ?? "New Project"}
            </Link>
          </Button>
        </div>
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <ProjectList />
      </div>
    </div>
  )
}
