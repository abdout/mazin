import type { Task } from "@prisma/client"
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
} from "nuqs/server"
import * as z from "zod"

import { flagConfig } from "@/components/table/config/flag"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@/components/table/utils"

// Create string literal parsers for enum values
const statusLiterals = ["PENDING", "IN_PROGRESS", "DONE", "STUCK"] as const
const priorityLiterals = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Task>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  title: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringLiteral(statusLiterals)).withDefault([]),
  priority: parseAsArrayOf(parseAsStringLiteral(priorityLiterals)).withDefault(
    []
  ),
  estimatedHours: parseAsArrayOf(parseAsFloat).withDefault([]),
  createdAt: parseAsArrayOf(parseAsFloat).withDefault([]),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export const createTaskSchema = z.object({
  title: z.string(),
  label: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "STUCK"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  estimatedHours: z.number().optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().optional(),
  label: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "STUCK"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimatedHours: z.number().optional(),
})

export type GetTasksSchema = Awaited<ReturnType<typeof searchParamsCache.parse>>
export type CreateTaskSchema = z.infer<typeof createTaskSchema>
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>
