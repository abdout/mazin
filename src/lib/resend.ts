import { Resend } from "resend"
import { logger } from "@/lib/logger"

const log = logger.forModule("resend")

if (!process.env.RESEND_API_KEY) {
  log.warn("RESEND_API_KEY is not set. Email functionality will not work.")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Mazin <invoices@mazin.sd>"
