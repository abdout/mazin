import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  getInvoiceWhatsAppShareData,
  shareInvoiceViaWhatsApp,
} from "@/actions/invoice"
import { makeSession, makeInvoice, makeClient } from "@/__tests__/helpers/factories"

describe("WhatsApp Share Functions", () => {
  const session = makeSession()
  const invoiceId = "inv-wa-1"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue(session as any)
  })

  // ============================================
  // getInvoiceWhatsAppShareData
  // ============================================
  describe("getInvoiceWhatsAppShareData", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(
        getInvoiceWhatsAppShareData(invoiceId)
      ).rejects.toThrow("Unauthorized")
    })

    it("throws Invoice not found when invoice does not exist", async () => {
      vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

      await expect(
        getInvoiceWhatsAppShareData(invoiceId)
      ).rejects.toThrow("Invoice not found")
    })

    it("generates Arabic message for locale 'ar'", async () => {
      const client = makeClient({
        companyName: "شركة النيل",
        whatsappNumber: "+249912345678",
      })
      const invoice = makeInvoice({
        id: invoiceId,
        invoiceNumber: "1044/25",
        total: 50000,
        currency: "SDG",
        blNumber: "BL-ABC",
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId, "ar")

      expect(result.message).toContain("السلام عليكم")
      expect(result.message).toContain("1044/25")
      expect(result.message).toContain("شركة النيل")
      expect(result.message).toContain("BL-ABC")
      expect(result.message).toContain("SDG")
      expect(result.message).toContain("مازن للتخليص الجمركي")
    })

    it("generates English message for locale 'en'", async () => {
      const client = makeClient({
        companyName: "Nile Corp",
        whatsappNumber: "+249912345678",
      })
      const invoice = makeInvoice({
        id: invoiceId,
        invoiceNumber: "1044/25",
        total: 50000,
        currency: "USD",
        blNumber: "BL-XYZ",
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId, "en")

      expect(result.message).toContain("Hello")
      expect(result.message).toContain("Invoice No: 1044/25")
      expect(result.message).toContain("Client: Nile Corp")
      expect(result.message).toContain("B/L No: BL-XYZ")
      expect(result.message).toContain("USD")
      expect(result.message).toContain("Mazin Customs Clearance")
    })

    it("returns a WhatsApp URL with encoded message", async () => {
      const client = makeClient({ whatsappNumber: "+249912345678" })
      const invoice = makeInvoice({
        id: invoiceId,
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId, "ar")

      expect(result.whatsappUrl).toContain("https://wa.me/249912345678")
      expect(result.whatsappUrl).toContain("text=")
      expect(result.phone).toBe("+249912345678")
    })

    it("returns PDF download URL with locale", async () => {
      const invoice = makeInvoice({
        id: invoiceId,
        client: null,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId, "en")

      expect(result.pdfUrl).toContain(`/api/invoice/${invoiceId}/pdf`)
      expect(result.pdfUrl).toContain("locale=en")
    })

    it("omits client line when no client attached", async () => {
      const invoice = makeInvoice({
        id: invoiceId,
        client: null,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId, "en")

      expect(result.message).not.toContain("Client:")
    })

    it("omits B/L line when no blNumber", async () => {
      const invoice = makeInvoice({
        id: invoiceId,
        blNumber: null,
        client: null,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId, "en")

      expect(result.message).not.toContain("B/L No:")
    })

    it("defaults locale to 'ar' when not specified", async () => {
      const invoice = makeInvoice({
        id: invoiceId,
        client: null,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst).mockResolvedValue(invoice as any)

      const result = await getInvoiceWhatsAppShareData(invoiceId)

      expect(result.message).toContain("السلام عليكم")
    })
  })

  // ============================================
  // shareInvoiceViaWhatsApp
  // ============================================
  describe("shareInvoiceViaWhatsApp", () => {
    it("throws Unauthorized when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      await expect(
        shareInvoiceViaWhatsApp(invoiceId, "+249912345678")
      ).rejects.toThrow("Unauthorized")
    })

    it("updates DRAFT invoice to SENT after sharing", async () => {
      const client = makeClient({ whatsappNumber: "+249912345678" })
      const draftInvoice = makeInvoice({
        id: invoiceId,
        status: "DRAFT",
        client,
        shipment: null,
      })
      // First call from getInvoiceWhatsAppShareData, second from shareInvoiceViaWhatsApp
      vi.mocked(db.invoice.findFirst)
        .mockResolvedValueOnce(draftInvoice as any) // getInvoiceWhatsAppShareData
        .mockResolvedValueOnce(draftInvoice as any) // shareInvoiceViaWhatsApp's own findFirst
      vi.mocked(db.invoice.update).mockResolvedValue(
        makeInvoice({ id: invoiceId, status: "SENT" }) as any
       )

      await shareInvoiceViaWhatsApp(invoiceId, "+249912345678", "ar")

      expect(db.invoice.update).toHaveBeenCalledWith({
        where: { id: invoiceId },
        data: { status: "SENT" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/invoice")
      expect(revalidatePath).toHaveBeenCalledWith(`/invoice/${invoiceId}`)
    })

    it("does not update status when invoice is already SENT", async () => {
      const client = makeClient({ whatsappNumber: "+249912345678" })
      const sentInvoice = makeInvoice({
        id: invoiceId,
        status: "SENT",
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst)
        .mockResolvedValueOnce(sentInvoice as any) // getInvoiceWhatsAppShareData
        .mockResolvedValueOnce(sentInvoice as any) // shareInvoiceViaWhatsApp's findFirst

      await shareInvoiceViaWhatsApp(invoiceId, "+249912345678", "ar")

      expect(db.invoice.update).not.toHaveBeenCalled()
    })

    it("does not update status when invoice is PAID", async () => {
      const client = makeClient({ whatsappNumber: "+249912345678" })
      const paidInvoice = makeInvoice({
        id: invoiceId,
        status: "PAID",
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst)
        .mockResolvedValueOnce(paidInvoice as any)
        .mockResolvedValueOnce(paidInvoice as any)

      await shareInvoiceViaWhatsApp(invoiceId, "+249912345678", "en")

      expect(db.invoice.update).not.toHaveBeenCalled()
    })

    it("returns share data with the provided phone number", async () => {
      const client = makeClient({ whatsappNumber: "+249900000000" })
      const invoice = makeInvoice({
        id: invoiceId,
        status: "SENT",
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst)
        .mockResolvedValueOnce(invoice as any)
        .mockResolvedValueOnce(invoice as any)

      const result = await shareInvoiceViaWhatsApp(
        invoiceId,
        "+249912345678",
        "ar"
      )

      expect(result.phone).toBe("+249912345678")
      expect(result.whatsappUrl).toContain("249912345678")
      expect(result.message).toBeDefined()
      expect(result.pdfUrl).toBeDefined()
    })

    it("generates English share data when locale is 'en'", async () => {
      const client = makeClient()
      const invoice = makeInvoice({
        id: invoiceId,
        status: "SENT",
        client,
        shipment: null,
      })
      vi.mocked(db.invoice.findFirst)
        .mockResolvedValueOnce(invoice as any)
        .mockResolvedValueOnce(invoice as any)

      const result = await shareInvoiceViaWhatsApp(
        invoiceId,
        "+249912345678",
        "en"
      )

      expect(result.message).toContain("Hello")
      expect(result.pdfUrl).toContain("locale=en")
    })
  })
})
