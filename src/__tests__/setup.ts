import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ lang: "ar" }),
  usePathname: () => "/ar/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { id: "test-user-id", name: "Test User", email: "test@test.com", role: "ADMIN" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    },
    status: "authenticated",
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Prisma client mock — comprehensive model coverage
// ---------------------------------------------------------------------------

/** Standard Prisma model mock shape with all CRUD + aggregate operations */
function createModelMock() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
    aggregate: vi.fn(),
  }
}

const db = {
  // --- Auth models ---
  user: createModelMock(),
  account: createModelMock(),
  session: createModelMock(),
  verificationToken: createModelMock(),
  passwordResetToken: createModelMock(),
  twoFactorToken: createModelMock(),
  twoFactorConfirmation: createModelMock(),

  // --- Shipment models ---
  shipment: createModelMock(),
  trackingStage: createModelMock(),
  stageInvoice: createModelMock(),
  shipmentDocument: createModelMock(),
  shipmentPayment: createModelMock(),
  container: createModelMock(),
  iMForm: createModelMock(),
  exchangeRate: createModelMock(),

  // --- Invoice models ---
  invoice: createModelMock(),
  invoiceItem: createModelMock(),
  statementOfAccount: createModelMock(),
  statementEntry: createModelMock(),

  // --- Client ---
  client: createModelMock(),

  // --- Project & Task models ---
  project: createModelMock(),
  task: createModelMock(),
  taskAssignmentRule: createModelMock(),

  // --- Customs models ---
  customsDeclaration: createModelMock(),
  document: createModelMock(),
  advanceCargoDeclaration: createModelMock(),
  hsCode: createModelMock(),

  // --- Notification models ---
  notification: createModelMock(),
  notificationPreference: createModelMock(),
  whatsAppMessage: createModelMock(),

  // --- Company ---
  companySettings: createModelMock(),

  // --- Finance models ---
  expense: createModelMock(),
  expenseCategory: createModelMock(),
  bankAccount: createModelMock(),
  bankTransaction: createModelMock(),
  bankStatement: createModelMock(),

  // --- Payroll & Budget models ---
  budget: createModelMock(),
  budgetItem: createModelMock(),
  salary: createModelMock(),
  salaryStructure: createModelMock(),
  payrollRun: createModelMock(),
  payroll: createModelMock(),
  payrollItem: createModelMock(),

  // --- Timesheet & Wallet models ---
  timesheet: createModelMock(),
  timesheetEntry: createModelMock(),
  wallet: createModelMock(),
  walletTransaction: createModelMock(),

  // --- Accounting models ---
  chartOfAccount: createModelMock(),
  journalEntry: createModelMock(),
  journalLine: createModelMock(),
  fiscalYear: createModelMock(),

  // --- Additional models ---
  receipt: createModelMock(),
  feeTemplate: createModelMock(),
  customsPayment: createModelMock(),
  transaction: createModelMock(),
  employee: createModelMock(),

  // --- Marketplace models ---
  vendor: createModelMock(),
  serviceCategory: createModelMock(),
  serviceListing: createModelMock(),
  serviceRequest: createModelMock(),

  // --- Client-level utilities ---
  $transaction: vi.fn((arg: unknown) => {
    if (typeof arg === "function") {
      return arg(db) // pass db itself as the transaction client
    }
    return Promise.resolve(arg)
  }),
  $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  $queryRawUnsafe: vi.fn().mockResolvedValue([{ 1: 1 }]),
}

vi.mock("@/lib/db", () => ({ db }))
