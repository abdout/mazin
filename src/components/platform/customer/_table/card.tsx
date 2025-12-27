"use client"

import Link from "next/link"
import {
  IconMail,
  IconPhone,
  IconBuilding,
  IconUser,
  IconFileInvoice,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Dictionary, Locale } from "@/components/internationalization"

import type { ClientWithInvoices } from "./columns"
import { clientStatusConfig } from "./config"

interface ClientCardProps {
  client: ClientWithInvoices
  dictionary: Dictionary
  locale: Locale
}

export function ClientCard({ client, dictionary, locale }: ClientCardProps) {
  const statusConfig = client.isActive
    ? clientStatusConfig.active
    : clientStatusConfig.inactive
  const StatusIcon = statusConfig.icon
  const statusLabel = client.isActive
    ? dictionary.customer?.active || "Active"
    : dictionary.customer?.inactive || "Inactive"

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link href={`/${locale}/customer/${client.id}`}>
              <CardTitle className="text-lg hover:underline cursor-pointer">
                {client.companyName}
              </CardTitle>
            </Link>
            <Badge className={statusConfig.className}>
              <StatusIcon className="size-3 me-1" />
              {statusLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <IconFileInvoice className="size-4" />
            <span className="text-sm tabular-nums">
              {client.invoices.length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact Name */}
        {client.contactName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconUser className="size-4 shrink-0" />
            <span className="truncate">{client.contactName}</span>
          </div>
        )}

        {/* Email */}
        {client.email && (
          <div className="flex items-center gap-2 text-sm">
            <IconMail className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={`mailto:${client.email}`}
              className="truncate text-muted-foreground hover:underline"
            >
              {client.email}
            </a>
          </div>
        )}

        {/* Phone */}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm">
            <IconPhone className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={`tel:${client.phone}`}
              className="text-muted-foreground hover:underline"
            >
              {client.phone}
            </a>
          </div>
        )}

        {/* City/Country */}
        {(client.billingCity || client.billingCountry) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconBuilding className="size-4 shrink-0" />
            <span>
              {[client.billingCity, client.billingCountry]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        )}

        {/* Created Date */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          {dictionary.common?.createdAt || "Created"}:{" "}
          {new Date(client.createdAt).toLocaleDateString(
            locale === "ar" ? "ar-SA" : "en-US"
          )}
        </div>
      </CardContent>
    </Card>
  )
}
