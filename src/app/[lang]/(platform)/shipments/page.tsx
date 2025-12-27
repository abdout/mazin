import Link from "next/link"
import { Plus } from "lucide-react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Button } from "@/components/ui/button"
import PageHeading from "@/components/atom/page-heading"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"

export default async function ShipmentsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  const navItems: PageNavItem[] = [
    { name: dict.shipments?.nav?.all || "All", href: `/${locale}/shipments` },
    { name: dict.shipments?.nav?.pending || "Pending", href: `/${locale}/shipments?status=pending` },
    { name: dict.shipments?.nav?.inTransit || "In Transit", href: `/${locale}/shipments?status=in-transit` },
    { name: dict.shipments?.nav?.delivered || "Delivered", href: `/${locale}/shipments?status=delivered` },
  ]

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <PageHeading title={dict.shipments?.title || "Shipments"} />
          <Button asChild>
            <Link href={`/${locale}/shipments/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {dict.shipments?.newShipment || "New Shipment"}
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
