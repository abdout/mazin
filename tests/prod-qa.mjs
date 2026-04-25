// Production QA test runner for Mazin (abdoutgroup.com)
// Runs from mazin project - uses local playwright installation

import { chromium } from "playwright"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE_URL || "https://www.abdoutgroup.com"
const OUT = path.join(__dirname, "..", "tmp", "qa-artifacts")
await fs.mkdir(OUT, { recursive: true })

const results = {
  passed: [],
  failed: [],
  bugs: [],
  screenshots: [],
  consoleErrors: [],
  networkErrors: [],
}

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
}

const testAccounts = [
  { email: "mazin@abdout.org", password: "1234" },
  { email: "sami@abdout.org", password: "1234" },
  { email: "admin@mazin.sd", password: "admin123" },
]

async function screenshot(page, name) {
  const p = path.join(OUT, `${name}.png`)
  try {
    await page.screenshot({ path: p, fullPage: false, timeout: 5000 })
    results.screenshots.push(p)
  } catch (e) {
    log(`screenshot failed for ${name}: ${e.message}`)
  }
}

function setupErrorCapture(page, testName) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text()
      if (
        !text.includes("favicon") &&
        !text.includes("the server responded with a status of 404") &&
        !text.includes("ERR_BLOCKED_BY_CLIENT")
      ) {
        results.consoleErrors.push({ test: testName, text })
      }
    }
  })
  page.on("pageerror", (err) => {
    results.consoleErrors.push({ test: testName, text: `pageerror: ${err.message}` })
  })
  page.on("response", (resp) => {
    if (resp.status() >= 500) {
      results.networkErrors.push({ test: testName, url: resp.url(), status: resp.status() })
    }
  })
}

async function waitForHydration(page) {
  // Wait for React to hydrate - react-hook-form needs JS to run
  await page.waitForFunction(
    () => {
      // Check that React has hydrated by looking for attached event listeners
      // on forms (heuristic: form elements with react-managed inputs)
      const forms = document.querySelectorAll("form")
      if (forms.length === 0) return true
      // Also wait for any button that's disabled by default to become enabled (fonts loaded)
      return document.readyState === "complete"
    },
    { timeout: 10000 }
  ).catch(() => {})
  // Extra buffer for React hydration
  await page.waitForTimeout(2000)
}

async function tryLogin(ctx, account) {
  const page = await ctx.newPage()
  setupErrorCapture(page, `login-${account.email}`)
  try {
    const resp = await page.goto(`${BASE}/en/login`, { waitUntil: "domcontentloaded", timeout: 30000 })
    log(`  GET /en/login -> ${resp.status()}`)
    if (resp.status() === 429) {
      await page.close()
      return { ok: false, reason: "rate-limited" }
    }
    await waitForHydration(page)
    await screenshot(page, `login-page-${account.email}`)

    const emailInput = page.locator('input[name="email"], input[type="email"]').first()
    const pwInput = page.locator('input[name="password"], input[type="password"]').first()

    if (!(await emailInput.isVisible().catch(() => false))) {
      await page.close()
      return { ok: false, reason: "email-input-not-visible" }
    }

    await emailInput.fill(account.email)
    await pwInput.fill(account.password)

    // Use Enter key on password field to submit - more reliable than button click
    // because it goes through form native submission path
    // After hydration, react-hook-form's onSubmit handler fires
    await pwInput.press("Enter")

    // Wait for either navigation or error
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(3000)

    const url = page.url()
    log(`  after login -> ${url}`)
    await screenshot(page, `after-login-${account.email}`)

    // Check if credentials leaked to URL (bug indicator)
    if (url.includes("password=") || url.includes("email=")) {
      await page.close()
      return { ok: false, reason: "credentials-leaked-to-url", url }
    }

    if (url.includes("/dashboard") || url.includes("/project")) {
      return { ok: true, page, context: ctx }
    }

    if (url.includes("/login")) {
      const errorText = await page.locator("body").innerText().catch(() => "")
      const lower = errorText.toLowerCase()
      if (lower.includes("invalid") || lower.includes("incorrect") || lower.includes("credentials")) {
        await page.close()
        return { ok: false, reason: "invalid-credentials", bodyText: errorText.slice(0, 500) }
      }
      await page.close()
      return { ok: false, reason: "still-on-login", bodyText: errorText.slice(0, 500) }
    }

    // Something else - might be onboarding or dashboard
    return { ok: true, page, context: ctx }
  } catch (e) {
    await page.close().catch(() => {})
    return { ok: false, reason: e.message }
  }
}

