/**
 * Clients Seed
 * Creates sample clients for invoice testing
 */

import type { PrismaClient } from "@prisma/client"
import type { ClientRef, UserRef } from "./types"
import { logSuccess } from "./utils"

// ============================================================================
// SEED FUNCTION
// ============================================================================

/**
 * Seed clients with billing/shipping addresses
 */
export async function seedClients(
  prisma: PrismaClient,
  users: UserRef[]
): Promise<ClientRef[]> {
  const clients: ClientRef[] = []
  const adminUser = users.find(u => u.role === "ADMIN")

  if (!adminUser) {
    throw new Error("Admin user required for seeding clients")
  }

  // Client 1: Sudanese Importer (Arabic)
  const client1 = await prisma.client.upsert({
    where: { id: "seed-client-001" },
    update: {},
    create: {
      id: "seed-client-001",
      companyName: "شركة الخرطوم للتجارة",
      contactName: "أحمد محمد علي",
      email: "info@khartoum-trading.sd",
      phone: "+249123456789",
      taxId: "SD-TAX-123456",
      billingAddress1: "شارع النيل، مبنى 42",
      billingAddress2: "الطابق الثالث",
      billingCity: "الخرطوم",
      billingState: "ولاية الخرطوم",
      billingCountry: "SD",
      billingPostal: "11111",
      sameAsShipping: true,
      userId: adminUser.id,
    },
  })
  clients.push({ id: client1.id, companyName: client1.companyName })

  // Client 2: International Trading (UAE)
  const client2 = await prisma.client.upsert({
    where: { id: "seed-client-002" },
    update: {},
    create: {
      id: "seed-client-002",
      companyName: "Gulf Trading LLC",
      contactName: "Mohammed Al-Rashid",
      email: "imports@gulf-trading.ae",
      phone: "+971501234567",
      taxId: "AE-VAT-987654",
      billingAddress1: "Dubai Trade Center",
      billingAddress2: "Office 501, Tower A",
      billingCity: "Dubai",
      billingState: "Dubai",
      billingCountry: "AE",
      billingPostal: "12345",
      shippingAddress1: "Port Sudan Free Zone",
      shippingAddress2: "Warehouse 7",
      shippingCity: "Port Sudan",
      shippingState: "Red Sea State",
      shippingCountry: "SD",
      shippingPostal: "33511",
      sameAsShipping: false,
      userId: adminUser.id,
    },
  })
  clients.push({ id: client2.id, companyName: client2.companyName })

  // Client 3: Saudi Company
  const client3 = await prisma.client.upsert({
    where: { id: "seed-client-003" },
    update: {},
    create: {
      id: "seed-client-003",
      companyName: "شركة الرياض للاستيراد",
      contactName: "عبدالله السعيد",
      email: "info@riyadh-imports.sa",
      phone: "+966512345678",
      taxId: "SA-VAT-456789",
      billingAddress1: "طريق الملك فهد",
      billingAddress2: "برج المملكة",
      billingCity: "الرياض",
      billingState: "منطقة الرياض",
      billingCountry: "SA",
      billingPostal: "11564",
      sameAsShipping: true,
      userId: adminUser.id,
    },
  })
  clients.push({ id: client3.id, companyName: client3.companyName })

  // Client 4: Local Manufacturer
  const client4 = await prisma.client.upsert({
    where: { id: "seed-client-004" },
    update: {},
    create: {
      id: "seed-client-004",
      companyName: "Khartoum Motors Ltd",
      contactName: "Hassan Ibrahim",
      email: "procurement@khartoum-motors.sd",
      phone: "+249155667788",
      taxId: "SD-TAX-789012",
      billingAddress1: "Industrial Area, Plot 15",
      billingAddress2: "Khartoum North",
      billingCity: "Khartoum",
      billingState: "Khartoum State",
      billingCountry: "SD",
      billingPostal: "11115",
      sameAsShipping: true,
      userId: adminUser.id,
    },
  })
  clients.push({ id: client4.id, companyName: client4.companyName })

  // Client 5: Food Exporter
  const client5 = await prisma.client.upsert({
    where: { id: "seed-client-005" },
    update: {},
    create: {
      id: "seed-client-005",
      companyName: "Sudan Gum Arabic Export Co",
      contactName: "Fatima Ahmed",
      email: "exports@gum-arabic.sd",
      phone: "+249912345678",
      taxId: "SD-TAX-345678",
      billingAddress1: "Agricultural District",
      billingAddress2: "Building 8",
      billingCity: "El Obeid",
      billingState: "North Kordofan",
      billingCountry: "SD",
      billingPostal: "51111",
      sameAsShipping: true,
      userId: adminUser.id,
    },
  })
  clients.push({ id: client5.id, companyName: client5.companyName })

  logSuccess("Clients", clients.length, "with addresses")
  return clients
}
