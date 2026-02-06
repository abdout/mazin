"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { CustomsPaymentType, CustomsPaymentStatus } from "@prisma/client"
import { z } from "zod"

// Types
type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

// Common authorities in Sudan
export const AUTHORITIES = {
  SUDAN_CUSTOMS: "Sudan Customs Authority",
  PORT_SUDAN: "Port Sudan Authority",
  SSMO: "Sudanese Standards and Metrology Organization",
  QUARANTINE: "Plant Quarantine",
  ANIMAL_RESOURCES: "Ministry of Animal Resources",
  NATIONAL_SECURITY: "National Security",
  SHIPPING_LINE: "Shipping Line",
  FREIGHT_FORWARDER: "Freight Forwarder",
} as const

export type Authority = keyof typeof AUTHORITIES

// Validation schemas
const createPaymentSchema = z.object({
  declarationId: z.string().min(1, "Declaration is required"),
  paymentType: z.nativeEnum(CustomsPaymentType),
  amount: z.number().positive("Amount must be positive"),
  authority: z.string().min(1, "Authority is required"),
  authorityRef: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

// Helper: Generate payment reference
function generatePaymentRef(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `CP-${dateStr}-${random}`
}

// ============================================
// CUSTOMS PAYMENT MANAGEMENT
// ============================================

export async function getCustomsPayments(params?: {
  declarationId?: string
  paymentType?: CustomsPaymentType
  status?: CustomsPaymentStatus
  startDate?: Date
  endDate?: Date
  page?: number
  pageSize?: number
}): Promise<ActionResult<{
  data: unknown[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = {}

    if (params?.declarationId) where.declarationId = params.declarationId
    if (params?.paymentType) where.paymentType = params.paymentType
    if (params?.status) where.status = params.status

    if (params?.startDate || params?.endDate) {
      where.paymentDate = {}
      if (params.startDate) {
        (where.paymentDate as Record<string, Date>).gte = params.startDate
      }
      if (params.endDate) {
        (where.paymentDate as Record<string, Date>).lte = params.endDate
      }
    }

    const [payments, total] = await Promise.all([
      db.customsPayment.findMany({
        where,
        include: {
          declaration: {
            select: {
              id: true,
              declarationNo: true,
              status: true,
              shipment: {
                select: {
                  id: true,
                  shipmentNumber: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          transaction: {
            select: {
              id: true,
              transactionRef: true,
              isReconciled: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.customsPayment.count({ where }),
    ])

    return {
      success: true,
      data: {
        data: payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        total,
        page,
        pageSize,
        hasMore: skip + payments.length < total,
      },
    }
  } catch (error) {
    console.error("Error fetching customs payments:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payments",
    }
  }
}

export async function getCustomsPayment(
  paymentId: string
): Promise<ActionResult<unknown>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const payment = await db.customsPayment.findUnique({
      where: { id: paymentId },
      include: {
        declaration: {
          include: {
            shipment: {
              select: {
                id: true,
                shipmentNumber: true,
                description: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        transaction: true,
      },
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    return {
      success: true,
      data: {
        ...payment,
        amount: Number(payment.amount),
      },
    }
  } catch (error) {
    console.error("Error fetching customs payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payment",
    }
  }
}

export async function createAuthorityPayment(
  input: CreatePaymentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = createPaymentSchema.parse(input)

    // Verify declaration exists
    const declaration = await db.customsDeclaration.findUnique({
      where: { id: validated.declarationId },
    })

    if (!declaration) {
      return { success: false, error: "Customs declaration not found" }
    }

    const payment = await db.customsPayment.create({
      data: {
        paymentRef: generatePaymentRef(),
        paymentType: validated.paymentType,
        amount: validated.amount,
        authority: validated.authority,
        authorityRef: validated.authorityRef,
        paymentDate: validated.paymentDate || new Date(),
        notes: validated.notes,
        receiptUrl: validated.receiptUrl,
        declarationId: validated.declarationId,
        createdById: session.user.id,
        status: "PENDING",
      },
    })

    revalidatePath("/finance")
    revalidatePath("/customs")

    return { success: true, data: { id: payment.id } }
  } catch (error) {
    console.error("Error creating customs payment:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message ?? "Validation error" }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment",
    }
  }
}

export async function updatePaymentReceipt(
  paymentId: string,
  receiptUrl: string,
  authorityRef?: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const payment = await db.customsPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    await db.customsPayment.update({
      where: { id: paymentId },
      data: {
        receiptUrl,
        authorityRef: authorityRef || payment.authorityRef,
        status: "CONFIRMED",
      },
    })

    revalidatePath("/finance")

    return { success: true }
  } catch (error) {
    console.error("Error updating receipt:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update receipt",
    }
  }
}

export async function markPaymentAsPaid(
  paymentId: string,
  bankAccountId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const payment = await db.customsPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    if (payment.status === "PAID" || payment.status === "CONFIRMED") {
      return { success: false, error: "Payment already processed" }
    }

    const bankAccount = await db.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!bankAccount) {
      return { success: false, error: "Bank account not found" }
    }

    const amount = Number(payment.amount)
    const currentBalance = Number(bankAccount.currentBalance)
    const newBalance = currentBalance - amount

    await db.$transaction(async (tx) => {
      // Create bank transaction
      const transaction = await tx.bankTransaction.create({
        data: {
          transactionRef: `CUS-${payment.paymentRef}`,
          type: "DEBIT",
          amount,
          balanceAfter: newBalance,
          description: `${payment.paymentType} payment - ${payment.authority}`,
          reference: payment.paymentRef,
          transactionDate: new Date(),
          sourceType: "CUSTOMS",
          sourceId: payment.id,
          bankAccountId,
        },
      })

      // Update customs payment
      await tx.customsPayment.update({
        where: { id: paymentId },
        data: {
          status: "PAID",
          transactionId: transaction.id,
        },
      })

      // Update bank account balance
      await tx.bankAccount.update({
        where: { id: bankAccountId },
        data: { currentBalance: newBalance },
      })
    })

    revalidatePath("/finance")
    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error marking payment as paid:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payment",
    }
  }
}

export async function cancelPayment(
  paymentId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const payment = await db.customsPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    if (payment.status === "PAID" || payment.status === "CONFIRMED") {
      return { success: false, error: "Cannot cancel processed payment" }
    }

    await db.customsPayment.update({
      where: { id: paymentId },
      data: {
        status: "CANCELLED",
        notes: reason ? `${payment.notes || ""}\nCancelled: ${reason}` : payment.notes,
      },
    })

    revalidatePath("/finance")

    return { success: true }
  } catch (error) {
    console.error("Error cancelling payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel payment",
    }
  }
}

// ============================================
// RECONCILIATION
// ============================================

export async function reconcileWithBankTransaction(
  paymentId: string,
  transactionId: string
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const payment = await db.customsPayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return { success: false, error: "Payment not found" }
    }

    const transaction = await db.bankTransaction.findFirst({
      where: {
        id: transactionId,
        bankAccount: {
          userId: session.user.id,
        },
      },
    })

    if (!transaction) {
      return { success: false, error: "Transaction not found" }
    }

    await db.$transaction(async (tx) => {
      await tx.customsPayment.update({
        where: { id: paymentId },
        data: {
          transactionId,
          status: "CONFIRMED",
        },
      })

      await tx.bankTransaction.update({
        where: { id: transactionId },
        data: {
          sourceType: "CUSTOMS",
          sourceId: paymentId,
          isReconciled: true,
          reconciledAt: new Date(),
        },
      })
    })

    revalidatePath("/finance")
    revalidatePath("/finance/banking")

    return { success: true }
  } catch (error) {
    console.error("Error reconciling payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reconcile payment",
    }
  }
}

// ============================================
// REPORTING
// ============================================

export async function getPaymentsByDeclaration(
  declarationId: string
): Promise<ActionResult<unknown[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const payments = await db.customsPayment.findMany({
      where: { declarationId },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        transaction: {
          select: {
            id: true,
            transactionRef: true,
            isReconciled: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
    }
  } catch (error) {
    console.error("Error fetching declaration payments:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payments",
    }
  }
}

export async function getCustomsPaymentSummary(params?: {
  startDate?: Date
  endDate?: Date
}): Promise<ActionResult<{
  totalPayments: number
  pendingPayments: number
  paidPayments: number
  confirmedPayments: number
  totalPendingAmount: number
  totalPaidAmount: number
  byPaymentType: { type: CustomsPaymentType; count: number; total: number }[]
  byAuthority: { authority: string; count: number; total: number }[]
}>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const dateFilter: Record<string, unknown> = {}
    if (params?.startDate || params?.endDate) {
      dateFilter.paymentDate = {}
      if (params.startDate) {
        (dateFilter.paymentDate as Record<string, Date>).gte = params.startDate
      }
      if (params.endDate) {
        (dateFilter.paymentDate as Record<string, Date>).lte = params.endDate
      }
    }

    const [
      totalPayments,
      pendingPayments,
      paidPayments,
      confirmedPayments,
      pendingAmount,
      paidAmount,
      byType,
      byAuthority,
    ] = await Promise.all([
      db.customsPayment.count({ where: dateFilter }),
      db.customsPayment.count({ where: { ...dateFilter, status: "PENDING" } }),
      db.customsPayment.count({ where: { ...dateFilter, status: "PAID" } }),
      db.customsPayment.count({ where: { ...dateFilter, status: "CONFIRMED" } }),
      db.customsPayment.aggregate({
        where: { ...dateFilter, status: "PENDING" },
        _sum: { amount: true },
      }),
      db.customsPayment.aggregate({
        where: { ...dateFilter, status: { in: ["PAID", "CONFIRMED"] } },
        _sum: { amount: true },
      }),
      db.customsPayment.groupBy({
        by: ["paymentType"],
        where: dateFilter,
        _count: true,
        _sum: { amount: true },
      }),
      db.customsPayment.groupBy({
        by: ["authority"],
        where: dateFilter,
        _count: true,
        _sum: { amount: true },
      }),
    ])

    return {
      success: true,
      data: {
        totalPayments,
        pendingPayments,
        paidPayments,
        confirmedPayments,
        totalPendingAmount: Number(pendingAmount._sum.amount || 0),
        totalPaidAmount: Number(paidAmount._sum.amount || 0),
        byPaymentType: byType.map((t) => ({
          type: t.paymentType,
          count: t._count,
          total: Number(t._sum.amount || 0),
        })),
        byAuthority: byAuthority.map((a) => ({
          authority: a.authority,
          count: a._count,
          total: Number(a._sum.amount || 0),
        })),
      },
    }
  } catch (error) {
    console.error("Error fetching payment summary:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch summary",
    }
  }
}
