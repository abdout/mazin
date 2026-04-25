import { test, expect } from "@playwright/test"
import { expectPageOk, collectConsoleErrors } from "../helpers/page-checks"

const publicRoutes = [
  "/",
  "/en",
  "/ar",
  "/en/about",
  "/ar/about",
  "/en/services",
  "/ar/services",
]

for (const route of publicRoutes) {
  test(`public: ${route} loads @smoke`, async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await expectPageOk(page, route)
    expect(errors, `console errors on ${route}:\n${errors.join("\n")}`).toEqual([])
  })
}

test("public: / redirects to default locale", async ({ page }) => {
  const res = await page.goto("/", { waitUntil: "domcontentloaded" })
  expect(res?.status()).toBeLessThan(500)
  await expect(page).toHaveURL(/\/(ar|en)/)
})

test("public: unknown route does not 500", async ({ page }) => {
  const res = await page.goto("/en/this-route-does-not-exist", {
    waitUntil: "domcontentloaded",
  })
  const status = res?.status() ?? 200
  expect(status, `unknown route returned ${status}`).toBeLessThan(500)
  // Middleware may redirect to /login for unauth users, or app may render 404.
  // Both are acceptable; a 500 is not.
  const bodyText = (await page.locator("body").innerText()) || ""
  expect(/Application error|Server Error/i.test(bodyText)).toBe(false)
})
