// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"
import { CircleArrowUp } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"

import { depositToWallet } from "./actions"

type Locale = "ar" | "en"

interface DepositDialogProps {
  walletId: string
  clientName: string
  currency: string
  locale: Locale
  dict: Record<string, unknown> | undefined
}

function formatDeposit(dict: Record<string, unknown> | undefined) {
  return (dict?.deposit ?? {}) as Record<string, string>
}

function formatActions(dict: Record<string, unknown> | undefined) {
  return (dict?.actions ?? {}) as Record<string, string>
}

export function DepositDialog({
  walletId,
  clientName,
  currency,
  locale: _locale,
  dict,
}: DepositDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [reference, setReference] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})
  const [saving, startTransition] = React.useTransition()

  const d = formatDeposit(dict)
  const a = formatActions(dict)

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setFieldErrors({})
      const num = Number(amount.replace(",", "."))
      if (!Number.isFinite(num) || num <= 0) {
        setFieldErrors({ amount: ["Invalid amount"] })
        return
      }
      startTransition(async () => {
        const res = await depositToWallet({
          walletId,
          amount: num,
          reference,
          notes,
        })
        if (res.ok) {
          toast.success(d.success ?? "Deposit recorded")
          setAmount("")
          setReference("")
          setNotes("")
          setOpen(false)
        } else if (res.issues) {
          setFieldErrors(res.issues)
        } else {
          toast.error(d.failed ?? "Could not record deposit")
        }
      })
    },
    [amount, reference, notes, walletId, d]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CircleArrowUp className="size-4" aria-hidden />
          {a.deposit ?? "Top up"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{d.title ?? "Top up wallet"}</DialogTitle>
            <DialogDescription>
              {d.description ?? ""}{" "}
              <span className="font-medium text-foreground">{clientName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deposit-amount">
                {d.amountLabel ?? "Amount"} ({currency})
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!!fieldErrors.amount}
                dir="ltr"
                required
                disabled={saving}
              />
              {fieldErrors.amount ? (
                <p className="text-xs text-destructive">
                  {fieldErrors.amount[0]}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{d.amountHelp}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit-ref">{d.referenceLabel ?? "Reference"}</Label>
              <Input
                id="deposit-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={d.referencePlaceholder}
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit-notes">{d.notesLabel ?? "Notes"}</Label>
              <Textarea
                id="deposit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={saving}>
                {a.cancel ?? "Cancel"}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? a.saving ?? "Saving…" : a.save ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
