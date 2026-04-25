import { test, expect } from "@playwright/test"
import { expectPageOk } from "../helpers/page-checks"

test("task list loads @smoke", async ({ page }) => {
  await expectPageOk(page, "/en/task")
})

test("marketplace list loads @smoke", async ({ page }) => {
  await expectPageOk(page, "/en/marketplace")
})

test("marketplace detail loads (first service)", async ({ page }) => {
  await page.goto("/en/marketplace")
  await page.waitForTimeout(500)
  const href = await page
    .locator('a[href*="/marketplace/"]')
    .first()
    .getAttribute("href")
    .catch(() => null)
  test.skip(!href, "No seeded marketplace service")
  const res = await page.goto(href!, { waitUntil: "domcontentloaded" })
  expect(res?.status()).toBeLessThan(500)
})
