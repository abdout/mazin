import { faker } from "@faker-js/faker"

/** Generate a cuid-like string using available faker methods */
function cuid() {
  return faker.string.alphanumeric(25)
}

export function makeUser(overrides = {}) {
  return {
    id: cuid(),
    email: faker.internet.email(),
    emailVerified: new Date(),
    name: faker.person.fullName(),
    password: faker.internet.password(),
    image: null,
    phone: faker.phone.number(),
    type: "STAFF" as const,
    role: "ADMIN" as const,
    isTwoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeSession(overrides = {}) {
  return {
    user: { id: "test-user-id", name: "Test User", email: "test@test.com", role: "ADMIN" },
    expires: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  }
}

export function makeInvoice(overrides = {}) {
  return {
    id: cuid(),
    invoiceNumber: `${faker.number.int({ min: 1, max: 9999 })}/${new Date().getFullYear().toString().slice(-2)}`,
    userId: "test-user-id",
    shipmentId: cuid(),
    clientId: cuid(),
    currency: "SDG" as const,
    invoiceType: "CLEARANCE" as const,
    status: "DRAFT" as const,
    subtotal: 10000,
    tax: 1700,
    taxRate: 17,
    total: 11700,
    totalInWordsAr: "\u0623\u062D\u062F \u0639\u0634\u0631 \u0623\u0644\u0641\u0627\u064B \u0648\u0633\u0628\u0639\u0645\u0627\u0626\u0629 \u062C\u0646\u064A\u0647 \u0633\u0648\u062F\u0627\u0646\u064A \u0641\u0642\u0637 \u0644\u0627 \u063A\u064A\u0631",
    dueDate: faker.date.future(),
    paidAt: null,
    notes: null,
    taxLabel: "\u0642\u064A\u0645\u0647 \u0645\u0636\u0627\u0641\u0629 17%",
    referenceNumber: null,
    termsAndConditions: null,
    paymentTermsDays: null,
    blNumber: faker.string.alphanumeric(10),
    containerNumbers: [],
    deliveryOrderNo: null,
    declarationNo: null,
    vesselName: faker.company.name(),
    voyageNumber: null,
    commodityType: null,
    supplierName: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeInvoiceItem(overrides = {}) {
  return {
    id: cuid(),
    invoiceId: cuid(),
    description: faker.commerce.productDescription(),
    descriptionAr: "\u0648\u0635\u0641 \u0627\u0644\u0628\u0646\u062F",
    quantity: faker.number.int({ min: 1, max: 10 }),
    unitPrice: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    total: 0, // computed
    feeCategory: null,
    feeType: null,
    tariffCode: null,
    receiptNumber: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeClient(overrides = {}) {
  return {
    id: cuid(),
    userId: "test-user-id",
    companyName: faker.company.name(),
    contactName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    whatsappNumber: "+249" + faker.string.numeric(9),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeShipment(overrides = {}) {
  return {
    id: cuid(),
    userId: "test-user-id",
    clientId: cuid(),
    projectId: null,
    trackingNumber: "TRK-" + faker.string.alphanumeric(6).toUpperCase(),
    trackingSlug: faker.string.alphanumeric(10).toLowerCase(),
    shipmentNumber: `SHP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${faker.string.alphanumeric(4).toUpperCase()}`,
    type: "IMPORT" as const,
    description: faker.commerce.productName(),
    weight: null,
    quantity: null,
    containerNumber: faker.string.alphanumeric(11).toUpperCase(),
    vesselName: faker.company.name(),
    consignor: faker.company.name(),
    consignee: faker.company.name(),
    arrivalDate: faker.date.future(),
    departureDate: null,
    publicTrackingEnabled: true,
    status: "IN_TRANSIT" as const,
    freeDays: 14,
    demurrageDailyRate: 500,
    demurrageStartDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeTrackingStage(overrides = {}) {
  return {
    id: cuid(),
    shipmentId: cuid(),
    stageType: "PRE_ARRIVAL_DOCS" as const,
    status: "PENDING" as const,
    startedAt: null,
    completedAt: null,
    estimatedAt: faker.date.future(),
    notes: null,
    updatedById: null,
    paymentRequested: false,
    paymentReceived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeACD(overrides = {}) {
  return {
    id: cuid(),
    userId: "test-user-id",
    shipmentId: cuid(),
    acnNumber: `ACN-${new Date().toISOString().slice(0, 7).replace("-", "")}-${faker.string.numeric(5)}`,
    status: "DRAFT" as const,
    consignee: faker.company.name(),
    consignor: faker.company.name(),
    hsCode: faker.string.numeric(6),
    cargoDescription: faker.commerce.productDescription(),
    estimatedWeight: faker.number.float({ min: 100, max: 50000 }),
    vesselName: faker.company.name(),
    portOfLoading: "Shanghai",
    portOfDischarge: "Port Sudan",
    estimatedArrival: faker.date.future(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeProject(overrides = {}) {
  return {
    id: cuid(),
    userId: "test-user-id",
    name: faker.company.name() + " Import",
    description: faker.lorem.sentence(),
    status: "IN_PROGRESS" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeTask(overrides = {}) {
  return {
    id: cuid(),
    userId: "test-user-id",
    projectId: cuid(),
    title: faker.lorem.sentence(4),
    description: faker.lorem.sentence(),
    status: "PENDING" as const,
    priority: "MEDIUM" as const,
    category: "DOCUMENTATION" as const,
    assignedToId: null,
    dueDate: faker.date.future(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

export function makeNotification(overrides = {}) {
  return {
    id: cuid(),
    userId: "test-user-id",
    clientId: null,
    type: "TASK_ASSIGNED" as const,
    priority: "normal" as const,
    title: "Task Assigned",
    message: "You have been assigned a new task.",
    metadata: {},
    channel: "IN_APP" as const,
    status: "SENT" as const,
    sentAt: new Date(),
    readAt: null,
    error: null,
    projectId: null,
    taskId: null,
    shipmentId: null,
    invoiceId: null,
    whatsappMessageId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
