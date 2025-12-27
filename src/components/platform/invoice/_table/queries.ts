"use server"

import { unstable_cache } from "next/cache"
import type { Prisma } from "@prisma/client"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { filterColumns } from "@/components/table/lib/prisma-filter-columns"

import type { GetInvoicesSchema } from "./validations"

/**
 * Get paginated invoices with filtering and sorting
 */
export async function getInvoices(input: GetInvoicesSchema) {
  return await unstable_cache(
    async () => {
      const session = await auth()
      if (!session?.user?.id) {
        return { data: [], pageCount: 0 }
      }

      const { page, perPage, sort, filters, joinOperator } = input

      // Build basic where conditions from URL params
      const basicWhere: Prisma.InvoiceWhereInput = {
        userId: session.user.id,
        ...(input.invoiceNumber && {
          invoiceNumber: { contains: input.invoiceNumber, mode: "insensitive" },
        }),
        ...(input.status.length > 0 && { status: { in: input.status } }),
        ...(input.currency.length > 0 && { currency: { in: input.currency } }),
        ...(input.total.length === 2 && {
          total: { gte: input.total[0], lte: input.total[1] },
        }),
        ...(input.dueDate.length === 2 && {
          dueDate: {
            gte: new Date(input.dueDate[0]!),
            lte: new Date(input.dueDate[1]!),
          },
        }),
        ...(input.createdAt.length === 2 && {
          createdAt: {
            gte: new Date(input.createdAt[0]!),
            lte: new Date(input.createdAt[1]!),
          },
        }),
      }

      // Build advanced filters
      const advancedWhere = filterColumns<Prisma.InvoiceWhereInput>({
        filters: filters as Parameters<typeof filterColumns>[0]["filters"],
        joinOperator,
      })

      // Combine where conditions
      const where: Prisma.InvoiceWhereInput = {
        ...basicWhere,
        ...advancedWhere,
      }

      // Build order by
      const orderBy: Prisma.InvoiceOrderByWithRelationInput[] = sort.map(
        (s) => ({
          [s.id]: s.desc ? "desc" : "asc",
        })
      )

      // Execute queries in parallel
      const [data, total] = await db.$transaction([
        db.invoice.findMany({
          where,
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
          include: {
            items: true,
            client: true,
            shipment: true,
          },
        }),
        db.invoice.count({ where }),
      ])

      const pageCount = Math.ceil(total / perPage)

      return { data, pageCount }
    },
    [JSON.stringify(input)],
    { revalidate: 1, tags: ["invoices"] }
  )()
}

/**
 * Get invoice status counts for faceted filter
 */
export async function getInvoiceStatusCounts() {
  return await unstable_cache(
    async () => {
      const session = await auth()
      if (!session?.user?.id) {
        return {}
      }

      const counts = await db.invoice.groupBy({
        by: ["status"],
        where: { userId: session.user.id },
        _count: { status: true },
      })

      return counts.reduce(
        (acc, curr) => {
          acc[curr.status] = curr._count.status
          return acc
        },
        {} as Record<string, number>
      )
    },
    ["invoice-status-counts"],
    { revalidate: 1, tags: ["invoices", "invoice-status-counts"] }
  )()
}

/**
 * Get invoice total range for slider filter
 */
export async function getInvoiceTotalRange() {
  return await unstable_cache(
    async () => {
      const session = await auth()
      if (!session?.user?.id) {
        return { min: 0, max: 100000 }
      }

      const result = await db.invoice.aggregate({
        where: { userId: session.user.id },
        _min: { total: true },
        _max: { total: true },
      })

      return {
        min: result._min.total?.toNumber() ?? 0,
        max: result._max.total?.toNumber() ?? 100000,
      }
    },
    ["invoice-total-range"],
    { revalidate: 60, tags: ["invoices", "invoice-total-range"] }
  )()
}
