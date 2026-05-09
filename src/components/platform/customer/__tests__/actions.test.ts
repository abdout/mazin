import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createClient,
  deleteClient,
  getClient,
  getClients,
  toggleClientStatus,
  updateClient,
} from "../actions"
import { makeSession } from "@/__tests__/helpers/factories"

const USER_A = "user-a"
const CLIENT_ID = "cm7clxxxxxxxxxxxxxxxxxxxx"

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    companyName: "Acme Importers",
    contactName: "Mohammed Abdelrahman",
    email: "contact@acme.sd",
    phone: "+249111111111",
    billingAddress1: "Port Sudan",
    billingCity: "Port Sudan",
    billingCountry: "SD",
    sameAsShipping: true,
    isActive: true,
    ...overrides,
  }
}

describe("customer actions — tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(
      makeSession({ user: { id: USER_A, role: "ADMIN", name: "A", email: "a@t" } }) as any
    )
  })

  describe("getClients", () => {
    it("scopes findMany to session.user.id", async () => {
      vi.mocked(db.client.findMany).mockResolvedValueOnce([] as any)
      await getClients()
      const call = vi.mocked(db.client.findMany).mock.calls[0]?.[0] as any
      expect(call.where.userId).toBe(USER_A)
    })

    it("propagates the isActive filter when provided", async () => {
      vi.mocked(db.client.findMany).mockResolvedValueOnce([] as any)
      await getClients({ isActive: false })
      const call = vi.mocked(db.client.findMany).mock.calls[0]?.[0] as any
      expect(call.where.isActive).toBe(false)
      expect(call.where.userId).toBe(USER_A)
    })

    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)
      await expect(getClients()).rejects.toThrow("Unauthorized")
      expect(db.client.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getClient", () => {
    it("uses findFirst with { id, userId }", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce(null as any)
      await getClient(CLIENT_ID)
      const call = vi.mocked(db.client.findFirst).mock.calls[0]?.[0] as any
      expect(call.where).toEqual({ id: CLIENT_ID, userId: USER_A })
    })
  })

  // Mutations now return `{ success: true, data } | { success: false, error, code }`
  // instead of throwing. The tests below were previously asserting `rejects.toThrow`;
  // they are updated to assert the structured result so the new contract is
  // visible to readers and any future drift breaks the test, not the UI.

  describe("createClient", () => {
    it("rejects invalid input (missing companyName)", async () => {
      const result = await createClient(validInput({ companyName: "" }) as any)
      expect(result).toMatchObject({ success: false })
      expect(db.client.create).not.toHaveBeenCalled()
    })

    it("sets userId on creation", async () => {
      vi.mocked(db.client.create).mockResolvedValueOnce({ id: CLIENT_ID } as any)
      await createClient(validInput() as any)
      const call = vi.mocked(db.client.create).mock.calls[0]?.[0] as any
      expect(call.data.userId).toBe(USER_A)
      expect(call.data.companyName).toBe("Acme Importers")
    })

    it("normalizes empty email string to null", async () => {
      vi.mocked(db.client.create).mockResolvedValueOnce({ id: CLIENT_ID } as any)
      await createClient(validInput({ email: "" }) as any)
      const call = vi.mocked(db.client.create).mock.calls[0]?.[0] as any
      expect(call.data.email).toBeNull()
    })

    it("blocks VIEWER from creating clients (audit P1 #17)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(
        makeSession({ user: { id: USER_A, role: "VIEWER" } }) as any,
      )
      const result = await createClient(validInput() as any)
      expect(result).toMatchObject({ success: false, code: "FORBIDDEN" })
      expect(db.client.create).not.toHaveBeenCalled()
    })
  })

  describe("updateClient", () => {
    it("refuses to update a client owned by another user (ownership probe)", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce(null as any)
      const result = await updateClient(CLIENT_ID, validInput() as any)
      expect(result).toMatchObject({ success: false, code: "NOT_FOUND" })
      expect(db.client.update).not.toHaveBeenCalled()
    })

    it("updates when the caller owns the client", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce({ id: CLIENT_ID } as any)
      vi.mocked(db.client.update).mockResolvedValueOnce({ id: CLIENT_ID } as any)
      await updateClient(CLIENT_ID, validInput({ companyName: "Renamed" }) as any)
      const findCall = vi.mocked(db.client.findFirst).mock.calls[0]?.[0] as any
      expect(findCall.where).toEqual({ id: CLIENT_ID, userId: USER_A })
      const updateCall = vi.mocked(db.client.update).mock.calls[0]?.[0] as any
      expect(updateCall.data.companyName).toBe("Renamed")
    })

    it("blocks VIEWER from updating clients", async () => {
      vi.mocked(auth).mockResolvedValueOnce(
        makeSession({ user: { id: USER_A, role: "VIEWER" } }) as any,
      )
      const result = await updateClient(CLIENT_ID, validInput() as any)
      expect(result).toMatchObject({ success: false, code: "FORBIDDEN" })
      expect(db.client.update).not.toHaveBeenCalled()
    })
  })

  describe("deleteClient", () => {
    it("refuses cross-tenant deletion", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce(null as any)
      const result = await deleteClient(CLIENT_ID)
      expect(result).toMatchObject({ success: false, code: "NOT_FOUND" })
      expect(db.client.delete).not.toHaveBeenCalled()
    })

    it("refuses to delete a client with existing invoices (data integrity)", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce({
        id: CLIENT_ID,
        invoices: [{ id: "inv-1" }],
      } as any)
      const result = await deleteClient(CLIENT_ID)
      expect(result).toMatchObject({ success: false, code: "VALIDATION" })
      expect(db.client.delete).not.toHaveBeenCalled()
    })

    it("deletes when owned by caller and no invoices linked", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce({
        id: CLIENT_ID,
        invoices: [],
      } as any)
      vi.mocked(db.client.delete).mockResolvedValueOnce({ id: CLIENT_ID } as any)
      const result = await deleteClient(CLIENT_ID)
      expect(result).toMatchObject({ success: true })
      expect(db.client.delete).toHaveBeenCalled()
    })

    it("blocks CLERK from deleting clients (delete needs MANAGER+)", async () => {
      vi.mocked(auth).mockResolvedValueOnce(
        makeSession({ user: { id: USER_A, role: "CLERK" } }) as any,
      )
      const result = await deleteClient(CLIENT_ID)
      expect(result).toMatchObject({ success: false, code: "FORBIDDEN" })
      expect(db.client.delete).not.toHaveBeenCalled()
    })
  })

  describe("toggleClientStatus", () => {
    it("refuses cross-tenant toggle", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce(null as any)
      const result = await toggleClientStatus(CLIENT_ID)
      expect(result).toMatchObject({ success: false, code: "NOT_FOUND" })
      expect(db.client.update).not.toHaveBeenCalled()
    })

    it("flips isActive when owned", async () => {
      vi.mocked(db.client.findFirst).mockResolvedValueOnce({
        id: CLIENT_ID,
        isActive: true,
      } as any)
      vi.mocked(db.client.update).mockResolvedValueOnce({
        id: CLIENT_ID,
        isActive: false,
      } as any)
      await toggleClientStatus(CLIENT_ID)
      const call = vi.mocked(db.client.update).mock.calls[0]?.[0] as any
      expect(call.data.isActive).toBe(false)
    })
  })
})
