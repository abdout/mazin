import { test, expect } from "@playwright/test"

test("dashboard ar/en renders correct dir @i18n @smoke", async ({ page }) => {
  await page.goto("/ar/dashboard")
  const htmlAr = await page.locator("html").getAttribute("dir")
  expect(htmlAr).toBe("rtl")

  await page.goto("/en/dashboard")
  const htmlEn = await page.locator("html").getAttribute("dir")
  expect(htmlEn === "ltr" || htmlEn === null).toBeTruthy()
})

test("switching locale preserves auth @i18n", async ({ page }) => {
  await page.goto("/en/dashboard")
  await expect(page).toHaveURL(/\/en\/dashboard/)
  await page.goto("/ar/dashboard")
  // Should stay on dashboard, not bounce to /login
  await expect(page).toHaveURL(/\/ar\/dashboard/)
})
