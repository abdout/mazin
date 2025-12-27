import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Control } from "react-hook-form";
import { type ProjectFormValues } from "./validation";

interface GeneralTabProps {
  control: Control<ProjectFormValues>;
}

// Status options
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "customs_hold", label: "Customs Hold" },
  { value: "released", label: "Released" },
  { value: "delivered", label: "Delivered" },
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function GeneralTab({ control }: GeneralTabProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-6 pb-2 border-b">Shipment Information</h2>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FormField
          control={control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Customer / Importer</FormLabel>
              <FormControl>
                <Input placeholder="Customer name" {...field} value={field.value || ''} className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="blAwbNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">BL / AWB Number</FormLabel>
              <FormControl>
                <Input placeholder="Bill of Lading or Air Waybill" {...field} value={field.value || ''} className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Status & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Ports & Locations */}
      <h3 className="text-lg font-medium mb-4">Ports & Locations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FormField
          control={control}
          name="portOfOrigin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Port of Origin</FormLabel>
              <FormControl>
                <Input placeholder="Origin port/airport" {...field} value={field.value || ''} className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="portOfDestination"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Port of Destination</FormLabel>
              <FormControl>
                <Input placeholder="Destination port/airport" {...field} value={field.value || ''} className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Team */}
      <h3 className="text-lg font-medium mb-4">Team Lead</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="teamLead"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Team Lead</FormLabel>
              <FormControl>
                <Input placeholder="Assigned team lead" {...field} value={field.value || ''} className="bg-muted/30" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </section>
  );
}