async function run() {
  log(`Starting QA against ${BASE}`)
  const browser = await chromium.launch({ headless: true })

  // ===== Test 1: Landing pages (EN/AR) =====
  for (const [lang, label] of [["en", "EN/LTR"], ["ar", "AR/RTL"]]) {
    log(`Test 1.${lang}: Landing page ${label}`)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    setupErrorCapture(page, `landing-${lang}`)
    try {
      const resp = await page.goto(`${BASE}/${lang}`, { waitUntil: "domcontentloaded", timeout: 30000 })
      await waitForHydration(page)
      log(`  status: ${resp.status()}`)
      await screenshot(page, `01-landing-${lang}`)
      const dir = await page.evaluate(() => document.documentElement.dir)
      const pageLang = await page.evaluate(() => document.documentElement.lang)
      log(`  dir=${dir}, lang=${pageLang}`)
      if (resp.status() >= 400) {
        results.bugs.push({ test: `landing-${lang}`, bug: `HTTP ${resp.status()}` })
      } else {
        const expectedDir = lang === "ar" ? "rtl" : "ltr"
        if (dir !== expectedDir) {
          results.bugs.push({ test: `landing-${lang}`, bug: `expected dir=${expectedDir}, got ${dir}` })
        }
        if (pageLang !== lang) {
          results.bugs.push({ test: `landing-${lang}`, bug: `expected lang=${lang}, got ${pageLang}` })
        }
        results.passed.push(`landing-${lang}`)
      }
    } catch (e) {
      results.failed.push({ test: `landing-${lang}`, err: e.message })
    }
    await ctx.close()
  }

  // ===== Test 2: Marketing pages =====
  const marketingPaths = ["/en/about", "/en/services", "/en/service", "/en/contact"]
  for (const p of marketingPaths) {
    log(`Test 2: ${p}`)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    setupErrorCapture(page, p)
    try {
      const resp = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 20000 })
      log(`  ${p} -> ${resp.status()}`)
      await screenshot(page, `02-${p.replaceAll("/", "_")}`)
      if (resp.status() >= 400) {
        results.bugs.push({ test: p, bug: `HTTP ${resp.status()}` })
      } else {
        results.passed.push(p)
      }
    } catch (e) {
      results.failed.push({ test: p, err: e.message })
    }
    await ctx.close()
  }

  // ===== Test 3: Public tracking page =====
  log(`Test 3: /en/track/TEST123`)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    setupErrorCapture(page, "track")
    try {
      const resp = await page.goto(`${BASE}/en/track/TEST123`, { waitUntil: "domcontentloaded", timeout: 20000 })
      log(`  /en/track/TEST123 -> ${resp.status()}`)
      await screenshot(page, "03-track")
      if (resp.status() >= 500) {
        results.bugs.push({ test: "track", bug: `HTTP ${resp.status()}` })
      } else {
        results.passed.push("track-public")
      }
    } catch (e) {
      results.failed.push({ test: "track", err: e.message })
    }
    await ctx.close()
  }

  // ===== Test 4: Login =====
  log(`Test 4: Login`)
  let loggedInCtx = null
  let loggedInPage = null
  for (const acct of testAccounts) {
    if (loggedInCtx) break
    log(`  trying ${acct.email}...`)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const result = await tryLogin(ctx, acct)
    if (result.ok) {
      log(`  ✓ logged in as ${acct.email}`)
      results.passed.push(`login-${acct.email}`)
      loggedInCtx = ctx
      loggedInPage = result.page
    } else {
      log(`  ✗ ${acct.email}: ${result.reason}`)
      results.failed.push({ test: `login-${acct.email}`, err: result.reason, bodyText: result.bodyText })
      if (result.reason === "credentials-leaked-to-url") {
        results.bugs.push({ test: `login-${acct.email}`, bug: `SECURITY: credentials leaked to URL query. URL: ${result.url}` })
      }
      if (result.reason === "rate-limited") {
        results.bugs.push({ test: `login-${acct.email}`, bug: `rate limiter 429 on /en/login visit (not POST)` })
      }
      await ctx.close()
      // Wait between login attempts to avoid rate limits
      await new Promise((r) => setTimeout(r, 5000))
    }
  }

  // ===== Test 5: Authenticated routes =====
  if (loggedInCtx) {
    log(`Test 5: Protected pages`)
    const protectedPaths = [
      "/en/dashboard",
      "/en/project",
      "/en/project/new",
      "/en/invoice",
      "/en/invoice/new",
      "/en/customer",
      "/en/task",
      "/en/team",
      "/en/finance/dashboard",
      "/en/finance/fees",
      "/en/finance/expenses",
      "/en/finance/reports",
      "/en/finance/wallet",
      "/en/finance/accounts",
      "/en/finance/banking/my-banks",
      "/en/customs",
      "/en/marketplace",
      "/en/settings",
      "/en/settings/notifications",
    ]
    for (const p of protectedPaths) {
      const page = await loggedInCtx.newPage()
      setupErrorCapture(page, p)
      try {
        const resp = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 25000 })
        const status = resp.status()
        log(`  ${p} -> ${status}`)
        await screenshot(page, `05-${p.replaceAll("/", "_")}`)
        if (status >= 500) {
          const body = await page.locator("body").innerText().catch(() => "")
          results.bugs.push({ test: p, bug: `HTTP ${status}. Snippet: ${body.slice(0, 300)}` })
        } else if (status >= 400) {
          results.bugs.push({ test: p, bug: `HTTP ${status}` })
        } else {
          const u = page.url()
          if (u.includes("/login")) {
            results.bugs.push({ test: p, bug: `redirected to login (session lost or middleware bug)` })
          } else {
            const bodyText = await page.locator("body").innerText().catch(() => "")
            if (/error 500|internal server error|something went wrong/i.test(bodyText)) {
              results.bugs.push({ test: p, bug: `page shows error text. Snippet: ${bodyText.slice(0, 300)}` })
            } else {
              results.passed.push(p)
            }
          }
        }
      } catch (e) {
        results.failed.push({ test: p, err: e.message })
      }
      await page.close()
    }
  } else {
    log(`✗ Could not log in - skipping authenticated tests`)
    results.bugs.push({ test: "login", bug: "BLOCKER: could not log in with any seeded account" })
  }

  // ===== Test 6: Mobile breakpoint =====
  log(`Test 6: Mobile viewport (375x812)`)
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
    const page = await ctx.newPage()
    setupErrorCapture(page, "mobile")
    try {
      await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded", timeout: 20000 })
      await screenshot(page, "06-mobile-en")
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
      if (overflow) {
        results.bugs.push({ test: "mobile-landing", bug: "horizontal overflow on landing at 375px" })
      } else {
        results.passed.push("mobile-landing")
      }
    } catch (e) {
      results.failed.push({ test: "mobile", err: e.message })
    }
    await ctx.close()
  }

  await browser.close()

  // Write report
  const summary = `
========================================
Mazin Production QA Report
========================================
Base: ${BASE}
Date: ${new Date().toISOString()}

PASSED (${results.passed.length}):
${results.passed.map((p) => `  ✓ ${p}`).join("\n")}

FAILED (${results.failed.length}):
${results.failed.map((f) => `  ✗ ${f.test}: ${f.err}${f.bodyText ? `\n    body: ${f.bodyText.slice(0, 200)}` : ""}`).join("\n")}

BUGS (${results.bugs.length}):
${results.bugs.map((b) => `  🐛 [${b.test}] ${b.bug}`).join("\n")}

NETWORK 5xx (${results.networkErrors.length}):
${results.networkErrors.slice(0, 20).map((e) => `  • [${e.test}] ${e.status} ${e.url}`).join("\n")}

CONSOLE ERRORS (${results.consoleErrors.length}):
${results.consoleErrors.slice(0, 30).map((e) => `  • [${e.test}] ${e.text.slice(0, 200)}`).join("\n")}

Screenshots: ${OUT}
========================================
`
  await fs.writeFile(path.join(OUT, "report.txt"), summary)
  console.log(summary)
}

run().catch((e) => {
  console.error("fatal:", e)
  process.exit(1)
})
