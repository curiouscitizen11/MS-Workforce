import { defineConfig, devices } from "@playwright/test"

const port = 4173
const baseURL = "http://localhost:" + port

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --port " + port,
    url: baseURL + "/portal/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      PORTAL_MODE: "mock",
      VERCEL_ENV: "preview",
    },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "phone",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    {
      name: "desktop",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "pixel",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Pixel 7"], defaultBrowserType: "chromium", deviceScaleFactor: 1 },
    },
    {
      name: "galaxy",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Galaxy S9+"], defaultBrowserType: "chromium", deviceScaleFactor: 1 },
    },
    {
      name: "iphone",
      dependencies: ["setup"],
      grep: /@smoke/,
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["iPhone 14"], deviceScaleFactor: 1 },
    },
    {
      name: "safari",
      dependencies: ["setup"],
      grep: /@smoke/,
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: "firefox",
      dependencies: ["setup"],
      grep: /@smoke/,
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } },
    },
  ],
})
