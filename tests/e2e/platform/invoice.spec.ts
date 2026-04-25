import { test, expect } from "@playwright/test"
import { expectPageOk, collectConsoleErrors } from "../helpers/page-checks"

test("invoice list loads @smoke", async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await expectPageOk(page, "/en/invoice")
  const hard = errors.filter((e) => !/hydrat|Warning:/i.test(e))
  expect(hard).toEqual([])
})

test("invoice/new loads", async ({ page }) => {
  await expectPageOk(page, "/en/invoice/new")
})

test("invoice/settings loads", async ({ page }) => {
  await expectPageOk(page, "/en/invoice/settings")
})

test("invoice/templates loads", async ({ page }) => {
  await expectPageOk(page, "/en/invoice/templates")
})

test("invoice detail page loads (first from seed)", async ({ page }) => {
  await page.goto("/en/invoice")
  await page.waitForTimeout(500)
  const href = await page
    .locator('a[href*="/invoice/"]')
    .filter({ hasNot: page.locator('a[href*="/invoice/new"], a[href*="/invoice/settings"], a[href*="/invoice/templates"]') })
    .first()
    .getAttribute("href")
    .catch(() => null)
  test.skip(!href, "No seeded invoices visible in list")
  const res = await page.goto(href!, { waitUntil: "domcontentloaded" })
  expect(res?.status()).toBeLessThan(500)
})
