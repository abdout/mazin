import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

import { flagConfig } from "@/components/table/config/flag"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@/components/table/lib/parsers"

/**
 * Search params cache for client table URL state
 */
export const clientSearchParamsCache = createSearchParamsCache({
  // Feature flags
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((f) => f.value)
  ).withDefault("advancedFilters"),

  // Pagination
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),

  // Sorting
  sort: getSortingStateParser<Record<string, unknown>>().withDefault([
    { id: "createdAt", desc: true },
  ]),

  // Basic filters
  companyName: parseAsString.withDefault(""),
  contactName: parseAsString.withDefault(""),
  email: parseAsString.withDefault(""),
  isActive: parseAsArrayOf(parseAsBoolean).withDefault([]),
  createdAt: parseAsArrayOf(parseAsFloat).withDefault([]),

  // Advanced filters
  filters: getFiltersStateParser<Record<string, unknown>>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetClientsSchema = Awaited<
  ReturnType<typeof clientSearchParamsCache.parse>
>
