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
import { Textarea } from "@/components/ui/textarea"

import { createExpense } from "./actions"

type Locale = "ar" | "en"

interface Category {
  id: string
  name: string
  nameAr?: string | null
}

interface NewExpenseDialogProps {
  locale: Locale
  dict: Record<string, unknown> | undefined
  categories: Category[]
}

function formatDialog(dict: Record<string, unknown> | undefined) {
  return (dict?.dialog ?? {}) as Record<string, string>
}

export function NewExpenseDialog({ locale, dict, categories }: NewExpenseDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [vendor, setVendor] = React.useState("")
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [expenseDate, setExpenseDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  )
  const [receiptNumber, setReceiptNumber] = React.useState("")
  const [receiptUrl, setReceiptUrl] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, startTransition] = React.useTransition()

  const d = formatDialog(dict)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount.replace(",", "."))
    if (!Number.isFinite(num) || num <= 0) {
      toast.error(d.failed ?? "Invalid amount")
      return
    }
    startTransition(async () => {
      const res = await createExpense({
        amount: num,
        description,
        vendor: vendor || undefined,
        categoryId: categoryId || undefined,
        expenseDate: new Date(expenseDate),
        receiptNumber: receiptNumber || undefined,
        receiptUrl: receiptUrl || undefined,
        notes: notes || undefined,
      })
      if (res.success) {
        toast.success(d.successCreated ?? "Expense recorded")
        setAmount("")
        setDescription("")
        setVendor("")
        setCategoryId("")
        setReceiptNumber("")
        setReceiptUrl("")
        setNotes("")
        setOpen(false)
      } else {
        toast.error(res.error ?? d.failed ?? "Could not save expense")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden />
          {(dict?.newExpense as string) ?? "New expense"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{d.title ?? "Record expense"}</DialogTitle>
            <DialogDescription>{d.description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="exp-amount">{d.amountLabel ?? "Amount"}</Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                dir="ltr"
                disabled={submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-date">{d.dateLabel ?? "Date"}</Label>
              <Input
                id="exp-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                dir="ltr"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="exp-desc">{d.descriptionLabel ?? "Description"}</Label>
              <Input
                id="exp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={d.descriptionPlaceholder}
                required
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-vendor">{d.vendorLabel ?? "Vendor"}</Label>
              <Input
                id="exp-vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder={d.vendorPlaceholder}
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-category">{d.categoryLabel ?? "Category"}</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={submitting || categories.length === 0}
              >
                <SelectTrigger id="exp-category">
                  <SelectValue placeholder={d.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {locale === "ar" && c.nameAr ? c.nameAr : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-receipt-num">
                {d.receiptNumberLabel ?? "Receipt number"}
              </Label>
              <Input
                id="exp-receipt-num"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                dir="ltr"
                disabled={submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-receipt-url">
                {d.receiptUrlLabel ?? "Receipt URL"}
              </Label>
              <Input
                id="exp-receipt-url"
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://…"
                dir="ltr"
                disabled={submitting}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="exp-notes">{d.notesLabel ?? "Notes"}</Label>
              <Textarea
                id="exp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={submitting}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={submitting}>
                {d.cancel ?? "Cancel"}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? d.saving ?? "Saving…" : d.save ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
