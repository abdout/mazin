import * as z from "zod";

// Status enum
const statusEnum = z.enum([
  "pending", "in_progress", "customs_hold", "released", "delivered"
] as const);

// Priority enum
const priorityEnum = z.enum([
  "urgent", "high", "medium", "low"
] as const);

// Activity structure for cascading task generation
const activitySchema = z.object({
  shipmentType: z.string().optional(),
  stage: z.string().optional(),
  substage: z.string().optional(),
  task: z.string().optional(),
  system: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  activity: z.string().optional(),
});

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

  // Activities for cascade task generation
  activities: z.array(activitySchema).optional(),

  // Client relation
  customerId: z.string().optional().nullable(),

  // Ports
  portOfOrigin: z.string().optional(),
  portOfDestination: z.string().optional(),

  // Team
  teamLead: z.string().optional(),
  team: z.array(z.string()).optional(),

  // Dates
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),

  // Cascade options
  skipCascade: z.boolean().optional(), // Skip auto-creating shipment/tasks
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
