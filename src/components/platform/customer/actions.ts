"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

export async function getClients(filters?: { isActive?: boolean }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.client.findMany({
    where: {
      userId: session.user.id,
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
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return db.client.findFirst({
    where: { id, userId: session.user.id },
    include: {
      invoices: true,
    },
  })
}

export async function createClient(formData: ClientFormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = clientSchema.parse(formData)

  const client = await db.client.create({
    data: {
      ...validated,
      email: validated.email || null,
      userId: session.user.id,
    },
  })

  revalidatePath("/customer")
  return client
}

export async function updateClient(id: string, formData: ClientFormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const validated = clientSchema.parse(formData)

  const client = await db.client.update({
    where: { id },
    data: {
      ...validated,
      email: validated.email || null,
    },
  })

  revalidatePath("/customer")
  revalidatePath(`/customer/${id}`)
  return client
}

export async function deleteClient(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Check if client has invoices
  const client = await db.client.findFirst({
    where: { id, userId: session.user.id },
    include: { invoices: { select: { id: true } } },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  if (client.invoices.length > 0) {
    throw new Error("Cannot delete client with existing invoices")
  }

  await db.client.delete({
    where: { id },
  })

  revalidatePath("/customer")
}

export async function toggleClientStatus(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const client = await db.client.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  const updated = await db.client.update({
    where: { id },
    data: { isActive: !client.isActive },
  })

  revalidatePath("/customer")
  return updated
}
