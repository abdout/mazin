import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { TaskPageClient } from "@/components/platform/task/task-page-client"

export default async function TaskPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  const nav = (dict.task?.nav ?? {}) as Record<string, string | undefined>
  const navItems: PageNavItem[] = [
    { name: nav.all ?? "All", href: `/${locale}/task` },
    { name: nav.pending ?? "Pending", href: `/${locale}/task?status=pending` },
    { name: nav.inProgress ?? "In Progress", href: `/${locale}/task?status=in_progress` },
    { name: nav.done ?? "Done", href: `/${locale}/task?status=done` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <PageHeading title={dict.task?.title ?? "Tasks"} />
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <TaskPageClient dictionary={dict} />
      </div>
    </div>
  )
}
