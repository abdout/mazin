"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireStaff } from "@/lib/auth-context"
import { requireCan } from "@/lib/authorization"
import { safeActionError } from "@/lib/action-error"
import { logger } from "@/lib/logger"

const log = logger.forModule("customer.actions")

const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  billingAddress1: z.string().min(1, "Billing address is required"),
  billingAddress2: z.string().optional(),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().optional(),
  billingCountry: z.string().default("SD"),
  billingPostal: z.string().optional(),
  shippingAddress1: z.string().optional(),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingCountry: z.string().optional(),
  shippingPostal: z.string().optional(),
  sameAsShipping: z.boolean().default(true),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type ClientFormData = z.input<typeof clientSchema>

// All staff (ADMIN/MANAGER/CLERK/VIEWER) may read; only CLERK+ may write.
// VIEWER attempts to mutate now throw `ForbiddenError` rather than silently
// succeeding (audit P0 #17 / P1 customer authz).

export async function getClients(filters?: { isActive?: boolean }) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "client")

  return db.client.findMany({
    where: {
      userId: ctx.userId,
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      invoices: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getClient(id: string) {
  const ctx = await requireStaff()
  requireCan(ctx, "read", "client")

  return db.client.findFirst({
    where: { id, userId: ctx.userId },
    include: {
      invoices: true,
    },
  })
}

export async function createClient(formData: ClientFormData) {
  try {
    const ctx = await requireStaff()
    requireCan(ctx, "create", "client")

    const validated = clientSchema.parse(formData)

    const client = await db.client.create({
      data: {
        ...validated,
        email: validated.email || null,
        userId: ctx.userId,
      },
    })

    revalidatePath("/customer")
    return { success: true as const, data: client }
  } catch (err) {
    return safeActionError(err, log, "Failed to create client.")
  }
}

export async function updateClient(id: string, formData: ClientFormData) {
  try {
    const ctx = await requireStaff()
    requireCan(ctx, "update", "client")

    const validated = clientSchema.parse(formData)

    // Ownership probe — without this, any authenticated user could update
    // another user's client row just by knowing the id.
    const existing = await db.client.findFirst({
      where: { id, userId: ctx.userId },
      select: { id: true },
    })
    if (!existing) {
      return { success: false as const, error: "Client not found.", code: "NOT_FOUND" as const }
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...validated,
        email: validated.email || null,
      },
    })

    revalidatePath("/customer")
    revalidatePath(`/customer/${id}`)
    return { success: true as const, data: client }
  } catch (err) {
    return safeActionError(err, log, "Failed to update client.")
  }
}

export async function deleteClient(id: string) {
  try {
    const ctx = await requireStaff()
    requireCan(ctx, "delete", "client")

    const client = await db.client.findFirst({
      where: { id, userId: ctx.userId },
      include: { invoices: { select: { id: true } } },
    })

    if (!client) {
      return { success: false as const, error: "Client not found.", code: "NOT_FOUND" as const }
    }

    if (client.invoices.length > 0) {
      return {
        success: false as const,
        error: "Cannot delete a client with existing invoices.",
        code: "VALIDATION" as const,
      }
    }

    await db.client.delete({ where: { id } })

    revalidatePath("/customer")
    return { success: true as const }
  } catch (err) {
    return safeActionError(err, log, "Failed to delete client.")
  }
}

export async function toggleClientStatus(id: string) {
  try {
    const ctx = await requireStaff()
    requireCan(ctx, "update", "client")

    const client = await db.client.findFirst({
      where: { id, userId: ctx.userId },
    })

    if (!client) {
      return { success: false as const, error: "Client not found.", code: "NOT_FOUND" as const }
    }

    const updated = await db.client.update({
      where: { id },
      data: { isActive: !client.isActive },
    })

    revalidatePath("/customer")
    return { success: true as const, data: updated }
  } catch (err) {
    return safeActionError(err, log, "Failed to update client status.")
  }
}
