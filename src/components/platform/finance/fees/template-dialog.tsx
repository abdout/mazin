// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { createFeeTemplate, updateFeeTemplate } from "./actions"
import { FEE_TYPES, CALC_TYPES } from "./config"
import type { FeeTemplateDTO } from "./types"

type Locale = "ar" | "en"

interface TemplateDialogProps {
  locale: Locale
  dict: Record<string, unknown> | undefined
  existing?: FeeTemplateDTO
  trigger?: React.ReactNode
}

function formatDialog(dict: Record<string, unknown> | undefined) {
  return (dict?.dialog ?? {}) as Record<string, string>
}

interface FormState {
  code: string
  name: string
  nameAr: string
  description: string
  feeType: string
  calculationType: string
  amount: string
  percentage: string
  minAmount: string
  maxAmount: string
  isGovernmentFee: boolean
  isTaxable: boolean
  taxRate: string
  isActive: boolean
}

function initialFromExisting(t?: FeeTemplateDTO): FormState {
  return {
    code: t?.code ?? "",
    name: t?.name ?? "",
    nameAr: t?.nameAr ?? "",
    description: t?.description ?? "",
    feeType: t?.feeType ?? "CLEARANCE_SERVICE",
    calculationType: t?.calculationType ?? "FIXED",
    amount: t?.amount != null ? String(t.amount) : "",
    // Stored as 0-1 decimal — surface as 0-100 for the form.
    percentage:
      t?.percentage != null ? String(Number((t.percentage * 100).toFixed(4))) : "",
    minAmount: t?.minAmount != null ? String(t.minAmount) : "",
    maxAmount: t?.maxAmount != null ? String(t.maxAmount) : "",
    isGovernmentFee: t?.isGovernmentFee ?? false,
    isTaxable: t?.isTaxable ?? false,
    taxRate: t?.taxRate != null ? String(t.taxRate) : "",
    isActive: t?.isActive ?? true,
  }
}

function toPayload(state: FormState) {
  const num = (s: string) =>
    s.trim() === "" ? null : Number.isFinite(Number(s)) ? Number(s) : null
  return {
    code: state.code,
    name: state.name,
    nameAr: state.nameAr || undefined,
    description: state.description || undefined,
    feeType: state.feeType,
    calculationType: state.calculationType,
    amount: num(state.amount),
    percentage: num(state.percentage),
    minAmount: num(state.minAmount),
    maxAmount: num(state.maxAmount),
    isGovernmentFee: state.isGovernmentFee,
    isTaxable: state.isTaxable,
    taxRate: num(state.taxRate),
    isActive: state.isActive,
  }
}

