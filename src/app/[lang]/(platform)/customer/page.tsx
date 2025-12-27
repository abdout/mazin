import Link from "next/link"
import { Plus } from "lucide-react"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { getClients } from "@/components/platform/customer/actions"
import { CustomerTable } from "@/components/platform/customer/customer-table"
import PageHeading from "@/components/atom/page-heading"
import { Button } from "@/components/ui/button"

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const clients = await getClients()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <PageHeading title={dict.customer?.title || "Customers"} />
          <Button asChild>
            <Link href={`/${locale}/customer/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {dict.customer?.newCustomer || "New Customer"}
            </Link>
          </Button>
        </div>
      </div>
      <div className="px-4 lg:px-6">
        <CustomerTable data={clients} dictionary={dict} locale={locale} />
      </div>
    </div>
  )
}
