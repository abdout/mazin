import Link from "next/link"
import { Plus } from "lucide-react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Button } from "@/components/ui/button"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"

export default async function CustomsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  const navItems: PageNavItem[] = [
    { name: dict.customs?.nav?.all || "All", href: `/${locale}/customs` },
    { name: dict.customs?.nav?.pending || "Pending", href: `/${locale}/customs?status=pending` },
    { name: dict.customs?.nav?.cleared || "Cleared", href: `/${locale}/customs?status=cleared` },
    { name: dict.customs?.nav?.held || "Held", href: `/${locale}/customs?status=held` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <PageHeading title={dict.customs?.title || "Customs"} />
          <Button asChild>
            <Link href={`/${locale}/customs/new`}>
              <Plus className="h-4 w-4 me-2" />
              {dict.customs?.newDeclaration || "New Declaration"}
            </Link>
          </Button>
        </div>
        <PageNav pages={navItems} className="mt-4" />
      </div>
      <div className="px-4 lg:px-6">
        <div className="text-muted-foreground">
          {dict.common?.noResults || "No results found."}
        </div>
      </div>
    </div>
  )
}
