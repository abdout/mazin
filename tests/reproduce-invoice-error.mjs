// Log in to production, hit /en/invoice, capture HTML + digest for log correlation
import { chromium } from "playwright"
import fs from "node:fs/promises"

const BASE = "https://www.abdoutgroup.com"

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()

  // Login
  console.log("→ Login")
  await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle" })
  await page.waitForTimeout(6000) // Generous hydration buffer for React 19 SessionProvider
  await page.fill('input[name="email"]', "mazin@abdout.org")
  await page.fill('input[name="password"]', "1234")
  await page.press('input[name="password"]', "Enter")
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(3000)
  console.log(`  ${page.url()}`)

  // Hit invoice page
  console.log("\n→ GET /en/invoice")
  const startTime = new Date().toISOString()
  console.log(`  start: ${startTime}`)
  const resp = await page.goto(`${BASE}/en/invoice`, { waitUntil: "domcontentloaded" })
  console.log(`  status: ${resp.status()}`)
  await page.waitForTimeout(2000)
  const html = await page.content()
  await fs.writeFile("/tmp/mazin-qa/invoice-error.html", html)
  // Extract digest
  const digestMatch = html.match(/digest[":\s]+["']([a-f0-9-]+)["']/i)
  console.log(`  digest: ${digestMatch ? digestMatch[1] : "not found"}`)

  // Look for Next.js error page indicators in text
  const text = await page.locator("body").innerText().catch(() => "")
  console.log(`  body length: ${text.length}`)
  console.log(`  snippet: ${text.slice(0, 200)}...`)

  // Dump headers
  console.log("  headers:")
  const headers = resp.headers()
  for (const [k, v] of Object.entries(headers)) {
    if (/digest|x-vercel|x-matched|cache/i.test(k)) {
      console.log(`    ${k}: ${v}`)
    }
  }

  console.log(`  end: ${new Date().toISOString()}`)

  await browser.close()
}

run().catch((e) => {
  console.error("fatal:", e)
  process.exit(1)
})
