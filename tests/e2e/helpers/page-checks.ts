import { expect, Page } from "@playwright/test"

/**
 * Non-strict page load assertion: navigation succeeds, no 5xx, no
 * hard runtime error overlay, and body renders something.
 */
export async function expectPageOk(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" })
  if (response) {
    expect.soft(response.status(), `${url} returned ${response.status()}`).toBeLessThan(500)
  }
  // Wait for any non-empty main content — handles Suspense + streaming.
  await page.locator("body").waitFor({ state: "attached", timeout: 5_000 })
  await expect
    .poll(async () => (await page.locator("body").innerText().catch(() => "")).length, {
      timeout: 15_000,
    })
    .toBeGreaterThan(0)
  // Next.js error boundary text: explicit negative assertion
  const bodyText = (await page.locator("body").innerText().catch(() => "")) || ""
  const hasErrorBoundary = /Application error:|Server Error|Unhandled Runtime Error|Something went wrong/i.test(bodyText)
  expect(hasErrorBoundary, `${url} rendered an error boundary:\n${bodyText.slice(0, 200)}`).toBe(false)
}

export function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() !== "error") return
    const text = msg.text()
    if (
      text.includes("favicon") ||
      text.includes("ERR_BLOCKED_BY_CLIENT") ||
      text.includes("Download the React DevTools") ||
      text.includes("404") ||
      text.includes("Failed to load resource")
    ) {
      return
    }
    errors.push(text)
  })
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))
  return errors
}
