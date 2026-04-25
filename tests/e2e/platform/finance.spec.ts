import { test, expect } from "@playwright/test"
import { expectPageOk, collectConsoleErrors } from "../helpers/page-checks"

const financeRoutes = [
  "/en/finance",
  "/en/finance/dashboard",
  "/en/finance/accounts",
  "/en/finance/budget",
  "/en/finance/expenses",
  "/en/finance/fees",
  "/en/finance/payroll",
  "/en/finance/salary",
  "/en/finance/timesheet",
  "/en/finance/wallet",
  "/en/finance/reports",
  "/en/finance/receipt",
  "/en/finance/receipt/manage-plan",
  "/en/finance/banking/my-banks",
  "/en/finance/banking/payment-transfer",
  "/en/finance/banking/transaction-history",
]

for (const route of financeRoutes) {
  test(`finance: ${route}`, async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await expectPageOk(page, route)
    const hard = errors.filter(
      (e) => !/hydrat|ResizeObserver|Warning:|404/i.test(e),
    )
    expect(hard, `errors on ${route}:\n${hard.join("\n")}`).toEqual([])
  })
}
