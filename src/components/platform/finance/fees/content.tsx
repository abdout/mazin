// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { auth } from "@/auth"
import type { Dictionary } from "@/components/internationalization/types"
import type { Locale } from "@/components/internationalization/config"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { listFeeTemplates } from "./actions"
import { TemplateDialog } from "./template-dialog"
import { RowActions } from "./row-actions"
import type { FeeTemplateDTO } from "./types"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

function formatMoney(value: number, locale: Locale) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SD" : "en-US", {
      style: "currency",
      currency: "SDG",
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `SDG ${value.toFixed(2)}`
  }
}

function formatValue(t: FeeTemplateDTO, locale: Locale): string {
  if (t.calculationType === "FIXED" && t.amount != null) {
    return formatMoney(t.amount, locale)
  }
  if (t.calculationType === "PERCENTAGE_OF_VALUE" && t.percentage != null) {
    return `${Number((t.percentage * 100).toFixed(4))}%`
  }
  if (t.amount != null) return formatMoney(t.amount, locale)
  if (t.percentage != null) {
    return `${Number((t.percentage * 100).toFixed(4))}%`
  }
  return "—"
}

export default async function FeesContent({ dictionary, lang }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/finance/fees`)
  }

  const res = await listFeeTemplates()
  const rows = (res.success && res.data ? res.data : []) as FeeTemplateDTO[]

  const fdict = dictionary.finance?.fees as Record<string, unknown> | undefined
  const cols = (fdict?.columns ?? {}) as Record<string, string>
  const feeTypes = (fdict?.feeTypes ?? {}) as Record<string, string>
  const calcTypes = (fdict?.calculationTypes ?? {}) as Record<string, string>

  const title = (fdict?.title as string) ?? "Fee templates"
  const subtitle = (fdict?.subtitle as string) ?? ""
  const empty = (fdict?.empty as string) ?? "No fee templates yet."

  return (
    <div className="space-y-6 py-4 md:py-6">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <TemplateDialog locale={lang} dict={fdict} />
      </header>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {empty}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cols.code ?? "Code"}</TableHead>
                    <TableHead>{cols.name ?? "Name"}</TableHead>
                    <TableHead>{cols.feeType ?? "Fee type"}</TableHead>
                    <TableHead>{cols.calculationType ?? "Calculation"}</TableHead>
                    <TableHead className="text-end">{cols.value ?? "Value"}</TableHead>
                    <TableHead>{cols.status ?? "Status"}</TableHead>
                    <TableHead className="text-end">{cols.actions ?? "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {lang === "ar" && t.nameAr ? t.nameAr : t.name}
                          </p>
                          {t.description ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {t.description}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{feeTypes[t.feeType] ?? t.feeType}</TableCell>
                      <TableCell>
                        {calcTypes[t.calculationType] ?? t.calculationType}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatValue(t, lang)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.isActive ? "default" : "secondary"}>
                          {t.isActive
                            ? (fdict?.statusActive as string) ?? "Active"
                            : (fdict?.statusInactive as string) ?? "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <RowActions template={t} locale={lang} dict={fdict} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
