import { test, expect } from "@playwright/test"
import { formAlert, loginWithDemo, readDemoCode } from "./login"

test.describe("demo flows", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "phone", "one width is enough for the flow")
  })

  test("join shows a demo code, rejects a wrong code, and accepts the right one", async ({ page }) => {
    await page.goto("/portal/join")
    await expect(page.getByRole("heading", { name: "Join MS Workforce" })).toBeVisible()
    await expect(page.getByText("Takes about 2 minutes.")).toBeVisible()
    await page.getByLabel("Full name").fill("Ava Nguyen")
    await page.getByLabel("Mobile").fill("0499 200 001")
    await page.getByLabel("Email", { exact: true }).fill("msworkforce.ops+worker1@mail.grokbot.com")
    await page.getByLabel("Confirm email").fill("msworkforce.ops+worker1@mail.grokbot.com")
    await page.getByLabel("Suburb").fill("Manly")
    await page.getByLabel("Postcode").fill("2095")
    await page.getByRole("button", { name: "General labourer" }).click()
    await page.getByRole("checkbox", { name: /privacy/i }).check()
    await page.getByRole("button", { name: "Send code" }).click()
    const code = await readDemoCode(page)
    await page.getByLabel("6-digit code").fill("000000")
    await page.getByRole("button", { name: "Check code" }).click()
    await expect(formAlert(page)).toContainText(/not right/i)
    await expect(page.getByRole("button", { name: /Send again/ })).toBeVisible()
    await page.getByLabel("6-digit code").fill(code)
    await page.getByRole("button", { name: "Check code" }).click()
    await page.waitForURL((url) => !url.pathname.endsWith("/join"))
  })

  test("login rejects a wrong code and accepts the demo code", async ({ page }) => {
    await page.goto("/portal/login")
    await page.getByRole("button", { name: /Sam Lee/ }).click()
    await page.getByRole("button", { name: "Send code" }).click()
    const code = await readDemoCode(page)
    await page.locator("#code").fill("000000")
    await expect(formAlert(page)).toContainText(/not right/i)
    await page.locator("#code").fill(code)
    await page.waitForURL("**/portal")
  })

  test("book labour rejects an end date before the start and accepts a typed role", async ({ page }) => {
    await page.goto("/portal/book-labour")
    await page.getByLabel("Company name").fill("Client One Build")
    await page.getByLabel("Your name").fill("Client Contact")
    await page.getByLabel("Phone").fill("0299991111")
    await page.getByLabel("Email").fill("msworkforce.ops+client1@mail.grokbot.com")
    await page.getByLabel("Site address").fill("12 Harbour Street")
    await page.getByLabel("Suburb").fill("Manly")
    await page.locator("#roles").fill("2 general labourers for a strip-out")
    await page.getByLabel("How many workers?").fill("2")
    await page.locator("#start-date").fill("2026-12-10")
    await page.locator("#end-date").fill("2026-12-01")
    await page.getByLabel("Shift and start time").fill("Day shift, 7:00 am")
    await page.waitForTimeout(3200)
    await page.getByRole("button", { name: "Send request" }).click()
    await expect(formAlert(page)).toContainText(/end date/i)
    await page.locator("#end-date").fill("2026-12-12")
    await page.getByRole("button", { name: "Send request" }).click()
    await expect(page.getByText(/we've got your request/i)).toBeVisible()
  })

  test.describe("signed in as Sam", () => {
    test.use({ storageState: "e2e/.auth/worker.json" })

  test("timesheet confirm, sign, clear and edit hours", async ({ page }) => {
    await page.goto("/portal/timesheet")
    await page.locator("#work-done").fill("Carried materials")
    await page.getByRole("button", { name: "No", exact: true }).click()
    await page.getByRole("button", { name: "Confirm hours" }).click()
    await expect(page.getByTestId("signature-section")).toBeVisible()
    await page.locator("#sup-name").fill("Pat Riley")
    await page.locator("#sup-email").fill("msworkforce.ops+client2@mail.grokbot.com")
    await page.getByRole("checkbox", { name: /checked these hours/i }).check()
    const pad = page.getByLabel("Signature")
    await pad.scrollIntoViewIfNeeded()
    const box = await pad.boundingBox()
    if (!box) throw new Error("signature pad")
    await page.mouse.move(box.x + 30, box.y + 40)
    await page.mouse.down()
    await page.mouse.move(box.x + 160, box.y + 90)
    await page.mouse.up()
    await page.getByRole("button", { name: "Clear" }).click()
    await page.getByRole("button", { name: "Confirm signature" }).click()
    await expect(formAlert(page)).toContainText(/sign/i)
    await page.mouse.move(box.x + 40, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 180, box.y + 100)
    await page.mouse.up()
    await page.getByRole("button", { name: "Confirm signature" }).click()
    await expect(page.getByTestId("signature-locked")).toBeVisible()
    await page.getByRole("button", { name: "Edit hours" }).click()
    await expect(page.getByRole("button", { name: "Confirm hours" })).toBeVisible()
    await expect(page.getByTestId("signature-section")).toHaveCount(0)
    await expect(page.getByTestId("submit-timesheet")).toBeDisabled()
  })

  test("ticket photo upload accepts a png and a heic and rejects a gif and a huge file", async ({ page }) => {
    await page.goto("/portal/tickets")
    await page.getByRole("button", { name: /Work at heights/ }).click()
    const front = page.locator("#photo-front-work-at-heights")
    await front.setInputFiles({ name: "card.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a", "ascii") })
    await expect(formAlert(page)).toContainText(/JPG, PNG or HEIC/)
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    )
    await front.setInputFiles({ name: "card.png", mimeType: "image/png", buffer: png })
    await expect(page.getByText("Front saved")).toBeVisible()
    const heic = Buffer.alloc(32, 0)
    heic.write("ftypheic", 4, "ascii")
    await Promise.all([
      page.waitForResponse((res) => res.request().method() === "POST"),
      front.setInputFiles({ name: "card.heic", mimeType: "image/heic", buffer: heic }),
    ])
    await expect(formAlert(page)).toHaveCount(0)
    const big = Buffer.alloc(8 * 1024 * 1024 + 16)
    big.write("ftypheic", 4, "ascii")
    await page.locator("#photo-back-work-at-heights").setInputFiles({
      name: "big.heic",
      mimeType: "image/heic",
      buffer: big,
    })
    await expect(formAlert(page)).toContainText(/8 MB/)
  })
  })

  test("admin login rejects a bad authenticator code", async ({ page }) => {
    await loginWithDemo(page, /Marek/)
    await page.waitForURL("**/portal/login/admin")
    await page.locator("#admin-code").fill("000000")
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(formAlert(page)).toContainText(/not right/i)
    await page.locator("#admin-code").fill(await readDemoCode(page))
    await page.getByRole("button", { name: "Continue" }).click()
    await page.waitForURL("**/portal/admin")
  })

  test("blank required fields stay on the form", async ({ page }) => {
    await page.goto("/portal/join")
    const name = page.getByLabel("Full name")
    await page.getByRole("button", { name: "Send code" }).click()
    await expect(name).toBeVisible()
    expect(await name.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true)
  })
})
