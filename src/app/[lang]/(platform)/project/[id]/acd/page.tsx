import React from 'react'
import { db } from '@/lib/db'
import { auth } from '@/auth'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization'
import { Badge } from '@/components/ui/badge'
import AcdForm from '@/components/platform/project/acd/form'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

export default async function ProjectACD({ params }: PageProps) {
  const { id, lang } = await params
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const af = dict.project?.acdForm

  const session = await auth()
  const userId = session?.user?.id

  const project = await db.project.findUnique({
    where: { id },
    include: {
      shipment: {
        select: {
          id: true,
          vesselName: true,
          consignee: true,
          consignor: true,
        },
      },
    },
  })

  const shipmentId = project?.shipment?.id ?? null

  const acd =
    shipmentId && userId
      ? await db.advanceCargoDeclaration.findFirst({
          where: { shipmentId, userId },
          orderBy: { createdAt: 'desc' },
        })
      : null

  const locked = !!acd && acd.status !== 'DRAFT'

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {af?.title ?? 'Advance Cargo Declaration'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {af?.description ?? 'Submit and manage ACD for this project'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {af?.statusBadge ?? 'Status'}:
          </span>
          <Badge variant={acd ? 'secondary' : 'outline'}>
            {acd ? acd.status : af?.statusPending ?? 'No ACD yet'}
          </Badge>
        </div>
      </div>

      {!shipmentId ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground">
          {af?.noShipment ?? 'An ACD cannot be created without a linked shipment.'}
        </div>
      ) : (
        <AcdForm
          shipmentId={shipmentId}
          locked={locked}
          initial={
            acd
              ? {
                  id: acd.id,
                  acnNumber: acd.acnNumber,
                  consignee: acd.consignee,
                  consignor: acd.consignor,
                  hsCode: acd.hsCode,
                  cargoDescription: acd.cargoDescription,
                  estimatedWeight: acd.estimatedWeight.toString(),
                  quantity: acd.quantity ?? undefined,
                  vesselName: acd.vesselName,
                  voyageNumber: acd.voyageNumber ?? '',
                  portOfLoading: acd.portOfLoading,
                  portOfDischarge: acd.portOfDischarge,
                  estimatedArrival: acd.estimatedArrival
                    ? new Date(acd.estimatedArrival).toISOString().slice(0, 10)
                    : '',
                }
              : {
                  consignee: project?.shipment?.consignee ?? '',
                  consignor: project?.shipment?.consignor ?? '',
                  vesselName: project?.shipment?.vesselName ?? '',
                  portOfDischarge: 'Port Sudan',
                }
          }
          labels={{
            acnNumber: af?.acnNumber ?? 'ACN Number',
            consignee: af?.consignee ?? 'Consignee',
            consignor: af?.consignor ?? 'Consignor',
            hsCode: af?.hsCode ?? 'HS Code',
            cargoDescription: af?.cargoDescription ?? 'Cargo Description',
            estimatedWeight: af?.estimatedWeight ?? 'Estimated Weight (kg)',
            quantity: af?.quantity ?? 'Quantity',
            vesselName: af?.vesselName ?? 'Vessel Name',
            voyageNumber: af?.voyageNumber ?? 'Voyage Number',
            portOfLoading: af?.portOfLoading ?? 'Port of Loading',
            portOfDischarge: af?.portOfDischarge ?? 'Port of Discharge',
            estimatedArrival: af?.estimatedArrival ?? 'Estimated Arrival',
            create: af?.create ?? 'Create ACD',
            update: af?.update ?? 'Update ACD',
            saving: af?.saving ?? 'Saving…',
            lockedNotice:
              af?.lockedNotice ?? 'ACD can only be edited while in DRAFT status.',
            errorGeneric: af?.errorGeneric ?? 'Failed to save the ACD.',
          }}
        />
      )}
    </div>
  )
}
