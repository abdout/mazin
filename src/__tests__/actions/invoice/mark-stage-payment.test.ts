import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { markStagePaymentReceived } from "@/actions/invoice"
import { makeSession } from "@/__tests__/helpers/factories"

describe("markStagePaymentReceived", () => {
  const session = makeSession()
  const stageId = "stage-1"
  const invoiceId = "inv-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  // ============================================
  // Authorization
  // ============================================
  it("throws Unauthorized when no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    await expect(
      markStagePaymentReceived(stageId, invoiceId)
    ).rejects.toThrow("Unauthorized")
  })

  it("throws Unauthorized when session has no user id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {}, expires: "" } as never)

    await expect(
      markStagePaymentReceived(stageId, invoiceId)
    ).rejects.toThrow("Unauthorized")
  })

  // ============================================
  // Transaction behavior
  // ============================================
  it("uses $transaction for atomicity", async () => {
    await markStagePaymentReceived(stageId, invoiceId)

    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function))
  })

  it("updates invoice to PAID with paidAt timestamp", async () => {
    await markStagePaymentReceived(stageId, invoiceId)

    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: invoiceId, userId: session.user.id },
      data: { status: "PAID", paidAt: expect.any(Date) },
    })
  })

  it("updates tracking stage paymentReceived to true", async () => {
    await markStagePaymentReceived(stageId, invoiceId)

    expect(db.trackingStage.update).toHaveBeenCalledWith({
      where: { id: stageId },
      data: { paymentReceived: true },
    })
  })

  // ============================================
  // Revalidation
  // ============================================
  it("revalidates invoice, shipment, and project paths", async () => {
    const result = await markStagePaymentReceived(stageId, invoiceId)

    expect(revalidatePath).toHaveBeenCalledWith("/invoice")
    expect(revalidatePath).toHaveBeenCalledWith("/shipment")
    expect(revalidatePath).toHaveBeenCalledWith("/project")
    expect(result).toEqual({ success: true })
  })

  // ============================================
  // Return value
  // ============================================
  it("returns { success: true } on completion", async () => {
    const result = await markStagePaymentReceived(stageId, invoiceId)

    expect(result).toEqual({ success: true })
  })
})
