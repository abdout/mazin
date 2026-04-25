import { test as setup, expect } from "@playwright/test"
import path from "node:path"
import { TEST_ADMIN, loginAPI } from "./helpers/auth"

const adminAuthFile = path.join(__dirname, ".auth/admin.json")

setup("authenticate admin", async ({ page }) => {
  await loginAPI(page, TEST_ADMIN)
  // Verify the session is real by visiting a protected page.
  await page.goto("/en/dashboard")
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
  await page.context().storageState({ path: adminAuthFile })
})
