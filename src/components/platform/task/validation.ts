import * as z from "zod";

// LinkedActivity schema for auto-generated tasks
export const linkedActivitySchema = z.object({
  projectId: z.string(),
  shipmentType: z.string(),
  stage: z.string(),
  substage: z.string(),
  task: z.string().optional(),
}).nullable().optional();

export const taskFormSchema = z.object({
  task: z.string().optional(),
  project: z.string().optional(),
  projectId: z.string().optional().nullable(),
  status: z.enum(["pending", "stuck", "in_progress", "done"]).optional(),
  priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
  desc: z.string().optional(),
  label: z.string().optional(),
  duration: z.string().optional(),
  assignedTo: z.array(z.string()).optional(),
  date: z.date().optional().nullable(),
  hours: z.number().optional().nullable(),
  linkedActivity: linkedActivitySchema,
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type LinkedActivitySchema = z.infer<typeof linkedActivitySchema>;
