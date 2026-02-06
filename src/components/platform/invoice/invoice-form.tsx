"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { IconPlus, IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createInvoice, updateInvoice } from "@/actions/invoice"
import type { Dictionary, Locale } from "@/components/internationalization"
import type { Shipment, Invoice, InvoiceItem, Client, FeeCategory } from "@prisma/client"
import { FEE_CATEGORIES, VAT_RATE, INVOICE_TYPE_CONFIG } from "./config"

// =============================================================================
// TYPES
// =============================================================================

interface FormItem {
  id?: string
  description: string
  descriptionAr?: string
  quantity: number
  unitPrice: number
  feeCategory?: string
  tariffCode?: string
  receiptNumber?: string
}

interface FormValues {
  shipmentId?: string
  clientId?: string
  currency: "SDG" | "USD" | "SAR"
  invoiceType: "CLEARANCE" | "PROFORMA" | "STATEMENT" | "PORT"
  dueDate?: string
  notes?: string
  // Document references
  blNumber?: string
  containerNumbers?: string
  deliveryOrderNo?: string
  declarationNo?: string
  vesselName?: string
  voyageNumber?: string
  commodityType?: string
  supplierName?: string
  items: FormItem[]
}

type InvoiceWithItems = Invoice & { items: InvoiceItem[] }

