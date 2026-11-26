import { mkdirSync } from "fs"
import path from "path"
import { test, expect } from "@playwright/test"

const shots = process.env.CROSS_BROWSER_ARTIFACTS

const signedOut = [
  ["home", "/"],
  ["book-labour", "/portal/book-labour"],
  ["login", "/portal/login"],
]

test.describe("cross-browser pages", { tag: "@smoke" }, () => {
  test("home, book labour and login stay on the screen", async ({ page }, info) => {
    for (const [name, route] of signedOut) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response?.status() ?? 500).toBeLessThan(500)
      await expectPageFits(page)
      if (route === "/") {
        const header = page.locator("header").first()
        await expect(header).toBeVisible()
        const position = await header.evaluate((node) => getComputedStyle(node).position)
        expect(["fixed", "sticky"]).toContain(position)
      }
      await saveShot(page, info.project.name, name)
    }
  })
})

test.describe("cross-browser signed-in pages", { tag: "@smoke" }, () => {
  test.use({ storageState: "e2e/.auth/worker.json" })

  test("signature pad and timesheet stay on the screen", async ({ page }, info) => {
    await page.goto("/portal/onboarding", { waitUntil: "domcontentloaded" })
    const clear = page.getByRole("button", { name: "Clear" })
    await clear.scrollIntoViewIfNeeded()
    await expect(page.getByLabel("Signature")).toBeVisible()
    await expectPageFits(page)
    await saveShot(page, info.project.name, "signature")

    await page.goto("/portal/timesheet", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { name: "Log today's hours" })).toBeVisible()
    await expectPageFits(page)
    await saveShot(page, info.project.name, "timesheet")
  })
})

async function expectPageFits(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(2)
}

async function saveShot(page: import("@playwright/test").Page, project: string, name: string) {
  if (!shots || (project !== "iphone" && project !== "firefox")) return
  const label = project === "iphone" ? "webkit-iphone" : "firefox"
  mkdirSync(shots, { recursive: true })
  await page.screenshot({ path: path.join(shots, name + "-" + label + ".png"), fullPage: false })
}
