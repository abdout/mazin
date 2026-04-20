"use client"

import { useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconCheck,
  IconCircleCheckFilled,
  IconClock,
  IconEdit,
  IconFileOff,
  IconSend,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateInvoiceStatus } from "@/actions/invoice"
import { InvoiceActions } from "./invoice-actions"
import type { Invoice, InvoiceItem, Shipment, Client, CompanySettings } from "@prisma/client"
import type { Dictionary, Locale } from "@/components/internationalization"

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[]
  shipment: Shipment | null
  client: Client | null
}

interface InvoiceDetailProps {
  invoice: InvoiceWithRelations
  settings?: CompanySettings | null
  dictionary: Dictionary
  locale: Locale
}

type IconComponent = React.ComponentType<{ className?: string }>

const statusConfig: Record<
  string,
  { icon: IconComponent; className: string }
> = {
  DRAFT: { icon: IconEdit, className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  SENT: { icon: IconSend, className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  PAID: { icon: IconCircleCheckFilled, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  OVERDUE: { icon: IconClock, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  CANCELLED: { icon: IconFileOff, className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500" },
}

export function InvoiceDetail({ invoice, settings, dictionary, locale }: InvoiceDetailProps) {
  const router = useRouter()
  const config = statusConfig[invoice.status]
  const StatusIcon: IconComponent = config?.icon || IconEdit

  return (
    <div className="space-y-6 invoice-print">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="back-button">
            <IconArrowLeft className="rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <Badge className={config?.className}>
              <StatusIcon className="size-3 me-1" />
              {dictionary.invoices.statuses?.[invoice.status as keyof typeof dictionary.invoices.statuses] || invoice.status}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <InvoiceActions
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            invoiceStatus={invoice.status}
            clientEmail={invoice.client?.email}
            total={Number(invoice.total)}
            currency={invoice.currency}
            dictionary={dictionary}
            locale={locale}
          />
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <Button onClick={() => updateInvoiceStatus(invoice.id, "PAID")}>
              <IconCheck className="size-4" />
              {dictionary.invoices.markAsPaid}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.invoices.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {dictionary.invoices.invoiceNumber}
                </p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dictionary.invoices.currency}
                </p>
                <p className="font-medium">{invoice.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dictionary.common.createdAt}
                </p>
                <p className="font-medium">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {dictionary.invoices.dueDate}
                </p>
                <p className="font-medium">
                  {invoice.dueDate
                    ? new Date(invoice.dueDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.invoices.paidAt}
                  </p>
                  <p className="font-medium">
                    {new Date(invoice.paidAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {invoice.shipment && (
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.navigation.shipments}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.shipments.shipmentNumber}
                  </p>
                  <p className="font-medium">{invoice.shipment.shipmentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.shipments.status}
                  </p>
                  <p className="font-medium">{invoice.shipment.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {invoice.client && (
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.invoices.clientInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-lg">{invoice.client.companyName}</p>
                {invoice.client.contactName && (
                  <p className="text-sm text-muted-foreground">{invoice.client.contactName}</p>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>{invoice.client.billingAddress1}</p>
                {invoice.client.billingAddress2 && <p>{invoice.client.billingAddress2}</p>}
                <p>
                  {invoice.client.billingCity}
                  {invoice.client.billingState && `, ${invoice.client.billingState}`}
                </p>
                <p>{invoice.client.billingCountry}</p>
              </div>
              {(invoice.client.email || invoice.client.phone) && (
                <div className="text-sm space-y-1 pt-2 border-t">
                  {invoice.client.email && (
                    <p>
                      <span className="text-muted-foreground">{dictionary.common.email}: </span>
                      {invoice.client.email}
                    </p>
                  )}
                  {invoice.client.phone && (
                    <p>
                      <span className="text-muted-foreground">{dictionary.common.phone}: </span>
                      {invoice.client.phone}
                    </p>
                  )}
                </div>
              )}
              {invoice.client.taxId && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{dictionary.invoices.taxId}: </span>
                  {invoice.client.taxId}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.invoices.lineItems}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dictionary.invoices.itemDescription}</TableHead>
                <TableHead className="text-end">
                  {dictionary.shipments.quantity}
                </TableHead>
                <TableHead className="text-end">
                  {dictionary.invoices.unitPrice}
                </TableHead>
                <TableHead className="text-end">
                  {dictionary.invoices.total}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {invoice.currency} {Number(item.unitPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-end font-medium tabular-nums">
                    {invoice.currency} {Number(item.total).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-8">
              <span className="text-muted-foreground">
                {dictionary.invoices.subtotal}:
              </span>
              <span className="font-medium tabular-nums">
                {invoice.currency} {Number(invoice.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-8">
              <span className="text-muted-foreground">
                {dictionary.invoices.tax}:
              </span>
              <span className="font-medium tabular-nums">
                {invoice.currency} {Number(invoice.tax).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-8 text-xl font-bold">
              <span>{dictionary.invoices.total}:</span>
              <span className="tabular-nums">
                {invoice.currency} {Number(invoice.total).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.invoices.notes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
