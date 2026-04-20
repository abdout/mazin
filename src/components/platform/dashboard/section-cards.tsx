"use client"

import {
  IconTrendingDown,
  IconTrendingUp,
  IconShip,
  IconTruck,
  IconFileDescription,
  IconReceipt,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization"

interface SectionCardsProps {
  dictionary: Dictionary
  stats: {
    totalShipments: { value: number; trend: number }
    inTransit: { value: number; trend: number }
    pendingCustoms: { value: number; trend: number }
    unpaidInvoices: { value: string; trend: number }
  }
}

export function SectionCards({ dictionary, stats }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{dictionary.dashboard.totalShipments}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalShipments.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.totalShipments.trend >= 0 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {stats.totalShipments.trend >= 0 ? "+" : ""}
              {stats.totalShipments.trend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.totalShipments.trend >= 0
              ? dictionary.dashboard.trendingUp
              : dictionary.dashboard.trendingDown}
            {stats.totalShipments.trend >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <IconShip className="size-4" />
            {dictionary.navigation.shipments}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{dictionary.dashboard.inTransit}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.inTransit.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.inTransit.trend >= 0 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {stats.inTransit.trend >= 0 ? "+" : ""}
              {stats.inTransit.trend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.inTransit.trend >= 0
              ? dictionary.dashboard.trendingUp
              : dictionary.dashboard.trendingDown}
            {stats.inTransit.trend >= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <IconTruck className="size-4" />
            {dictionary.shipments.status}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{dictionary.dashboard.pendingCustoms}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.pendingCustoms.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.pendingCustoms.trend >= 0 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {stats.pendingCustoms.trend >= 0 ? "+" : ""}
              {stats.pendingCustoms.trend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.pendingCustoms.trend <= 0
              ? dictionary.dashboard.trendingUp
              : dictionary.dashboard.trendingDown}
            {stats.pendingCustoms.trend <= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <IconFileDescription className="size-4" />
            {dictionary.navigation.customs}
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{dictionary.dashboard.unpaidInvoices}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.unpaidInvoices.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.unpaidInvoices.trend >= 0 ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {stats.unpaidInvoices.trend >= 0 ? "+" : ""}
              {stats.unpaidInvoices.trend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.unpaidInvoices.trend <= 0
              ? dictionary.dashboard.trendingUp
              : dictionary.dashboard.trendingDown}
            {stats.unpaidInvoices.trend <= 0 ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <IconReceipt className="size-4" />
            {dictionary.navigation.invoices}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
