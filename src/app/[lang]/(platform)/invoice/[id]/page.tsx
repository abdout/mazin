import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { getInvoiceWithSettings } from "@/actions/invoice"
import { InvoiceDetail } from "@/components/platform/invoice/invoice-detail"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)

  try {
    const { invoice, settings } = await getInvoiceWithSettings(id)

    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${locale}/invoice`}>{dict.invoices.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{invoice.invoiceNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <InvoiceDetail
            invoice={invoice}
            settings={settings}
            dictionary={dict}
            locale={locale}
          />
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
