'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createACD, updateACD } from '@/actions/acd'

interface AcdFormInitial {
  id?: string
  acnNumber?: string
  consignee?: string
  consignor?: string
  hsCode?: string
  cargoDescription?: string
  estimatedWeight?: string
  quantity?: number
  vesselName?: string
  voyageNumber?: string
  portOfLoading?: string
  portOfDischarge?: string
  estimatedArrival?: string
}

interface AcdFormLabels {
  acnNumber: string
  consignee: string
  consignor: string
  hsCode: string
  cargoDescription: string
  estimatedWeight: string
  quantity: string
  vesselName: string
  voyageNumber: string
  portOfLoading: string
  portOfDischarge: string
  estimatedArrival: string
  create: string
  update: string
  saving: string
  lockedNotice: string
  errorGeneric: string
}

interface AcdFormProps {
  shipmentId: string
  initial: AcdFormInitial
  labels: AcdFormLabels
  locked?: boolean
}

export default function AcdForm({
  shipmentId,
  initial,
  labels,
  locked = false,
}: AcdFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    consignee: initial.consignee ?? '',
    consignor: initial.consignor ?? '',
    hsCode: initial.hsCode ?? '',
    cargoDescription: initial.cargoDescription ?? '',
    estimatedWeight: initial.estimatedWeight ?? '',
    quantity: initial.quantity !== undefined ? String(initial.quantity) : '',
    vesselName: initial.vesselName ?? '',
    voyageNumber: initial.voyageNumber ?? '',
    portOfLoading: initial.portOfLoading ?? '',
    portOfDischarge: initial.portOfDischarge ?? 'Port Sudan',
    estimatedArrival: initial.estimatedArrival ?? '',
  })

  const handleChange = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const payload = {
          consignee: form.consignee,
          consignor: form.consignor,
          hsCode: form.hsCode,
          cargoDescription: form.cargoDescription,
          estimatedWeight: form.estimatedWeight,
          quantity: form.quantity ? Number(form.quantity) : undefined,
          vesselName: form.vesselName,
          voyageNumber: form.voyageNumber || undefined,
          portOfLoading: form.portOfLoading,
          portOfDischarge: form.portOfDischarge || 'Port Sudan',
          estimatedArrival: form.estimatedArrival || undefined,
        }

        if (initial.id) {
          await updateACD(initial.id, payload)
        } else {
          await createACD({
            shipmentId,
            ...payload,
          })
        }
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : labels.errorGeneric
        setError(message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {locked && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200 px-4 py-3 text-sm">
          {labels.lockedNotice}
        </div>
      )}

      {initial.acnNumber && (
        <div className="p-4 border rounded-xl bg-muted/30">
          <p className="text-xs text-muted-foreground">{labels.acnNumber}</p>
          <p className="text-lg font-semibold font-mono mt-1">
            {initial.acnNumber}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="consignee">{labels.consignee}</Label>
          <Input
            id="consignee"
            value={form.consignee}
            onChange={handleChange('consignee')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="consignor">{labels.consignor}</Label>
          <Input
            id="consignor"
            value={form.consignor}
            onChange={handleChange('consignor')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hsCode">{labels.hsCode}</Label>
          <Input
            id="hsCode"
            value={form.hsCode}
            onChange={handleChange('hsCode')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cargoDescription">{labels.cargoDescription}</Label>
          <Input
            id="cargoDescription"
            value={form.cargoDescription}
            onChange={handleChange('cargoDescription')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedWeight">{labels.estimatedWeight}</Label>
          <Input
            id="estimatedWeight"
            type="number"
            step="0.01"
            value={form.estimatedWeight}
            onChange={handleChange('estimatedWeight')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">{labels.quantity}</Label>
          <Input
            id="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange('quantity')}
            disabled={locked || pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vesselName">{labels.vesselName}</Label>
          <Input
            id="vesselName"
            value={form.vesselName}
            onChange={handleChange('vesselName')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="voyageNumber">{labels.voyageNumber}</Label>
          <Input
            id="voyageNumber"
            value={form.voyageNumber}
            onChange={handleChange('voyageNumber')}
            disabled={locked || pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portOfLoading">{labels.portOfLoading}</Label>
          <Input
            id="portOfLoading"
            value={form.portOfLoading}
            onChange={handleChange('portOfLoading')}
            disabled={locked || pending}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="portOfDischarge">{labels.portOfDischarge}</Label>
          <Input
            id="portOfDischarge"
            value={form.portOfDischarge}
            onChange={handleChange('portOfDischarge')}
            disabled={locked || pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimatedArrival">{labels.estimatedArrival}</Label>
          <Input
            id="estimatedArrival"
            type="date"
            value={form.estimatedArrival}
            onChange={handleChange('estimatedArrival')}
            disabled={locked || pending}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={locked || pending}>
          {pending
            ? labels.saving
            : initial.id
            ? labels.update
            : labels.create}
        </Button>
      </div>
    </form>
  )
}
