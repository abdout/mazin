/**
 * Company Settings Seed
 * Creates default company settings for admin user
 */

import type { PrismaClient } from "@prisma/client"
import type { SettingsRef, UserRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// SEED FUNCTION
// ============================================================================

/**
 * Seed company settings with branding
 */
export async function seedSettings(
  prisma: PrismaClient,
  users: UserRef[]
): Promise<SettingsRef[]> {
  const settings: SettingsRef[] = []
  const adminUser = users.find(u => u.role === "ADMIN")

  if (!adminUser) {
    throw new Error("Admin user required for seeding settings")
  }

  const companySettings = await prisma.companySettings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      companyName: "Mazin Customs Clearance",
      companyNameAr: "مازن للتخليص الجمركي",
      taxId: "SD-MAZIN-001",
      email: "info@mazin.sd",
      phone: "+249912345678",
      website: "https://mazin.sd",
      address1: "Port Sudan Commercial District",
      address2: "Building A, Floor 3",
      city: "Port Sudan",
      state: "Red Sea State",
      country: "SD",
      postalCode: "33511",
      logoUrl: "/logo.png",
      signatureUrl: "/sign.png",
      primaryColor: "#1a365d",
      invoicePrefix: "MZN",
      invoiceStartNum: 1000,
      defaultCurrency: "SDG",
      defaultTaxRate: 15,
      defaultPaymentTerms: 30,
      bankName: "Bank of Khartoum",
      bankBranch: "Port Sudan Branch",
      accountName: "Mazin Customs Clearance Co.",
      accountNumber: "1234567890",
      iban: "SD12BANK1234567890123456",
      swiftCode: "BOKSDKH",
      termsAndConditions: `Terms and Conditions:
1. Payment is due within the specified payment terms.
2. Late payments are subject to 2% monthly interest.
3. All customs duties and government fees are non-refundable.
4. Services are subject to Sudanese customs regulations.
5. Any disputes shall be settled under Sudanese jurisdiction.
6. Prices are subject to change based on government tariffs.
7. Original documents must be provided for customs processing.
8. Insurance coverage is optional and charged separately.

الشروط والأحكام:
١. الدفع مستحق خلال فترة السداد المحددة.
٢. التأخر في السداد يخضع لفائدة ٢٪ شهرياً.
٣. جميع الرسوم الجمركية والحكومية غير قابلة للاسترداد.
٤. الخدمات تخضع لأنظمة الجمارك السودانية.
٥. أي نزاعات تحل تحت الولاية القضائية السودانية.`,
      footerNote: "Thank you for your business! | شكراً لتعاملكم معنا",
      userId: adminUser.id,
    },
  })

  settings.push({
    id: companySettings.id,
    companyName: companySettings.companyName,
  })

  logSuccess("Company Settings", settings.length, "configured with branding")
  return settings
}
