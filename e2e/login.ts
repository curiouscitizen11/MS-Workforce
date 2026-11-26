import { expect, type Page } from "@playwright/test"

export function formAlert(page: Page) {
  return page.locator("p[role='alert']")
}

export async function readDemoCode(page: Page) {
  const banner = page.getByText(/Demo code \d{6}/).last()
  await expect(banner).toBeVisible()
  const code = ((await banner.innerText()).match(/\d{6}/) || [""])[0]
  expect(code).toHaveLength(6)
  return code
}

export async function loginWithDemo(page: Page, who: RegExp) {
  await page.goto("/portal/login")
  await page.getByRole("button", { name: who }).click()
  await page.getByRole("button", { name: "Send code" }).click()
  const code = await readDemoCode(page)
  await page.locator("#code").fill(code)
}
