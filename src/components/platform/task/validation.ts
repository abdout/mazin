import * as z from "zod";

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
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
