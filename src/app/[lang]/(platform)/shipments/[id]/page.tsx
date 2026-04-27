import { notFound } from "next/navigation"

import PageHeading from "@/components/atom/page-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShipment } from "@/components/platform/shipments/actions"
import { StageTimeline } from "@/components/platform/shipments/stage-timeline"
import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization"

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { id, lang } = await params
  const [shipment, dict] = await Promise.all([
    getShipment(id),
    getDictionary(lang as Locale),
  ])
  if (!shipment) notFound()

  const t = dict.shipments?.detail

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6">
      <div className="flex items-start justify-between">
        <PageHeading
          title={shipment.shipmentNumber}
          description={shipment.description}
        />
        <Badge variant="secondary">{shipment.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t?.parties ?? "Parties"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">{t?.shipper ?? "Shipper"}:</span> {shipment.consignor}</div>
            <div><span className="text-muted-foreground">{t?.consignee ?? "Consignee"}:</span> {shipment.consignee}</div>
            {shipment.client && (
              <div><span className="text-muted-foreground">{t?.client ?? "Client"}:</span> {shipment.client.companyName}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t?.cargo ?? "Cargo"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {shipment.vesselName && <div><span className="text-muted-foreground">{t?.vessel ?? "Vessel"}:</span> {shipment.vesselName}</div>}
            {shipment.containerNumber && <div><span className="text-muted-foreground">{t?.container ?? "Container"}:</span> {shipment.containerNumber}</div>}
            {shipment.weight && <div><span className="text-muted-foreground">{t?.weight ?? "Weight"}:</span> {String(shipment.weight)} kg</div>}
            {shipment.quantity && <div><span className="text-muted-foreground">{t?.quantity ?? "Quantity"}:</span> {shipment.quantity}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t?.dates ?? "Dates"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {shipment.arrivalDate && <div><span className="text-muted-foreground">{t?.arrival ?? "Arrival"}:</span> {new Date(shipment.arrivalDate).toLocaleDateString(lang === "ar" ? "ar-SD" : "en-US")}</div>}
            {shipment.departureDate && <div><span className="text-muted-foreground">{t?.departure ?? "Departure"}:</span> {new Date(shipment.departureDate).toLocaleDateString(lang === "ar" ? "ar-SD" : "en-US")}</div>}
            <div><span className="text-muted-foreground">{t?.freeDays ?? "Free days"}:</span> {shipment.freeDays ?? 14}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t?.clearanceStages ?? "Clearance stages"}</CardTitle>
        </CardHeader>
        <CardContent>
          <StageTimeline shipmentId={shipment.id} stages={shipment.trackingStages} />
        </CardContent>
      </Card>
    </div>
  )
}
