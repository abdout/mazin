import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ship, Truck, FileText, Receipt } from "lucide-react"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dict = await getDictionary(lang)

  const stats = [
    {
      title: dict.dashboard.totalShipments,
      value: "0",
      icon: Ship,
    },
    {
      title: dict.dashboard.inTransit,
      value: "0",
      icon: Truck,
    },
    {
      title: dict.dashboard.pendingCustoms,
      value: "0",
      icon: FileText,
    },
    {
      title: dict.dashboard.unpaidInvoices,
      value: "SDG 0",
      icon: Receipt,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{dict.dashboard.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.recentShipments}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {dict.common.noResults}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{dict.dashboard.quickActions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {dict.dashboard.newShipment}
            </p>
            <p className="text-muted-foreground text-sm">
              {dict.dashboard.newDeclaration}
            </p>
            <p className="text-muted-foreground text-sm">
              {dict.dashboard.newInvoice}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
