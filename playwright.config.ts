import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PORT || 3000)
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`
const CI = !!process.env.CI

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tmp/playwright-output",
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 2 : 1,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "tmp/playwright-report", open: "never" }],
    ["json", { outputFile: "tmp/playwright-results.json" }],
  ],
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    locale: "en-US",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /public\/.*\.spec\.ts/,
    },
    {
      name: "auth-flows",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /auth\/.*\.spec\.ts/,
    },
    {
      name: "platform-en",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
        locale: "en-US",
      },
      testMatch: /platform\/.*\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "platform-ar",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
        locale: "ar-SA",
      },
      testMatch: /platform\/.*\.spec\.ts/,
      dependencies: ["setup"],
      grep: /@i18n|@smoke/,
    },
    {
      name: "responsive",
      use: {
        ...devices["iPhone 13"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      testMatch: /responsive\/.*\.spec\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
      },
})
