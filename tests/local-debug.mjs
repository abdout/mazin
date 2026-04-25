// Local debugging script - logs in against local dev and hits problem pages
// to surface the actual server error messages (dev mode shows full errors)

import { chromium } from "playwright"

const BASE = process.env.BASE_URL || "http://localhost:3001"

async function run() {
  console.log(`Using base: ${BASE}`)
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  const serverLogs = []
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`  [browser ${msg.type()}]`, msg.text())
    }
  })
  page.on("pageerror", (err) => console.log("  [pageerror]", err.message))
  page.on("response", async (resp) => {
    if (resp.status() >= 400) {
      console.log(`  [${resp.status()}] ${resp.request().method()} ${resp.url()}`)
    }
  })

  // Login
  console.log("\n→ Login flow")
  await page.goto(`${BASE}/en/login`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000) // Wait for hydration
  await page.fill('input[name="email"]', "mazin@abdout.org")
  await page.fill('input[name="password"]', "1234")
  await page.press('input[name="password"]', "Enter")
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(2000)
  console.log(`  URL after login: ${page.url()}`)

  if (page.url().includes("/login")) {
    console.log("  ✗ Login failed")
    await browser.close()
    return
  }

  // Test problem pages
  const paths = [
    "/en/invoice",
    "/en/invoice/new",
    "/en/track/TEST123",
    "/en/dashboard",
    "/en/project",
    "/en/finance/dashboard",
  ]

  for (const p of paths) {
    console.log(`\n→ ${p}`)
    const resp = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 30000 }).catch((e) => {
      console.log(`  goto error: ${e.message}`)
      return null
    })
    if (!resp) continue
    console.log(`  HTTP ${resp.status()}`)
    await page.waitForTimeout(2000)
    const bodyText = await page.locator("body").innerText().catch(() => "")
    // Look for error indicators
    if (/something went wrong|unexpected error occurred|server error|error 500/i.test(bodyText)) {
      console.log(`  ⚠ Error boundary shown`)
      // Try to get the actual error from Next.js dev overlay
      const nextError = await page.locator('[data-nextjs-dialog], [data-nextjs-error]').innerText().catch(() => "")
      if (nextError) console.log(`  Next.js error: ${nextError.slice(0, 500)}`)
    }
  }

  await browser.close()
}

run().catch((e) => {
  console.error("fatal:", e)
  process.exit(1)
})
