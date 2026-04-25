import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import PageHeading from "@/components/atom/page-heading"
import type { Locale } from "@/components/internationalization"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { listShipments } from "./actions"

type Dict = Awaited<ReturnType<typeof getDictionary>>

export async function ShipmentsContent({ lang, dict }: { lang: Locale; dict: Dict }) {
  const { rows, total } = await listShipments({ pageSize: 50 })

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 flex items-start justify-between">
        <PageHeading
          title={dict.shipments?.title ?? "Shipments"}
          description={String(total)}
        />
        <Button asChild>
          <Link href={`/${lang}/shipments/new`}>
            <Plus className="h-4 w-4 me-2" />
            {dict.shipments?.newShipment ?? "New shipment"}
          </Link>
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        {rows.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            {dict.common?.noResults ?? "No shipments yet."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.shipments?.shipmentNumber ?? "Number"}</TableHead>
                <TableHead>{dict.shipments?.consignee ?? "Consignee"}</TableHead>
                <TableHead>{dict.shipments?.vesselName ?? "Vessel"}</TableHead>
                <TableHead>{dict.shipments?.status ?? "Status"}</TableHead>
                <TableHead>{dict.shipments?.arrivalDate ?? "Arrival"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(s => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/${lang}/shipments/${s.id}`} className="underline-offset-4 hover:underline">
                      {s.shipmentNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{s.consignee}</TableCell>
                  <TableCell className="text-muted-foreground">{s.vesselName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.arrivalDate ? new Date(s.arrivalDate).toLocaleDateString(lang) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
