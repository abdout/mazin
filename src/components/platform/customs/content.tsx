import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import PageHeading from "@/components/atom/page-heading"
import type { Locale } from "@/components/internationalization"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { listAcds } from "./actions"

type Dict = Awaited<ReturnType<typeof getDictionary>>

export async function CustomsContent({ lang, dict }: { lang: Locale; dict: Dict }) {
  const acds = await listAcds()

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 flex items-start justify-between">
        <PageHeading
          title={dict.customs?.title ?? "Customs"}
          description={`${acds.length} ACDs`}
        />
        <Button asChild>
          <Link href={`/${lang}/customs/new`}>
            <Plus className="h-4 w-4 me-2" />
            {dict.customs?.newDeclaration ?? "New ACD"}
          </Link>
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        {acds.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            {dict.common?.noResults ?? "No ACDs yet."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ACN Number</TableHead>
                <TableHead>Shipment</TableHead>
                <TableHead>Consignee</TableHead>
                <TableHead>Vessel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acds.map(acd => (
                <TableRow key={acd.id}>
                  <TableCell className="font-mono text-xs">{acd.acnNumber}</TableCell>
                  <TableCell>{acd.shipment.shipmentNumber}</TableCell>
                  <TableCell>{acd.consignee}</TableCell>
                  <TableCell>{acd.vesselName}</TableCell>
                  <TableCell>
                    <Badge variant={acd.status === "VALIDATED" ? "default" : "secondary"}>
                      {acd.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {acd.estimatedArrival
                      ? new Date(acd.estimatedArrival).toLocaleDateString(lang)
                      : "—"}
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
