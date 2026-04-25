import { notFound } from "next/navigation"

import PageHeading from "@/components/atom/page-heading"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShipment } from "@/components/platform/shipments/actions"
import { StageTimeline } from "@/components/platform/shipments/stage-timeline"

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { id } = await params
  const shipment = await getShipment(id)
  if (!shipment) notFound()

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
            <CardTitle className="text-sm text-muted-foreground">Parties</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">Shipper:</span> {shipment.consignor}</div>
            <div><span className="text-muted-foreground">Consignee:</span> {shipment.consignee}</div>
            {shipment.client && (
              <div><span className="text-muted-foreground">Client:</span> {shipment.client.companyName}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cargo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {shipment.vesselName && <div><span className="text-muted-foreground">Vessel:</span> {shipment.vesselName}</div>}
            {shipment.containerNumber && <div><span className="text-muted-foreground">Container:</span> {shipment.containerNumber}</div>}
            {shipment.weight && <div><span className="text-muted-foreground">Weight:</span> {String(shipment.weight)} kg</div>}
            {shipment.quantity && <div><span className="text-muted-foreground">Quantity:</span> {shipment.quantity}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Dates</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {shipment.arrivalDate && <div><span className="text-muted-foreground">Arrival:</span> {new Date(shipment.arrivalDate).toLocaleDateString()}</div>}
            {shipment.departureDate && <div><span className="text-muted-foreground">Departure:</span> {new Date(shipment.departureDate).toLocaleDateString()}</div>}
            <div><span className="text-muted-foreground">Free days:</span> {shipment.freeDays ?? 14}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clearance stages</CardTitle>
        </CardHeader>
        <CardContent>
          <StageTimeline shipmentId={shipment.id} stages={shipment.trackingStages} />
        </CardContent>
      </Card>
    </div>
  )
}
