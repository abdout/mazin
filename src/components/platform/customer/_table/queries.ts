"use server"

import { unstable_cache } from "next/cache"
import type { Prisma } from "@prisma/client"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { filterColumns } from "@/components/table/lib/prisma-filter-columns"

import type { GetClientsSchema } from "./validations"

/**
 * Get paginated clients with filtering and sorting
 */
export async function getClients(input: GetClientsSchema) {
  return await unstable_cache(
    async () => {
      const session = await auth()
      if (!session?.user?.id) {
        return { data: [], pageCount: 0 }
      }

      const { page, perPage, sort, filters, joinOperator } = input

      // Build basic where conditions from URL params
      const basicWhere: Prisma.ClientWhereInput = {
        userId: session.user.id,
        ...(input.companyName && {
          companyName: { contains: input.companyName, mode: "insensitive" },
        }),
        ...(input.contactName && {
          contactName: { contains: input.contactName, mode: "insensitive" },
        }),
        ...(input.email && {
          email: { contains: input.email, mode: "insensitive" },
        }),
        // Boolean filter: only filter if exactly one value is selected
        ...(input.isActive.length === 1 && { isActive: input.isActive[0] }),
        ...(input.createdAt.length === 2 && {
          createdAt: {
            gte: new Date(input.createdAt[0]!),
            lte: new Date(input.createdAt[1]!),
          },
        }),
      }

      // Build advanced filters
      const advancedWhere = filterColumns<Prisma.ClientWhereInput>({
        filters: filters as Parameters<typeof filterColumns>[0]["filters"],
        joinOperator,
      })

      // Combine where conditions
      const where: Prisma.ClientWhereInput = {
        ...basicWhere,
        ...advancedWhere,
      }

      // Build order by
      const orderBy: Prisma.ClientOrderByWithRelationInput[] = sort.map(
        (s) => ({
          [s.id]: s.desc ? "desc" : "asc",
        })
      )

      // Execute queries in parallel
      const [data, total] = await db.$transaction([
        db.client.findMany({
          where,
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
          include: {
            invoices: {
              select: { id: true },
            },
          },
        }),
        db.client.count({ where }),
      ])

      const pageCount = Math.ceil(total / perPage)

      return { data, pageCount }
    },
    [JSON.stringify(input)],
    { revalidate: 1, tags: ["clients"] }
  )()
}

/**
 * Get client status counts for faceted filter
 */
export async function getClientStatusCounts() {
  return await unstable_cache(
    async () => {
      const session = await auth()
      if (!session?.user?.id) {
        return {}
      }

      const counts = await db.client.groupBy({
        by: ["isActive"],
        where: { userId: session.user.id },
        _count: { isActive: true },
      })

      return counts.reduce(
        (acc, curr) => {
          acc[String(curr.isActive)] = curr._count.isActive
          return acc
        },
        {} as Record<string, number>
      )
    },
    ["client-status-counts"],
    { revalidate: 1, tags: ["clients", "client-status-counts"] }
  )()
}
