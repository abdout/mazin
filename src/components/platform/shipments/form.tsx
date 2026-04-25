"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import { shipmentIntakeSchema, type ShipmentIntakeData } from "./validation"
import { createShipment } from "./actions"

export function ShipmentIntakeForm({ lang }: { lang: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ShipmentIntakeData>({
    resolver: zodResolver(shipmentIntakeSchema),
    defaultValues: {
      type: "IMPORT",
      description: "",
      consignor: "",
      consignee: "",
      freeDays: 14,
      publicTrackingEnabled: true,
    },
  })

  async function onSubmit(values: ShipmentIntakeData) {
    setSubmitting(true)
    try {
      const shipment = await createShipment(values)
      toast.success(`Created ${shipment.shipmentNumber}`)
      router.push(`/${lang}/shipments/${shipment.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create shipment")
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="IMPORT">Import</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vesselName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vessel name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="consignor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipper</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="consignee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consignee</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value == null ? "" : String(field.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value == null ? "" : String(field.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="containerNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Container #</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="arrivalDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arrival date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value as string | Date).toISOString().slice(0, 10) : ""}
                    onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="freeDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Free days before demurrage</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={field.value == null ? "" : String(field.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="publicTrackingEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="m-0">Allow public tracking</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4 me-2" />
          {submitting ? "Saving…" : "Create shipment"}
        </Button>
      </form>
    </Form>
  )
}
