import * as z from "zod";

// Status enum
const statusEnum = z.enum([
  "pending", "in_progress", "customs_hold", "released", "delivered"
] as const);

// Priority enum
const priorityEnum = z.enum([
  "urgent", "high", "medium", "low"
] as const);

export const projectFormSchema = z.object({
  // Core fields
  customer: z.string().optional(),
  blAwbNumber: z.string().optional(),
  description: z.string().optional(),

  // Status
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),

  // Shipment types
  systems: z.array(z.string()).optional(),

  // Ports
  portOfOrigin: z.string().optional(),
  portOfDestination: z.string().optional(),

  // Team
  teamLead: z.string().optional(),
  team: z.array(z.string()).optional(),

  // Dates
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
