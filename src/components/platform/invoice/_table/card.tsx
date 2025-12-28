"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Dictionary, Locale } from "@/components/internationalization"

import type { InvoiceWithRelations } from "./columns"
import { invoiceStatusConfig, type InvoiceStatusKey } from "./config"

interface InvoiceCardProps {
  invoice: InvoiceWithRelations
  dictionary: Dictionary
  locale: Locale
}

export function InvoiceCard({ invoice, dictionary, locale }: InvoiceCardProps) {
  const status = invoice.status as InvoiceStatusKey
  const config = invoiceStatusConfig[status]
  const StatusIcon = config.icon
  const statusLabel =
    dictionary.invoices?.statuses?.[status as keyof typeof dictionary.invoices.statuses] ||
    config.label

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")
  }

  return (
    <Link href={`/${locale}/invoice/${invoice.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-medium text-sm">
              {invoice.invoiceNumber}
            </span>
            <Badge className={config.className}>
              <StatusIcon className="size-3 me-1" />
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {/* Total */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {dictionary.invoices?.total || "Total"}
            </span>
            <span className="font-medium tabular-nums">
              {invoice.currency} {formatCurrency(Number(invoice.total))}
            </span>
          </div>

          {/* Client */}
          {invoice.client && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {dictionary.invoices?.client || "Client"}
              </span>
              <span className="truncate max-w-[150px]">
                {invoice.client.companyName}
              </span>
            </div>
          )}

          {/* Due Date */}
          {invoice.dueDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {dictionary.invoices?.dueDate || "Due"}
              </span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
          )}

          {/* Created */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {dictionary.common?.createdAt || "Created"}
            </span>
            <span>{formatDate(invoice.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