export function TemplateDialog({ locale, dict, existing, trigger }: TemplateDialogProps) {
  const d = formatDialog(dict)
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<FormState>(() =>
    initialFromExisting(existing)
  )
  const [saving, startTransition] = React.useTransition()
  const feeTypes = (dict?.feeTypes ?? {}) as Record<string, string>
  const calcTypes = (dict?.calculationTypes ?? {}) as Record<string, string>

  // Reset form when switching between "create" and "edit existing".
  React.useEffect(() => {
    if (open) setState(initialFromExisting(existing))
  }, [open, existing])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const payload = toPayload(state)
      const res = existing
        ? await updateFeeTemplate(existing.id, payload)
        : await createFeeTemplate(payload)
      if (res.success) {
        toast.success(
          existing
            ? d.successUpdated ?? "Template updated"
            : d.successCreated ?? "Template created"
        )
        setOpen(false)
      } else {
        toast.error(res.error ?? d.failed ?? "Failed")
      }
    })
  }

  const showAmount =
    state.calculationType === "FIXED" ||
    state.calculationType === "PER_UNIT" ||
    state.calculationType === "PER_CONTAINER" ||
    state.calculationType === "PER_WEIGHT"
  const showPercentage = state.calculationType === "PERCENTAGE_OF_VALUE"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            {(dict?.newTemplate as string) ?? "New template"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{d.title ?? "Fee template"}</DialogTitle>
            <DialogDescription>{d.description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fee-code">{d.codeLabel}</Label>
              <Input
                id="fee-code"
                value={state.code}
                onChange={(e) =>
                  setState((s) => ({ ...s, code: e.target.value.toUpperCase() }))
                }
                placeholder={d.codePlaceholder}
                dir="ltr"
                required
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fee-feeType">{d.feeTypeLabel}</Label>
              <Select
                value={state.feeType}
                onValueChange={(v) => setState((s) => ({ ...s, feeType: v }))}
                disabled={saving}
              >
                <SelectTrigger id="fee-feeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEE_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft}>
                      {feeTypes[ft] ?? ft}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fee-name">{d.nameLabel}</Label>
              <Input
                id="fee-name"
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fee-nameAr">{d.nameArLabel}</Label>
              <Input
                id="fee-nameAr"
                value={state.nameAr}
                onChange={(e) => setState((s) => ({ ...s, nameAr: e.target.value }))}
                dir="rtl"
                disabled={saving}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="fee-desc">{d.descriptionLabel}</Label>
              <Textarea
                id="fee-desc"
                rows={2}
                value={state.description}
                onChange={(e) =>
                  setState((s) => ({ ...s, description: e.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fee-calc">{d.calculationTypeLabel}</Label>
              <Select
                value={state.calculationType}
                onValueChange={(v) =>
                  setState((s) => ({ ...s, calculationType: v }))
                }
                disabled={saving}
              >
                <SelectTrigger id="fee-calc">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALC_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {calcTypes[ct] ?? ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showAmount && (
              <div className="grid gap-2">
                <Label htmlFor="fee-amount">{d.amountLabel}</Label>
                <Input
                  id="fee-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={state.amount}
                  onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
                  dir="ltr"
                  disabled={saving}
                />
              </div>
            )}
            {showPercentage && (
              <div className="grid gap-2">
                <Label htmlFor="fee-pct">{d.percentageLabel}</Label>
                <Input
                  id="fee-pct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={state.percentage}
                  onChange={(e) =>
                    setState((s) => ({ ...s, percentage: e.target.value }))
                  }
                  dir="ltr"
                  disabled={saving}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="fee-min">{d.minAmountLabel}</Label>
              <Input
                id="fee-min"
                type="number"
                step="0.01"
                min="0"
                value={state.minAmount}
                onChange={(e) =>
                  setState((s) => ({ ...s, minAmount: e.target.value }))
                }
                dir="ltr"
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fee-max">{d.maxAmountLabel}</Label>
              <Input
                id="fee-max"
                type="number"
                step="0.01"
                min="0"
                value={state.maxAmount}
                onChange={(e) =>
                  setState((s) => ({ ...s, maxAmount: e.target.value }))
                }
                dir="ltr"
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <div>
                <Label htmlFor="fee-gov">{d.isGovernmentFeeLabel}</Label>
              </div>
              <Switch
                id="fee-gov"
                checked={state.isGovernmentFee}
                onCheckedChange={(c) =>
                  setState((s) => ({ ...s, isGovernmentFee: c }))
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="fee-tax">{d.isTaxableLabel}</Label>
              </div>
              <Switch
                id="fee-tax"
                checked={state.isTaxable}
                onCheckedChange={(c) =>
                  setState((s) => ({ ...s, isTaxable: c }))
                }
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fee-taxRate">{d.taxRateLabel}</Label>
              <Input
                id="fee-taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={state.taxRate}
                onChange={(e) =>
                  setState((s) => ({ ...s, taxRate: e.target.value }))
                }
                dir="ltr"
                disabled={saving || !state.isTaxable}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <Label htmlFor="fee-active">{d.isActiveLabel}</Label>
              <Switch
                id="fee-active"
                checked={state.isActive}
                onCheckedChange={(c) =>
                  setState((s) => ({ ...s, isActive: c }))
                }
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={saving}>
                {d.cancel ?? "Cancel"}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? d.saving ?? "Saving…" : d.save ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
