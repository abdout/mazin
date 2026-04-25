// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/components/internationalization/types"

import { upsertCompanySettings } from "./actions"
import type { CompanySettingsDTO } from "../types"

type Locale = "ar" | "en"

interface OrganizationFormProps {
  initial: CompanySettingsDTO | null
  dictionary: Dictionary
  locale: Locale
}

type FormState = {
  companyName: string
  companyNameAr: string
  taxId: string
  email: string
  phone: string
  website: string
  address1: string
  address2: string
  city: string
  state: string
  country: string
  postalCode: string
  bankName: string
  bankBranch: string
  accountName: string
  accountNumber: string
  iban: string
  swiftCode: string
  invoicePrefix: string
  defaultCurrency: string
  defaultTaxRate: string
  defaultPaymentTerms: string
}

function initialState(initial: CompanySettingsDTO | null): FormState {
  return {
    companyName: initial?.companyName ?? "",
    companyNameAr: initial?.companyNameAr ?? "",
    taxId: initial?.taxId ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    website: initial?.website ?? "",
    address1: initial?.address1 ?? "",
    address2: initial?.address2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    country: initial?.country ?? "SD",
    postalCode: initial?.postalCode ?? "",
    bankName: initial?.bankName ?? "",
    bankBranch: initial?.bankBranch ?? "",
    accountName: initial?.accountName ?? "",
    accountNumber: initial?.accountNumber ?? "",
    iban: initial?.iban ?? "",
    swiftCode: initial?.swiftCode ?? "",
    invoicePrefix: initial?.invoicePrefix ?? "INV",
    defaultCurrency: initial?.defaultCurrency ?? "SDG",
    defaultTaxRate: String(initial?.defaultTaxRate ?? 15),
    defaultPaymentTerms: String(initial?.defaultPaymentTerms ?? 30),
  }
}

export function OrganizationForm({ initial, dictionary }: OrganizationFormProps) {
  const t = dictionary.settings?.organizationTab
  const [state, setState] = React.useState<FormState>(() => initialState(initial))
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})
  const [saving, startTransition] = React.useTransition()

  const bind = <K extends keyof FormState>(key: K) => ({
    id: `org-${key}`,
    value: state[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setState((s) => ({ ...s, [key]: e.target.value })),
    disabled: saving,
    "aria-invalid": !!fieldErrors[key],
  })

  const fieldError = (key: keyof FormState) => fieldErrors[key as string]?.[0]

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setFieldErrors({})
      const payload = {
        ...state,
        defaultTaxRate: Number(state.defaultTaxRate) || 0,
        defaultPaymentTerms: Number(state.defaultPaymentTerms) || 0,
      }
      startTransition(async () => {
        const res = await upsertCompanySettings(payload)
        if (res.ok) {
          toast.success(t?.saved ?? "Organization updated")
        } else if (res.issues) {
          setFieldErrors(res.issues)
          toast.error(t?.errorSave ?? "Could not save")
        } else {
          toast.error(t?.errorSave ?? "Could not save")
        }
      })
    },
    [state, t]
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t?.companyInfo ?? "Company information"}</CardTitle>
          <CardDescription>{t?.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t?.companyNameLabel ?? "Company name"} error={fieldError("companyName")}>
            <Input {...bind("companyName")} required />
          </Field>
          <Field label={t?.companyNameArLabel ?? "Company name (Arabic)"} error={fieldError("companyNameAr")}>
            <Input {...bind("companyNameAr")} dir="rtl" />
          </Field>
          <Field label={t?.taxIdLabel ?? "Tax ID"} error={fieldError("taxId")}>
            <Input {...bind("taxId")} dir="ltr" />
          </Field>
          <Field label={t?.websiteLabel ?? "Website"} error={fieldError("website")}>
            <Input {...bind("website")} type="url" dir="ltr" placeholder="https://…" />
          </Field>
          <Field label={t?.emailLabel ?? "Email"} error={fieldError("email")}>
            <Input {...bind("email")} type="email" dir="ltr" />
          </Field>
          <Field label={t?.phoneLabel ?? "Phone"} error={fieldError("phone")}>
            <Input {...bind("phone")} type="tel" dir="ltr" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t?.address ?? "Address"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t?.address1Label ?? "Address 1"} error={fieldError("address1")}>
            <Input {...bind("address1")} />
          </Field>
          <Field label={t?.address2Label ?? "Address 2"} error={fieldError("address2")}>
            <Input {...bind("address2")} />
          </Field>
          <Field label={t?.cityLabel ?? "City"} error={fieldError("city")}>
            <Input {...bind("city")} />
          </Field>
          <Field label={t?.stateLabel ?? "State"} error={fieldError("state")}>
            <Input {...bind("state")} />
          </Field>
          <Field label={t?.countryLabel ?? "Country"} error={fieldError("country")}>
            <Input {...bind("country")} maxLength={3} />
          </Field>
          <Field label={t?.postalCodeLabel ?? "Postal code"} error={fieldError("postalCode")}>
            <Input {...bind("postalCode")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t?.banking ?? "Banking"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t?.bankNameLabel ?? "Bank name"} error={fieldError("bankName")}>
            <Input {...bind("bankName")} />
          </Field>
          <Field label={t?.bankBranchLabel ?? "Branch"} error={fieldError("bankBranch")}>
            <Input {...bind("bankBranch")} />
          </Field>
          <Field label={t?.accountNameLabel ?? "Account name"} error={fieldError("accountName")}>
            <Input {...bind("accountName")} />
          </Field>
          <Field label={t?.accountNumberLabel ?? "Account number"} error={fieldError("accountNumber")}>
            <Input {...bind("accountNumber")} dir="ltr" />
          </Field>
          <Field label={t?.ibanLabel ?? "IBAN"} error={fieldError("iban")}>
            <Input {...bind("iban")} dir="ltr" />
          </Field>
          <Field label={t?.swiftCodeLabel ?? "SWIFT"} error={fieldError("swiftCode")}>
            <Input {...bind("swiftCode")} dir="ltr" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t?.invoiceDefaults ?? "Invoice defaults"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label={t?.invoicePrefixLabel ?? "Invoice prefix"} error={fieldError("invoicePrefix")}>
            <Input {...bind("invoicePrefix")} dir="ltr" />
          </Field>
          <Field label={t?.defaultCurrencyLabel ?? "Default currency"} error={fieldError("defaultCurrency")}>
            <Input {...bind("defaultCurrency")} dir="ltr" />
          </Field>
          <Field label={t?.defaultTaxRateLabel ?? "Default tax rate (%)"} error={fieldError("defaultTaxRate")}>
            <Input {...bind("defaultTaxRate")} type="number" step="0.01" min="0" max="100" dir="ltr" />
          </Field>
          <Field label={t?.defaultPaymentTermsLabel ?? "Default payment terms (days)"} error={fieldError("defaultPaymentTerms")}>
            <Input {...bind("defaultPaymentTerms")} type="number" step="1" min="0" max="365" dir="ltr" />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? t?.saving ?? "Saving…" : t?.save ?? "Save"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
