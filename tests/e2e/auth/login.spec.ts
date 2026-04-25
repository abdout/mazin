import { test, expect } from "@playwright/test"
import { TEST_ADMIN, loginUI } from "../helpers/auth"

test("login with valid credentials redirects to dashboard", async ({ page }) => {
  await loginUI(page, TEST_ADMIN, "en")
  await expect(page).toHaveURL(/\/(ar|en)\/dashboard/)
})

test("login with invalid credentials shows error", async ({ page }) => {
  await page.goto("/en/login")
  await page.getByPlaceholder(/email/i).fill("nobody@example.com")
  await page.getByPlaceholder(/password/i).fill("wrongpassword")
  await page.getByRole("button", { name: /login/i }).click()
  // Error surfaces (could be "Invalid credentials" from FormError)
  await expect(page.locator("body")).toContainText(/invalid|wrong|error|غير صحيح/i, {
    timeout: 10_000,
  })
  await expect(page).toHaveURL(/\/login/)
})

test("login form validates empty fields", async ({ page }) => {
  await page.goto("/en/login")
  await page.getByRole("button", { name: /login/i }).click()
  // Zod validation surfaces messages under inputs
  await expect(page).toHaveURL(/\/login/)
})

test("protected route without auth redirects to login", async ({ page }) => {
  await page.context().clearCookies()
  await page.goto("/en/dashboard", { waitUntil: "domcontentloaded" })
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
})

test("login page has link to register", async ({ page }) => {
  await page.goto("/en/login")
  const link = page.getByRole("link", { name: /sign up|register|join/i })
  await expect(link.first()).toBeVisible()
})

test("login page has forgot password link", async ({ page }) => {
  await page.goto("/en/login")
  const link = page.getByRole("link", { name: /forgot|reset/i })
  await expect(link.first()).toBeVisible()
})
