import { test, expect } from "@playwright/test"
import { expectPageOk, collectConsoleErrors } from "../helpers/page-checks"

const coreRoutes = [
  "/en/dashboard",
  "/en/customer",
  "/en/customs",
  "/en/team",
  "/en/settings",
  "/en/settings/notifications",
]

for (const route of coreRoutes) {
  test(`core: ${route} @smoke`, async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await expectPageOk(page, route)
    // Filter noise
    const hard = errors.filter(
      (e) =>
        !/hydrat|ResizeObserver|Warning:|act\(\)/i.test(e) &&
        !e.includes("chrome-error://"),
    )
    expect(hard, `console errors on ${route}:\n${hard.join("\n")}`).toEqual([])
  })
}

test("dashboard: has main navigation @i18n", async ({ page }) => {
  await page.goto("/en/dashboard")
  // Sidebar / nav shows at least one link to a platform page
  const links = page.getByRole("link")
  await expect(links.first()).toBeVisible({ timeout: 10_000 })
})
