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

import { createBankAccount, updateBankAccount } from "./actions"
import {
  BANK_ACCOUNT_STATUSES,
  BANK_ACCOUNT_TYPES,
  CURRENCIES,
} from "./config"
import type { BankAccountDTO } from "./types"

type Locale = "ar" | "en"

interface AccountDialogProps {
  locale: Locale
  dict: Record<string, unknown> | undefined
  existing?: BankAccountDTO
  trigger?: React.ReactNode
}

function formatDialog(dict: Record<string, unknown> | undefined) {
  return (dict?.dialog ?? {}) as Record<string, string>
}

interface FormState {
  accountName: string
  accountNumber: string
  bankName: string
  bankBranch: string
  iban: string
  swiftCode: string
  currency: string
  accountType: string
  status: string
  openingBalance: string
  isDefault: boolean
  isActive: boolean
}

function initialFrom(existing?: BankAccountDTO): FormState {
  return {
    accountName: existing?.accountName ?? "",
    accountNumber: existing?.accountNumber ?? "",
    bankName: existing?.bankName ?? "",
    bankBranch: existing?.bankBranch ?? "",
    iban: existing?.iban ?? "",
    swiftCode: existing?.swiftCode ?? "",
    currency: existing?.currency ?? "SDG",
    accountType: existing?.accountType ?? "CURRENT",
    status: existing?.status ?? "ACTIVE",
    openingBalance: existing ? String(existing.currentBalance) : "0",
    isDefault: existing?.isDefault ?? false,
    isActive: existing?.isActive ?? true,
  }
}

export function AccountDialog({
  locale: _locale,
  dict,
  existing,
  trigger,
}: AccountDialogProps) {
  const d = formatDialog(dict)
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<FormState>(() => initialFrom(existing))
  const [saving, startTransition] = React.useTransition()
  const isEdit = !!existing
  const accountTypeLabels = (dict?.accountTypes ?? {}) as Record<string, string>
  const statusLabels = (dict?.statuses ?? {}) as Record<string, string>

  React.useEffect(() => {
    if (open) setState(initialFrom(existing))
  }, [open, existing])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const openingBalanceNum = Number(state.openingBalance.replace(",", "."))
    startTransition(async () => {
      const basePayload = {
        accountName: state.accountName,
        accountNumber: state.accountNumber,
        bankName: state.bankName,
        bankBranch: state.bankBranch,
        iban: state.iban,
        swiftCode: state.swiftCode,
        currency: state.currency,
        accountType: state.accountType,
        status: state.status,
        isDefault: state.isDefault,
        isActive: state.isActive,
      }
      const res = isEdit
        ? await updateBankAccount(existing.id, basePayload)
        : await createBankAccount({
            ...basePayload,
            openingBalance: Number.isFinite(openingBalanceNum)
              ? openingBalanceNum
              : 0,
          })
      if (res.success) {
        toast.success(
          isEdit ? d.successUpdated ?? "Updated" : d.successCreated ?? "Created"
        )
        setOpen(false)
      } else {
        toast.error(res.error ?? d.failed ?? "Failed")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" aria-hidden />
            {(dict?.newAccount as string) ?? "New account"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{d.title ?? "Bank account"}</DialogTitle>
            <DialogDescription>{d.description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="acc-name">{d.accountNameLabel ?? "Account name"}</Label>
              <Input
                id="acc-name"
                value={state.accountName}
                onChange={(e) =>
                  setState((s) => ({ ...s, accountName: e.target.value }))
                }
                placeholder={d.accountNamePlaceholder}
                required
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acc-bank">{d.bankNameLabel ?? "Bank name"}</Label>
              <Input
                id="acc-bank"
                value={state.bankName}
                onChange={(e) =>
                  setState((s) => ({ ...s, bankName: e.target.value }))
                }
                required
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-branch">{d.bankBranchLabel ?? "Branch"}</Label>
              <Input
                id="acc-branch"
                value={state.bankBranch}
                onChange={(e) =>
                  setState((s) => ({ ...s, bankBranch: e.target.value }))
                }
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acc-number">{d.accountNumberLabel ?? "Account number"}</Label>
              <Input
                id="acc-number"
                value={state.accountNumber}
                onChange={(e) =>
                  setState((s) => ({ ...s, accountNumber: e.target.value }))
                }
                required
                dir="ltr"
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-iban">{d.ibanLabel ?? "IBAN"}</Label>
              <Input
                id="acc-iban"
                value={state.iban}
                onChange={(e) => setState((s) => ({ ...s, iban: e.target.value }))}
                dir="ltr"
                disabled={saving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-swift">{d.swiftCodeLabel ?? "SWIFT"}</Label>
              <Input
                id="acc-swift"
                value={state.swiftCode}
                onChange={(e) =>
                  setState((s) => ({ ...s, swiftCode: e.target.value }))
                }
                dir="ltr"
                disabled={saving}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acc-currency">{d.currencyLabel ?? "Currency"}</Label>
              <Select
                value={state.currency}
                onValueChange={(v) => setState((s) => ({ ...s, currency: v }))}
                disabled={saving}
              >
                <SelectTrigger id="acc-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acc-type">{d.accountTypeLabel ?? "Type"}</Label>
              <Select
                value={state.accountType}
                onValueChange={(v) =>
                  setState((s) => ({ ...s, accountType: v }))
                }
                disabled={saving}
              >
                <SelectTrigger id="acc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANK_ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {accountTypeLabels[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="acc-status">{d.statusLabel ?? "Status"}</Label>
              <Select
                value={state.status}
                onValueChange={(v) => setState((s) => ({ ...s, status: v }))}
                disabled={saving}
              >
                <SelectTrigger id="acc-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANK_ACCOUNT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEdit && (
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="acc-opening">
                  {d.openingBalanceLabel ?? "Opening balance"}
                </Label>
                <Input
                  id="acc-opening"
                  type="number"
                  step="0.01"
                  value={state.openingBalance}
                  onChange={(e) =>
                    setState((s) => ({ ...s, openingBalance: e.target.value }))
                  }
                  dir="ltr"
                  disabled={saving}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="acc-default">{d.isDefaultLabel ?? "Default"}</Label>
              <Switch
                id="acc-default"
                checked={state.isDefault}
                onCheckedChange={(c) =>
                  setState((s) => ({ ...s, isDefault: c }))
                }
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="acc-active">{d.isActiveLabel ?? "Active"}</Label>
              <Switch
                id="acc-active"
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
