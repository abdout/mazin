import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
} from "nuqs/server"

import { flagConfig } from "@/components/table/config/flag"
import {
  getFiltersStateParser,
  getSortingStateParser,
} from "@/components/table/lib/parsers"

import { currencyLiterals, invoiceStatusLiterals } from "./config"

/**
 * Search params cache for invoice table
 * Handles URL state for pagination, sorting, and filtering
 */
export const invoiceSearchParamsCache = createSearchParamsCache({
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
  invoiceNumber: parseAsString.withDefault(""),
  status: parseAsArrayOf(
    parseAsStringLiteral(invoiceStatusLiterals)
  ).withDefault([]),
  currency: parseAsArrayOf(
    parseAsStringLiteral(currencyLiterals)
  ).withDefault([]),
  total: parseAsArrayOf(parseAsFloat).withDefault([]),
  dueDate: parseAsArrayOf(parseAsFloat).withDefault([]),
  createdAt: parseAsArrayOf(parseAsFloat).withDefault([]),

  // Advanced filters
  filters: getFiltersStateParser<Record<string, unknown>>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type GetInvoicesSchema = Awaited<
  ReturnType<typeof invoiceSearchParamsCache.parse>
>
