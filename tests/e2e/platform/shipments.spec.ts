import { test, expect } from "@playwright/test"
import { expectPageOk, collectConsoleErrors } from "../helpers/page-checks"

const routes = [
  "/en/shipments",
  "/en/shipments/new",
  "/ar/shipments",
]

for (const route of routes) {
  test(`shipments: ${route} renders @smoke`, async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await expectPageOk(page, route)
    const hard = errors.filter(
      e =>
        !/hydrat|ResizeObserver|Warning:|act\(\)/i.test(e) &&
        !e.includes("chrome-error://"),
    )
    expect(hard, `console errors on ${route}:\n${hard.join("\n")}`).toEqual([])
  })
}

test("shipments: new shipment form has required fields @smoke", async ({ page }) => {
  await page.goto("/en/shipments/new")
  await expect(page.getByLabel(/cargo description/i)).toBeVisible()
  await expect(page.getByLabel(/shipper/i)).toBeVisible()
  await expect(page.getByLabel(/consignee/i)).toBeVisible()
  await expect(page.getByRole("button", { name: /create shipment/i })).toBeVisible()
})
