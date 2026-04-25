import { expect, Page } from "@playwright/test"

export const TEST_ADMIN = {
  email: "mazin@abdout.org",
  password: "1234",
}

export const TEST_MANAGER = {
  email: "sami@abdout.org",
  password: "1234",
}

export async function loginUI(
  page: Page,
  user = TEST_ADMIN,
  lang: "ar" | "en" = "en",
) {
  await page.goto(`/${lang}/login`)
  // Wait for hydration before interacting — the login form has a pre-hydration
  // `action="#"` fallback that would swallow our click otherwise.
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.getByPlaceholder(/email|البريد/i).fill(user.email)
  await page.getByPlaceholder(/password|كلمة المرور/i).fill(user.password)
  await Promise.all([
    page.waitForURL(/\/(ar|en)\/(dashboard|login)/, { timeout: 20_000 }).catch(() => {}),
    page.getByRole("button", { name: /login|تسجيل الدخول|دخول/i }).click(),
  ])
  // Give the session cookie time to land before asserting
  await page.waitForTimeout(500)
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 })
}

/**
 * Programmatic login via the NextAuth credentials callback. Faster and more
 * reliable than the UI flow — use for storageState setup.
 */
export async function loginAPI(
  page: Page,
  user = TEST_ADMIN,
) {
  const csrfRes = await page.request.get("/api/auth/csrf")
  const { csrfToken } = await csrfRes.json()
  await page.request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email: user.email,
      password: user.password,
      redirect: "false",
      json: "true",
    },
    headers: { "content-type": "application/x-www-form-urlencoded" },
  })
}

export async function logout(page: Page) {
  await page.context().clearCookies()
}
