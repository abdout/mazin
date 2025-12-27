"use client"

import Image from "next/image"
import {
  IconBuilding,
  IconPalette,
  IconBuildingBank,
  IconFileInvoice,
} from "@tabler/icons-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { CompanySettings } from "@prisma/client"
import type { Dictionary, Locale } from "@/components/internationalization"

interface SettingsDisplayProps {
  settings: CompanySettings | null
  dictionary: Dictionary
  locale: Locale
}

export function SettingsDisplay({ settings, dictionary, locale }: SettingsDisplayProps) {
  const dict = dictionary.invoices.settingsPage

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            {locale === "ar" ? "لم يتم تكوين الإعدادات بعد" : "No settings configured yet"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuilding className="size-5" />
            {dict?.companyInfo || "Company Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {locale === "ar" ? "اسم الشركة (EN)" : "Company Name (EN)"}
              </span>
              <span className="font-medium">{settings.companyName}</span>
            </div>
            {settings.companyNameAr && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  {locale === "ar" ? "اسم الشركة (AR)" : "Company Name (AR)"}
                </span>
                <span className="font-medium">{settings.companyNameAr}</span>
              </div>
            )}
            {settings.taxId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  {dictionary.invoices.taxId || "Tax ID"}
                </span>
                <span className="font-medium">{settings.taxId}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid gap-3">
            {settings.email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  {dictionary.common.email}
                </span>
                <span className="font-medium">{settings.email}</span>
              </div>
            )}
            {settings.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  {dictionary.common.phone}
                </span>
                <span className="font-medium">{settings.phone}</span>
              </div>
            )}
            {settings.website && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  {locale === "ar" ? "الموقع" : "Website"}
                </span>
                <span className="font-medium">{settings.website}</span>
              </div>
            )}
          </div>

          {(settings.address1 || settings.city) && (
            <>
              <Separator />
              <div className="grid gap-3">
                {settings.address1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      {locale === "ar" ? "العنوان" : "Address"}
                    </span>
                    <span className="font-medium text-end">
                      {settings.address1}
                      {settings.address2 && <>, {settings.address2}</>}
                    </span>
                  </div>
                )}
                {settings.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      {locale === "ar" ? "المدينة" : "City"}
                    </span>
                    <span className="font-medium">
                      {settings.city}
                      {settings.state && `, ${settings.state}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    {locale === "ar" ? "البلد" : "Country"}
                  </span>
                  <span className="font-medium">{settings.country}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPalette className="size-5" />
            {dict?.branding || "Branding"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <p className="text-muted-foreground mb-3 text-sm">
                {dict?.logo || "Logo"}
              </p>
              <div className="bg-muted/50 flex h-24 items-center justify-center rounded-lg border p-4">
                <Image
                  src={settings.logoUrl || "/logo.png"}
                  alt="Company Logo"
                  width={120}
                  height={60}
                  className="h-auto max-h-16 w-auto object-contain"
                />
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-sm">
                {dict?.signature || "Signature"}
              </p>
              <div className="bg-muted/50 flex h-24 items-center justify-center rounded-lg border p-4">
                <Image
                  src={settings.signatureUrl || "/sign.png"}
                  alt="Signature"
                  width={120}
                  height={60}
                  className="h-auto max-h-16 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBuildingBank className="size-5" />
            {dict?.bankDetails || "Bank Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.bankName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {locale === "ar" ? "البنك" : "Bank"}
              </span>
              <span className="font-medium">{settings.bankName}</span>
            </div>
          )}
          {settings.bankBranch && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {locale === "ar" ? "الفرع" : "Branch"}
              </span>
              <span className="font-medium">{settings.bankBranch}</span>
            </div>
          )}
          {settings.accountName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {locale === "ar" ? "اسم الحساب" : "Account Name"}
              </span>
              <span className="font-medium">{settings.accountName}</span>
            </div>
          )}
          {settings.accountNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {locale === "ar" ? "رقم الحساب" : "Account Number"}
              </span>
              <span className="font-medium font-mono">{settings.accountNumber}</span>
            </div>
          )}
          {settings.iban && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">IBAN</span>
              <span className="font-medium font-mono text-sm">{settings.iban}</span>
            </div>
          )}
          {settings.swiftCode && (
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">SWIFT</span>
              <span className="font-medium font-mono">{settings.swiftCode}</span>
            </div>
          )}
          {!settings.bankName && !settings.accountNumber && (
            <p className="text-muted-foreground text-center text-sm">
              {locale === "ar" ? "لم يتم تكوين التفاصيل البنكية" : "No bank details configured"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invoice Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileInvoice className="size-5" />
            {dict?.defaults || "Invoice Defaults"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">
              {dict?.invoicePrefix || "Invoice Prefix"}
            </span>
            <span className="font-medium font-mono">{settings.invoicePrefix}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">
              {dict?.defaultCurrency || "Default Currency"}
            </span>
            <span className="font-medium">{settings.defaultCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">
              {dict?.taxRate || "Tax Rate"}
            </span>
            <span className="font-medium">{Number(settings.defaultTaxRate)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">
              {dict?.paymentTerms || "Payment Terms"}
            </span>
            <span className="font-medium">
              {settings.defaultPaymentTerms} {locale === "ar" ? "يوم" : "days"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
