import { test, expect } from "@playwright/test"

test("join page loads and has form fields", async ({ page }) => {
  await page.goto("/en/join")
  await expect(page.getByPlaceholder(/email/i).first()).toBeVisible()
  await expect(page.getByPlaceholder(/password/i).first()).toBeVisible()
  await expect(page.getByRole("button", { name: /sign up|register|join|create/i })).toBeVisible()
})

test("reset page loads", async ({ page }) => {
  await page.goto("/en/reset")
  await expect(page.getByPlaceholder(/email/i).first()).toBeVisible()
  await expect(page.getByRole("button")).toBeVisible()
})

test("new-password without token is handled", async ({ page }) => {
  const res = await page.goto("/en/new-password", { waitUntil: "domcontentloaded" })
  expect(res?.status() ?? 200).toBeLessThan(500)
})