interface InvoiceFormProps {
  dictionary: Dictionary
  locale: Locale
  shipments?: Shipment[]
  clients?: Client[]
  invoice?: InvoiceWithItems
  mode?: "create" | "edit"
  isModal?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

// =============================================================================
// FEE CATEGORY OPTIONS
// =============================================================================

const feeCategoryOptions = Object.entries(FEE_CATEGORIES).map(([key, config]) => ({
  value: key,
  label: `${config.en} - ${config.ar}`,
  labelEn: config.en,
  labelAr: config.ar,
  defaultPrice: config.defaultPrice,
  tariffCode: config.tariffCode,
}))

// =============================================================================
// COMPONENT
// =============================================================================

export function InvoiceForm({
  dictionary,
  locale,
  shipments = [],
  clients = [],
  invoice,
  mode = "create",
  isModal = false,
  onSuccess,
  onCancel,
}: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const isEditMode = mode === "edit" && invoice
  const isRtl = locale === "ar"

  const form = useForm<FormValues>({
    defaultValues: isEditMode
      ? {
          shipmentId: invoice.shipmentId || undefined,
          clientId: invoice.clientId || undefined,
          currency: invoice.currency as "SDG" | "USD" | "SAR",
          invoiceType: (invoice.invoiceType as FormValues["invoiceType"]) || "CLEARANCE",
          dueDate: invoice.dueDate
            ? new Date(invoice.dueDate).toISOString().split("T")[0]
            : undefined,
          notes: invoice.notes || undefined,
          blNumber: invoice.blNumber || undefined,
          containerNumbers: invoice.containerNumbers?.join(", ") || undefined,
          deliveryOrderNo: invoice.deliveryOrderNo || undefined,
          declarationNo: invoice.declarationNo || undefined,
          vesselName: invoice.vesselName || undefined,
          voyageNumber: invoice.voyageNumber || undefined,
          commodityType: invoice.commodityType || undefined,
          supplierName: invoice.supplierName || undefined,
          items: invoice.items.map((item) => ({
            id: item.id,
            description: item.description,
            descriptionAr: item.descriptionAr || undefined,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            feeCategory: item.feeCategory || undefined,
            tariffCode: item.tariffCode || undefined,
            receiptNumber: item.receiptNumber || undefined,
          })),
        }
      : {
          currency: "SDG",
          invoiceType: "CLEARANCE",
          items: [{ description: "", quantity: 1, unitPrice: 0 }],
        },
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchItems = form.watch("items")
  const watchCurrency = form.watch("currency")

  const subtotal = watchItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  )
  const tax = subtotal * VAT_RATE // 17% VAT
  const total = subtotal + tax

  // Handle fee category selection - auto-fill description and price
  const handleFeeCategoryChange = (index: number, categoryKey: string) => {
    const config = FEE_CATEGORIES[categoryKey as FeeCategory]
    if (config) {
      const currentItem = watchItems[index]
      if (!currentItem) return
      update(index, {
        ...currentItem,
        feeCategory: categoryKey,
        description: config.en,
        descriptionAr: config.ar,
        unitPrice: config.defaultPrice,
        tariffCode: config.tariffCode,
      })
    }
  }

  // Add fee category item quickly
  const handleAddFeeCategory = (categoryKey: string) => {
    const config = FEE_CATEGORIES[categoryKey as FeeCategory]
    if (config) {
      append({
        description: config.en,
        descriptionAr: config.ar,
        quantity: 1,
        unitPrice: config.defaultPrice,
        feeCategory: categoryKey,
        tariffCode: config.tariffCode,
      })
    }
  }

  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      const containerNumbers = values.containerNumbers
        ? values.containerNumbers.split(",").map((c) => c.trim()).filter(Boolean)
        : []

      const formData = {
        ...values,
        containerNumbers,
        dueDate: values.dueDate || undefined,
        items: values.items.map((item) => ({
          ...item,
          descriptionAr: item.descriptionAr || item.description,
        })),
      }

      if (isEditMode) {
        await updateInvoice(invoice.id, formData)
      } else {
        await createInvoice(formData)
      }

      if (isModal && onSuccess) {
        onSuccess()
      } else {
        router.push(`/${locale}/invoice`)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode
                ? dictionary.invoices?.editInvoice || "Edit Invoice"
                : dictionary.invoices?.newInvoice || "New Invoice"}
            </CardTitle>
            <CardDescription>
              {isRtl ? "معلومات الفاتورة الأساسية" : "Basic invoice information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="invoiceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "نوع الفاتورة" : "Invoice Type"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(INVOICE_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {isRtl ? config.labelAr : config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.navigation?.shipments || "Shipment"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dictionary.common?.select || "Select"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shipments.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.shipmentNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "العميل" : "Client"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dictionary.common?.select || "Select"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.customs?.currency || "Currency"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SDG">
                          {isRtl ? "ج.س - جنيه سوداني" : "SDG - Sudanese Pound"}
                        </SelectItem>
                        <SelectItem value="USD">
                          {isRtl ? "دولار - دولار أمريكي" : "USD - US Dollar"}
                        </SelectItem>
                        <SelectItem value="SAR">
                          {isRtl ? "ر.س - ريال سعودي" : "SAR - Saudi Riyal"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dictionary.invoices?.dueDate || "Due Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "المورد" : "Supplier"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={isRtl ? "اسم المورد" : "Supplier name"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Document References Card */}
        <Card>
          <CardHeader>
            <CardTitle>{isRtl ? "مراجع المستندات" : "Document References"}</CardTitle>
            <CardDescription>
              {isRtl ? "رقم بوليصة الشحن والحاويات والوثائق الجمركية" : "B/L, container, and customs document numbers"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="blNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "رقم بوليصة الشحن" : "B/L Number"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="VCLPKGPZU4332125" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="containerNumbers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "رقم الحاوية" : "Container No(s)"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="5*20, MSKU1234567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vesselName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "اسم السفينة" : "Vessel Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="deliveryOrderNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "اذن تسليم رقم" : "Delivery Order No"}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="declarationNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "شهادة جمركية رقم" : "Declaration No"}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commodityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRtl ? "الصنف" : "Commodity"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={isRtl ? "نوع البضاعة" : "Goods type"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Fee Categories */}
        <Card>
          <CardHeader>
            <CardTitle>{isRtl ? "إضافة رسوم سريعة" : "Quick Add Fees"}</CardTitle>
            <CardDescription>
              {isRtl ? "انقر لإضافة رسوم شائعة" : "Click to add common fees"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {feeCategoryOptions.slice(0, 12).map((option) => (
                <Badge
                  key={option.value}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleAddFeeCategory(option.value)}
                >
                  {isRtl ? option.labelAr : option.labelEn}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{dictionary.invoices?.lineItems || "Line Items"}</CardTitle>
              <CardDescription>
                {isRtl ? "بنود الفاتورة والرسوم" : "Invoice items and fees"}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
              <IconPlus className="size-4 me-1" />
              {dictionary.invoices?.addItem || "Add Item"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 md:grid-cols-[200px_1fr_80px_120px_40px] items-end border-b pb-4 last:border-0"
                >
                  {/* Fee Category Select */}
                  <FormItem>
                    {index === 0 && (
                      <FormLabel>{isRtl ? "نوع الرسم" : "Fee Type"}</FormLabel>
                    )}
                    <Select
                      value={watchItems[index]?.feeCategory || ""}
                      onValueChange={(val) => handleFeeCategoryChange(index, val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isRtl ? "اختر..." : "Select..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {feeCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {isRtl ? option.labelAr : option.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && (
                          <FormLabel>
                            {dictionary.invoices?.itemDescription || "Description"}
                          </FormLabel>
                        )}
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantity */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && (
                          <FormLabel>{dictionary.shipments?.quantity || "Qty"}</FormLabel>
                        )}
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Unit Price */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && (
                          <FormLabel>
                            {dictionary.invoices?.unitPrice || "Unit Price"}
                          </FormLabel>
                        )}
                        <FormControl>
                          <Input type="number" step="0.01" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className={index === 0 ? "mt-8" : ""}
                  >
                    <IconTrash className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dictionary.invoices?.notes || "Notes"}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Totals Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-end gap-2 text-sm">
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  {dictionary.invoices?.subtotal || "Subtotal"}:
                </span>
                <span className="font-medium tabular-nums">
                  {watchCurrency} {subtotal.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                </span>
              </div>
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  {isRtl ? "قيمه مضافة" : "VAT"} (17%):
                </span>
                <span className="font-medium tabular-nums">
                  {watchCurrency} {tax.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                </span>
              </div>
              <div className="flex gap-4 text-lg font-bold border-t pt-2 mt-2">
                <span>{dictionary.invoices?.total || "Total"}:</span>
                <span className="tabular-nums">
                  {watchCurrency} {total.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={isModal && onCancel ? onCancel : () => router.back()}
          >
            {dictionary.common?.cancel || "Cancel"}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? dictionary.common?.loading || "Loading..."
              : isEditMode
                ? dictionary.common?.update || "Update"
                : dictionary.common?.create || "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
