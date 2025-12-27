import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { InvoiceForm } from "@/components/platform/invoice/invoice-form"
import { getInvoice } from "@/actions/invoice"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import PageHeading from "@/components/atom/page-heading"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const session = await auth()

  const invoice = await getInvoice(id)

  if (!invoice) {
    notFound()
  }

  // Business rule: Cannot edit PAID or CANCELLED invoices
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    redirect(`/${locale}/invoices/${id}?error=cannot_edit`)
  }

  const shipments = await db.shipment.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${locale}/invoices`}>{dict.invoices.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${locale}/invoices/${id}`}>{invoice.invoiceNumber}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{dict.invoices.editInvoice}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <PageHeading title={dict.invoices.editInvoice} />
      </div>
      <div className="px-4 lg:px-6">
        <InvoiceForm
          dictionary={dict}
          locale={locale}
          shipments={shipments}
          invoice={invoice}
          mode="edit"
        />
      </div>
    </div>
  )
}
