import { test, expect } from "@playwright/test"

async function boxOf(page: import("@playwright/test").Page, locator: import("@playwright/test").Locator) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  expect(box, "missing tap target").toBeTruthy()
  return box!
}

test("desktop header links are at least 44px tall", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "the text header is the desktop bar")
  await page.goto("/")
  const links = page.getByRole("navigation", { name: "Primary" }).getByRole("link")
  const count = await links.count()
  expect(count).toBeGreaterThan(3)
  for (let index = 0; index < count; index += 1) {
    const box = await boxOf(page, links.nth(index))
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
  }
})

test("the apply link is at least 44px tall", async ({ page }, info) => {
  test.skip(info.project.name === "desktop", "checked on phone and Android")
  await page.goto("/portal/login")
  const apply = await boxOf(page, page.getByRole("link", { name: "Apply for work" }))
  expect(apply.height).toBeGreaterThanOrEqual(44)
})

test.describe("worker targets", () => {
  test.use({ storageState: "e2e/.auth/worker.json" })

  test("signature clear is at least 44px wide", async ({ page }, info) => {
    test.skip(info.project.name === "desktop", "checked on phone and Android")
    await page.goto("/portal/onboarding")
    const clear = await boxOf(page, page.getByRole("button", { name: "Clear" }))
    expect(clear.width).toBeGreaterThanOrEqual(44)
    expect(clear.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe("admin rows", () => {
  test.use({ storageState: "e2e/.auth/admin.json" })

  test("offer rows are at least 48px tall", async ({ page }, info) => {
    test.skip(info.project.name === "desktop", "checked on phone and Android")
    await page.goto("/portal/admin/offers")
    const row = page.getByRole("link", { name: /Sam Lee/ }).first()
    const box = await boxOf(page, row)
    expect(box.height).toBeGreaterThanOrEqual(48)
  })
})
