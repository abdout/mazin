import { test, expect } from "@playwright/test"
import { expectPageOk } from "../helpers/page-checks"

// Seeded tracking numbers from prisma/seeds/shipments.ts
const trackingNumbers = ["TRK-ABC123", "TRK-XYZ789"]

for (const trk of trackingNumbers) {
  test(`track ${trk} (en)`, async ({ page }) => {
    await expectPageOk(page, `/en/track/${trk}`)
    await expect(page.locator("body")).toContainText(trk, { timeout: 15_000 })
  })
  test(`track ${trk} (ar)`, async ({ page }) => {
    await expectPageOk(page, `/ar/track/${trk}`)
    await expect(page.locator("body")).toContainText(trk, { timeout: 15_000 })
  })
}

test("track: unknown number does not 500", async ({ page }) => {
  const res = await page.goto("/en/track/UNKNOWN-999", {
    waitUntil: "domcontentloaded",
  })
  expect(res?.status() ?? 200).toBeLessThan(500)
  const bodyText = (await page.locator("body").innerText().catch(() => "")) || ""
  expect(/Application error|Server Error/i.test(bodyText)).toBe(false)
})
