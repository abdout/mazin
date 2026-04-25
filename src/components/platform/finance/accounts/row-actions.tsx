// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"
import { Pencil, Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { deleteBankAccount, setDefaultBankAccount } from "./actions"
import { AccountDialog } from "./account-dialog"
import type { BankAccountDTO } from "./types"

type Locale = "ar" | "en"

interface RowActionsProps {
  account: BankAccountDTO
  locale: Locale
  dict: Record<string, unknown> | undefined
}

export function RowActions({ account, locale, dict }: RowActionsProps) {
  const d = (dict?.dialog ?? {}) as Record<string, string>
  const [busy, startTransition] = React.useTransition()

  const onSetDefault = () => {
    startTransition(async () => {
      const res = await setDefaultBankAccount(account.id)
      if (res.success) toast.success(d.successDefaultSet ?? "Default changed")
      else toast.error(res.error ?? d.failed ?? "Failed")
    })
  }

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteBankAccount(account.id)
      if (res.success) toast.success(d.successDeleted ?? "Deleted")
      else toast.error(res.error ?? d.failed ?? "Failed")
    })
  }

  return (
    <div className="flex justify-end gap-1">
      <AccountDialog
        locale={locale}
        dict={dict}
        existing={account}
        trigger={
          <Button
            size="icon"
            variant="ghost"
            aria-label={(dict?.editAccount as string) ?? "Edit"}
            title={(dict?.editAccount as string) ?? "Edit"}
            disabled={busy}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        }
      />
      {!account.isDefault && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={(dict?.setDefault as string) ?? "Set default"}
          title={(dict?.setDefault as string) ?? "Set default"}
          disabled={busy}
          onClick={onSetDefault}
        >
          <Star className="size-4" aria-hidden />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        aria-label="Delete"
        title="Delete"
        disabled={busy}
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-destructive" aria-hidden />
      </Button>
    </div>
  )
}
