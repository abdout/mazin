// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"
import { Check, Trash2, X } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  approveExpense,
  deleteExpense,
  rejectExpense,
} from "./actions"

type Locale = "ar" | "en"
type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED"

interface RowActionsProps {
  expenseId: string
  status: Status
  locale: Locale
  dict: Record<string, unknown> | undefined
}

function formatDialog(dict: Record<string, unknown> | undefined) {
  return (dict?.dialog ?? {}) as Record<string, string>
}

function formatReject(dict: Record<string, unknown> | undefined) {
  return (dict?.reject ?? {}) as Record<string, string>
}

export function RowActions({ expenseId, status, locale: _locale, dict }: RowActionsProps) {
  const [busy, startTransition] = React.useTransition()
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const d = formatDialog(dict)
  const r = formatReject(dict)

  const onApprove = () => {
    startTransition(async () => {
      const res = await approveExpense(expenseId)
      if (res.success) toast.success(d.successApproved ?? "Approved")
      else toast.error(res.error ?? d.failed ?? "Failed")
    })
  }

  const onReject = () => {
    startTransition(async () => {
      const res = await rejectExpense(expenseId, rejectReason.trim() || "—")
      if (res.success) {
        toast.success(d.successRejected ?? "Rejected")
        setRejectOpen(false)
        setRejectReason("")
      } else {
        toast.error(res.error ?? d.failed ?? "Failed")
      }
    })
  }

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteExpense(expenseId)
      if (res.success) toast.success(d.successDeleted ?? "Deleted")
      else toast.error(res.error ?? d.failed ?? "Failed")
    })
  }

  const canApprove = status === "PENDING"
  const canReject = status === "PENDING"
  const canDelete = status !== "PAID"

  return (
    <div className="flex justify-end gap-1">
      {canApprove && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={(dict?.approve as string) ?? "Approve"}
          title={(dict?.approve as string) ?? "Approve"}
          disabled={busy}
          onClick={onApprove}
        >
          <Check className="size-4 text-emerald-600" aria-hidden />
        </Button>
      )}
      {canReject && (
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label={(dict?.reject as string) ?? "Reject"}
              title={(dict?.reject as string) ?? "Reject"}
              disabled={busy}
            >
              <X className="size-4 text-destructive" aria-hidden />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{r.title ?? "Reject expense"}</DialogTitle>
              <DialogDescription>{r.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="reject-reason">{r.reasonLabel ?? "Reason"}</Label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={r.reasonPlaceholder}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" disabled={busy}>
                  {d.cancel ?? "Cancel"}
                </Button>
              </DialogClose>
              <Button variant="destructive" onClick={onReject} disabled={busy}>
                {r.confirm ?? "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {canDelete && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={(dict?.delete as string) ?? "Delete"}
          title={(dict?.delete as string) ?? "Delete"}
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2 className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      )}
    </div>
  )
}
