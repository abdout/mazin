import { test, expect } from "@playwright/test"

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]

const routes = ["/en/dashboard", "/en/project", "/en/invoice", "/en/finance"]

for (const vp of viewports) {
  for (const route of routes) {
    test(`${vp.name} ${route} has no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(route, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(300)
      const overflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        )
      })
      expect(overflow, `horizontal overflow of ${overflow}px at ${vp.name}`).toBeLessThanOrEqual(2)
    })
  }
}
