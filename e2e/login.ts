import { expect, type Page } from "@playwright/test"

export function flowSlot(project: string) {
  if (project === "pixel") return 2
  if (project === "galaxy") return 3
  if (project === "iphone") return 4
  if (project === "safari") return 5
  if (project === "firefox") return 6
  return 1
}

/** Five different bookings fit the hourly limit. A sixth repeats the first and still shows the thank-you. */
export function bookingSlot(project: string) {
  const slot = flowSlot(project)
  return slot > 5 ? 1 : slot
}

export function flowEmail(project: string) {
  return "msworkforce.ops+worker" + flowSlot(project) + "@mail.grokbot.com"
}

export function flowMobile(project: string) {
  return "0499 200 00" + flowSlot(project)
}

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
