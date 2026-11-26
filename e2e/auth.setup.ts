import { test } from "@playwright/test"
import { mkdirSync } from "fs"
import path from "path"
import { loginWithDemo, readDemoCode } from "./login"

const dir = "e2e/.auth"

test("sign in as the demo worker once", async ({ page }) => {
  mkdirSync(dir, { recursive: true })
  await loginWithDemo(page, /Sam Lee/)
  await page.waitForURL("**/portal")
  await page.context().storageState({ path: path.join(dir, "worker.json") })
})

test("sign in as the demo admin once", async ({ page }) => {
  mkdirSync(dir, { recursive: true })
  await loginWithDemo(page, /Marek/)
  await page.waitForURL("**/portal/login/admin")
  await page.context().storageState({ path: path.join(dir, "admin-pending.json") })
  const shots = process.env.E2E_ARTIFACTS
  if (shots) {
    const folder = path.join(shots, "admin-code")
    mkdirSync(folder, { recursive: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(folder, "phone.png"), fullPage: true })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.screenshot({ path: path.join(folder, "desktop.png"), fullPage: true })
  }
  await page.locator("#admin-code").fill(await readDemoCode(page))
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/portal/admin")
  await page.context().storageState({ path: path.join(dir, "admin.json") })
})
