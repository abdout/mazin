import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { createACD, getACD, submitACD, deleteACD, listACDs } from "@/actions/acd"
import { makeSession, makeShipment, makeACD } from "@/__tests__/helpers/factories"

describe("ACD Actions", () => {
  const session = makeSession()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  // ============================================
  // createACD
  // ============================================
  describe("createACD", () => {
    const validInput = {
      shipmentId: "ship-1",
      consignee: "Port Sudan Trading Co",
      consignor: "Shanghai Export Ltd",
      hsCode: "720810",
      cargoDescription: "Steel bars",
      estimatedWeight: 25000,
      vesselName: "MV Nile Star",
      portOfLoading: "Shanghai",
      portOfDischarge: "Port Sudan",
    }

    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(createACD(validInput)).rejects.toThrow("Unauthorized")
    })

    it("throws when shipment not found", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(null)

      await expect(createACD(validInput)).rejects.toThrow("Shipment not found or access denied")
    })

    it("validates input schema and rejects invalid data", async () => {
      await expect(
        createACD({
          shipmentId: "",
          consignee: "",
          consignor: "",
          hsCode: "",
          cargoDescription: "",
          estimatedWeight: -5,
          vesselName: "",
          portOfLoading: "",
        })
      ).rejects.toThrow() // Zod validation error
    })

    it("generates ACN number and creates ACD", async () => {
      const shipment = makeShipment({ id: "ship-1" })
      vi.mocked(db.shipment.findFirst).mockResolvedValue(shipment as any)
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(null)

      const mockACD = { ...makeACD({ shipmentId: "ship-1" }), shipment: { shipmentNumber: "SHP-1", trackingNumber: "TRK-1" } }
      vi.mocked(db.advanceCargoDeclaration.create).mockResolvedValue(mockACD as any)

      const result = await createACD(validInput)

      expect(db.advanceCargoDeclaration.create).toHaveBeenCalledTimes(1)
      const createCall = vi.mocked(db.advanceCargoDeclaration.create).mock.calls[0]![0] as {
        data: Record<string, unknown>
      }
      expect(createCall.data.consignee).toBe("Port Sudan Trading Co")
      expect(createCall.data.consignor).toBe("Shanghai Export Ltd")
      expect(createCall.data.hsCode).toBe("720810")
      expect(createCall.data.cargoDescription).toBe("Steel bars")
      expect(createCall.data.estimatedWeight).toBe(25000)
      expect(createCall.data.vesselName).toBe("MV Nile Star")
      expect(createCall.data.portOfLoading).toBe("Shanghai")
      expect(createCall.data.portOfDischarge).toBe("Port Sudan")
      expect(createCall.data.userId).toBe(session.user.id)
      expect(createCall.data.shipmentId).toBe("ship-1")
      // ACN number is generated
      expect(typeof createCall.data.acnNumber).toBe("string")
      expect(result).toBeDefined()
    })

    it("revalidates shipment paths after creation", async () => {
      vi.mocked(db.shipment.findFirst).mockResolvedValue(makeShipment({ id: "ship-1" }) as any)
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(null)
      vi.mocked(db.advanceCargoDeclaration.create).mockResolvedValue(
        { ...makeACD(), shipment: { shipmentNumber: "SHP-1", trackingNumber: null } } as never
      )

      await createACD(validInput)

      expect(revalidatePath).toHaveBeenCalledWith("/shipments")
      expect(revalidatePath).toHaveBeenCalledWith("/shipments/ship-1")
    })
  })

  // ============================================
  // getACD
  // ============================================
  describe("getACD", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(getACD("acd-1")).rejects.toThrow("Unauthorized")
    })

    it("throws when ACD not found", async () => {
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(null)

      await expect(getACD("acd-nonexistent")).rejects.toThrow("ACD not found")
    })

    it("returns ACD with shipment info and validation details", async () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      const mockACD = {
        ...makeACD({ id: "acd-1", status: "SUBMITTED", validatedAt: null, validatedBy: null }),
        shipmentId: "ship-1",
        shipment: {
          id: "ship-1",
          shipmentNumber: "SHP-001",
          trackingNumber: "TRK-001",
          arrivalDate: futureDate,
          status: "IN_TRANSIT",
          vesselName: "MV Star",
        },
      }
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(mockACD as any)

      const result = await getACD("acd-1")

      expect(result.validationInfo).toBeDefined()
      expect(result.validationInfo.canValidate).toBe(true)
      expect(result.validationInfo.daysUntilArrival).toBeGreaterThanOrEqual(9)
      expect(result.validationInfo.isValidated).toBe(false)
    })
  })

  // ============================================
  // submitACD
  // ============================================
  describe("submitACD", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(submitACD("acd-1")).rejects.toThrow("Unauthorized")
    })

    it("throws when ACD not found", async () => {
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(null)

      await expect(submitACD("acd-nonexistent")).rejects.toThrow("ACD not found")
    })

    it("rejects when ACD is not in DRAFT status", async () => {
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(
        makeACD({ id: "acd-1", status: "SUBMITTED", shipmentId: "ship-1" }) as any
      )

      await expect(submitACD("acd-1")).rejects.toThrow(
        "ACD can only be submitted from DRAFT status. Current status: SUBMITTED"
      )
    })

    it("transitions DRAFT to SUBMITTED", async () => {
      const acd = makeACD({ id: "acd-1", status: "DRAFT", shipmentId: "ship-1" })
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(acd as any)
      vi.mocked(db.advanceCargoDeclaration.update).mockResolvedValue({ ...acd, status: "SUBMITTED" } as any)

      const result = await submitACD("acd-1")

      expect(db.advanceCargoDeclaration.update).toHaveBeenCalledWith({
        where: { id: "acd-1" },
        data: { status: "SUBMITTED" },
      })
      expect(result.status).toBe("SUBMITTED")
    })

    it("revalidates paths after submission", async () => {
      const acd = makeACD({ id: "acd-1", status: "DRAFT", shipmentId: "ship-1" })
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(acd as any)
      vi.mocked(db.advanceCargoDeclaration.update).mockResolvedValue({ ...acd, status: "SUBMITTED" } as any)

      await submitACD("acd-1")

      expect(revalidatePath).toHaveBeenCalledWith("/shipments")
      expect(revalidatePath).toHaveBeenCalledWith("/shipments/ship-1")
    })
  })

  // ============================================
  // deleteACD
  // ============================================
  describe("deleteACD", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(deleteACD("acd-1")).rejects.toThrow("Unauthorized")
    })

    it("throws when ACD not found", async () => {
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(null)

      await expect(deleteACD("acd-nonexistent")).rejects.toThrow("ACD not found")
    })

    it("rejects when ACD is not in DRAFT status", async () => {
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(
        makeACD({ id: "acd-1", status: "VALIDATED", shipmentId: "ship-1" }) as any
      )

      await expect(deleteACD("acd-1")).rejects.toThrow(
        "ACD can only be deleted in DRAFT status. Current status: VALIDATED"
      )
    })

    it("deletes ACD when in DRAFT status", async () => {
      const acd = makeACD({ id: "acd-1", status: "DRAFT", shipmentId: "ship-1" })
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(acd as any)
      vi.mocked(db.advanceCargoDeclaration.delete).mockResolvedValue(acd as any)

      const result = await deleteACD("acd-1")

      expect(db.advanceCargoDeclaration.delete).toHaveBeenCalledWith({
        where: { id: "acd-1" },
      })
      expect(result).toEqual({ success: true })
    })

    it("revalidates paths after deletion", async () => {
      const acd = makeACD({ id: "acd-1", status: "DRAFT", shipmentId: "ship-1" })
      vi.mocked(db.advanceCargoDeclaration.findFirst).mockResolvedValue(acd as any)
      vi.mocked(db.advanceCargoDeclaration.delete).mockResolvedValue(acd as any)

      await deleteACD("acd-1")

      expect(revalidatePath).toHaveBeenCalledWith("/shipments")
      expect(revalidatePath).toHaveBeenCalledWith("/shipments/ship-1")
    })
  })

  // ============================================
  // listACDs
  // ============================================
  describe("listACDs", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(listACDs()).rejects.toThrow("Unauthorized")
    })

    it("returns all ACDs for the user when no shipmentId filter", async () => {
      const acds = [makeACD(), makeACD()]
      vi.mocked(db.advanceCargoDeclaration.findMany).mockResolvedValue(acds as any)

      const result = await listACDs()

      expect(db.advanceCargoDeclaration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })
      )
      expect(result).toHaveLength(2)
    })

    it("filters by shipmentId when provided", async () => {
      const acds = [makeACD({ shipmentId: "ship-1" })]
      vi.mocked(db.advanceCargoDeclaration.findMany).mockResolvedValue(acds as any)

      const result = await listACDs("ship-1")

      expect(db.advanceCargoDeclaration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: session.user.id, shipmentId: "ship-1" },
        })
      )
      expect(result).toHaveLength(1)
    })
  })
})
