// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"
import { Pencil, Power, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { deleteFeeTemplate, toggleFeeTemplate } from "./actions"
import { TemplateDialog } from "./template-dialog"
import type { FeeTemplateDTO } from "./types"

type Locale = "ar" | "en"

interface RowActionsProps {
  template: FeeTemplateDTO
  locale: Locale
  dict: Record<string, unknown> | undefined
}

export function RowActions({ template, locale, dict }: RowActionsProps) {
  const d = (dict?.dialog ?? {}) as Record<string, string>
  const [busy, startTransition] = React.useTransition()

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleFeeTemplate(template.id, !template.isActive)
      if (res.success) toast.success(d.successToggled ?? "Status changed")
      else toast.error(res.error ?? d.failed ?? "Failed")
    })
  }

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteFeeTemplate(template.id)
      if (res.success) toast.success(d.successDeleted ?? "Deleted")
      else toast.error(res.error ?? d.failed ?? "Failed")
    })
  }

  return (
    <div className="flex justify-end gap-1">
      <TemplateDialog
        locale={locale}
        dict={dict}
        existing={template}
        trigger={
          <Button
            size="icon"
            variant="ghost"
            aria-label={(dict?.editTemplate as string) ?? "Edit"}
            title={(dict?.editTemplate as string) ?? "Edit"}
            disabled={busy}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        }
      />
      <Button
        size="icon"
        variant="ghost"
        aria-label={
          template.isActive
            ? (dict?.statusInactive as string) ?? "Deactivate"
            : (dict?.statusActive as string) ?? "Activate"
        }
        title={
          template.isActive
            ? (dict?.statusInactive as string) ?? "Deactivate"
            : (dict?.statusActive as string) ?? "Activate"
        }
        disabled={busy}
        onClick={onToggle}
      >
        <Power className="size-4" aria-hidden />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={(d.successDeleted as string) ?? "Delete"}
        title={(d.successDeleted as string) ?? "Delete"}
        disabled={busy}
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-destructive" aria-hidden />
      </Button>
    </div>
  )
}
