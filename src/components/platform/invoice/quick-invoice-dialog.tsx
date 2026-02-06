"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconFileInvoice,
  IconShip,
  IconPackage,
  IconBuildingWarehouse,
  IconReceipt,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createQuickInvoice } from "@/actions/invoice"
import { FEE_CATEGORIES, QUICK_FEE_PRESETS, VAT_RATE } from "./config"
import type { Shipment, FeeCategory } from "@prisma/client"
import type { Locale } from "@/components/internationalization"

// =============================================================================
// TYPES
// =============================================================================

interface QuickInvoiceDialogProps {
  shipments: Shipment[]
  locale: Locale
  trigger?: React.ReactNode
  onSuccess?: () => void
}

type PresetKey = keyof typeof QUICK_FEE_PRESETS

interface PresetConfig {
  key: PresetKey
  label: string
  labelAr: string
  description: string
  descriptionAr: string
  icon: React.ComponentType<{ className?: string }>
}

// =============================================================================
// PRESET CONFIGURATIONS
// =============================================================================

const presets: PresetConfig[] = [
  {
    key: "BASIC_CLEARANCE",
    label: "Basic Clearance",
    labelAr: "تخليص أساسي",
    description: "Customs declaration, examination, delivery order",
    descriptionAr: "شهادة جمركية، كشف، اذن تسليم",
    icon: IconFileInvoice,
  },
  {
    key: "FULL_CLEARANCE",
    label: "Full Clearance",
    labelAr: "تخليص كامل",
    description: "Complete clearance with port fees and transport",
    descriptionAr: "تخليص كامل مع رسوم الميناء والنقل",
    icon: IconPackage,
  },
  {
    key: "PORT_ONLY",
    label: "Port Only",
    labelAr: "رسوم الميناء فقط",
    description: "Port storage, quay, container move, stevedoring",
    descriptionAr: "تخزين، رصيف، نقل حاويات، تستيف",
    icon: IconShip,
  },
  {
    key: "CUSTOMS_ONLY",
    label: "Customs Only",
    labelAr: "جمارك فقط",
    description: "Declaration, duty receipt, examination, lab",
    descriptionAr: "شهادة، ايصال جمارك، كشف، معمل",
    icon: IconBuildingWarehouse,
  },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function QuickInvoiceDialog({
  shipments,
  locale,
  trigger,
  onSuccess,
}: QuickInvoiceDialogProps) {
  const router = useRouter()
  const isRtl = locale === "ar"
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Form state
  const [selectedShipment, setSelectedShipment] = React.useState<string>("")
  const [selectedPreset, setSelectedPreset] = React.useState<PresetKey | null>(null)
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set())
  const [customPrices, setCustomPrices] = React.useState<Record<string, number>>({})
  const [currency, setCurrency] = React.useState<"SDG" | "USD" | "SAR">("SDG")

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setSelectedShipment("")
      setSelectedPreset(null)
      setSelectedCategories(new Set())
      setCustomPrices({})
    }
  }, [open])

  // Handle preset selection
  const handlePresetSelect = (preset: PresetKey) => {
    setSelectedPreset(preset)
    const categories = QUICK_FEE_PRESETS[preset] as FeeCategory[]
    setSelectedCategories(new Set(categories))
    // Reset custom prices to defaults
    const prices: Record<string, number> = {}
    categories.forEach((cat) => {
      prices[cat] = FEE_CATEGORIES[cat]?.defaultPrice || 0
    })
    setCustomPrices(prices)
  }

  // Handle category toggle
  const handleCategoryToggle = (category: string, checked: boolean) => {
    const newCategories = new Set(selectedCategories)
    if (checked) {
      newCategories.add(category)
      // Set default price
      setCustomPrices((prev) => ({
        ...prev,
        [category]: FEE_CATEGORIES[category as FeeCategory]?.defaultPrice || 0,
      }))
    } else {
      newCategories.delete(category)
    }
    setSelectedCategories(newCategories)
    setSelectedPreset(null) // Clear preset when manually editing
  }

  // Handle price change
  const handlePriceChange = (category: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setCustomPrices((prev) => ({ ...prev, [category]: numValue }))
  }

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    selectedCategories.forEach((cat) => {
      subtotal += customPrices[cat] || 0
    })
    const tax = subtotal * VAT_RATE
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const { subtotal, tax, total } = calculateTotals()

  // Handle submit
  const handleSubmit = () => {
    if (!selectedShipment || selectedCategories.size === 0) return

    startTransition(async () => {
      try {
        const invoice = await createQuickInvoice({
          shipmentId: selectedShipment,
          feeCategories: Array.from(selectedCategories),
          customPrices,
          currency,
        })

        setOpen(false)
        onSuccess?.()
        router.push(`/${locale}/invoice/${invoice.id}`)
      } catch (error) {
        console.error("Failed to create quick invoice:", error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <IconReceipt className="size-4 me-2" />
            {isRtl ? "فاتورة سريعة" : "Quick Invoice"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRtl ? "إنشاء فاتورة سريعة" : "Create Quick Invoice"}
          </DialogTitle>
          <DialogDescription>
            {isRtl
              ? "اختر شحنة ونوع الرسوم لإنشاء فاتورة بسرعة"
              : "Select a shipment and fee template to quickly generate an invoice"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shipment Selection */}
          <div className="space-y-2">
            <Label>{isRtl ? "الشحنة" : "Shipment"}</Label>
            <Select value={selectedShipment} onValueChange={setSelectedShipment}>
              <SelectTrigger>
                <SelectValue placeholder={isRtl ? "اختر شحنة..." : "Select shipment..."} />
              </SelectTrigger>
              <SelectContent>
                {shipments.map((shipment) => (
                  <SelectItem key={shipment.id} value={shipment.id}>
                    {shipment.shipmentNumber} - {shipment.containerNumber || shipment.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>{isRtl ? "العملة" : "Currency"}</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SDG">{isRtl ? "ج.س - جنيه سوداني" : "SDG"}</SelectItem>
                <SelectItem value="USD">{isRtl ? "دولار" : "USD"}</SelectItem>
                <SelectItem value="SAR">{isRtl ? "ريال" : "SAR"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Fee Presets */}
          <div className="space-y-3">
            <Label>{isRtl ? "قوالب الرسوم" : "Fee Templates"}</Label>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => {
                const Icon = preset.icon
                const isSelected = selectedPreset === preset.key
                return (
                  <Card
                    key={preset.key}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"
                    }`}
                    onClick={() => handlePresetSelect(preset.key)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Icon className="size-4" />
                        {isRtl ? preset.labelAr : preset.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        {isRtl ? preset.descriptionAr : preset.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Fee Categories */}
          <div className="space-y-3">
            <Label>{isRtl ? "تفاصيل الرسوم" : "Fee Details"}</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Object.entries(FEE_CATEGORIES).map(([key, config]) => {
                const isSelected = selectedCategories.has(key)
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      isSelected ? "bg-muted/50 border-primary/50" : ""
                    }`}
                  >
                    <Checkbox
                      id={key}
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(key, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={key}
                        className="text-sm font-medium cursor-pointer block truncate"
                      >
                        {isRtl ? config.ar : config.en}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {isRtl ? config.en : config.ar}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={customPrices[key] || 0}
                          onChange={(e) => handlePriceChange(key, e.target.value)}
                          className="w-32 text-end"
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {currency}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isRtl ? "المجموع الفرعي" : "Subtotal"}
              </span>
              <span className="font-medium tabular-nums">
                {currency} {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {isRtl ? "قيمه مضافة 17%" : "VAT 17%"}
              </span>
              <span className="font-medium tabular-nums">
                {currency} {tax.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{isRtl ? "الإجمالي" : "Total"}</span>
              <span className="tabular-nums">
                {currency} {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !selectedShipment || selectedCategories.size === 0}
          >
            {isPending
              ? isRtl ? "جاري الإنشاء..." : "Creating..."
              : isRtl ? "إنشاء الفاتورة" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
