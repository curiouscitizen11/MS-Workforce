import { mkdirSync, writeFileSync } from "fs"
import path from "path"
import { test, expect } from "@playwright/test"
import { adminPages, publicPages, signedInPortal, signedOutPortal } from "./pages"

const root = process.env.E2E_ARTIFACTS || path.join("e2e", "output")

type Problem = { severity: "high" | "medium" | "low"; page: string; detail: string; shot: string }

async function shot(page: import("@playwright/test").Page, folder: string, name: string) {
  const dir = path.join(root, folder)
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, name + ".png")
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function audit(page: import("@playwright/test").Page, label: string, file: string): Promise<Problem[]> {
  const found: Problem[] = []
  const metrics = await page.evaluate(() => {
    const root = document.documentElement
    const small = Array.from(document.querySelectorAll("button, a, input, select, textarea"))
      .filter((node) => {
        const box = node.getBoundingClientRect()
        if (box.width < 2 || box.height < 2) return false
        if (box.right < 0 || box.bottom < 0 || box.left > window.innerWidth + 4) return false
        const style = getComputedStyle(node)
        if (style.visibility === "hidden" || style.display === "none") return false
        const type = (node.getAttribute("type") || "").toLowerCase()
        if (type === "checkbox" || type === "radio" || type === "hidden" || node.classList.contains("sr-only")) {
          const label = node.closest("label")
          const hit = label ? label.getBoundingClientRect() : box
          return hit.width < 44 || hit.height < 44
        }
        return box.width < 44 || box.height < 44
      })
      .slice(0, 8)
      .map((node) => {
        const box = node.getBoundingClientRect()
        const name = node.id ? "#" + node.id : node.getAttribute("aria-label") || node.textContent || node.tagName
        return name.trim().replace(/\s+/g, " ").slice(0, 40) + " " + Math.round(box.width) + "x" + Math.round(box.height)
      })
    const header = document.querySelector("header")
    const headerStyle = header ? getComputedStyle(header).position : ""
    return {
      overflow: root.scrollWidth - root.clientWidth,
      font: getComputedStyle(document.body).fontFamily,
      header: headerStyle,
      small,
    }
  })
  if (metrics.overflow > 2) {
    found.push({ severity: "medium", page: label, detail: "Page scrolls sideways by " + metrics.overflow + "px.", shot: file })
  }
  if (metrics.small.length) {
    found.push({
      severity: "low",
      page: label,
      detail: "Some tap targets are under 44px: " + metrics.small.join("; "),
      shot: file,
    })
  }
  if (metrics.header && metrics.header !== "fixed" && metrics.header !== "sticky") {
    found.push({ severity: "low", page: label, detail: "Header position is " + metrics.header + ".", shot: file })
  }
  if (/serif|times|comic/i.test(metrics.font) && !/apple-system|helvetica|arial|sans-serif/i.test(metrics.font)) {
    found.push({ severity: "low", page: label, detail: "Body font is " + metrics.font + ".", shot: file })
  }
  return found
}

test.describe("visual pass", () => {
  test("public and signed-out portal pages", async ({ page }, info) => {
    const problems: Problem[] = []
    const size = info.project.name
    for (const [name, route] of [...publicPages, ...signedOutPortal]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response?.status() ?? 500).toBeLessThan(500)
      const file = await shot(page, name, size)
      problems.push(...(await audit(page, route + " " + size, file)))
    }
    const out = path.join(root, "findings-" + size + "-public.json")
    mkdirSync(root, { recursive: true })
    writeFileSync(out, JSON.stringify(problems, null, 2))
  })

  test.describe("signed in", () => {
    test.use({ storageState: "e2e/.auth/worker.json" })

  test("signed-in worker pages", async ({ page }, info) => {
    const problems: Problem[] = []
    const size = info.project.name
    for (const [name, route] of signedInPortal) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response?.status() ?? 500).toBeLessThan(500)
      const file = await shot(page, "portal-" + name, size)
      problems.push(...(await audit(page, route + " " + size, file)))
    }
    const out = path.join(root, "findings-" + size + "-portal.json")
    writeFileSync(out, JSON.stringify(problems, null, 2))
  })
  })

  test.describe("admin", () => {
    test.use({ storageState: "e2e/.auth/admin.json" })

  test("admin pages", async ({ page }, info) => {
    const problems: Problem[] = []
    const size = info.project.name
    for (const [name, route] of adminPages) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response?.status() ?? 500).toBeLessThan(500)
      const file = await shot(page, name, size)
      problems.push(...(await audit(page, route + " " + size, file)))
    }
    const out = path.join(root, "findings-" + size + "-admin.json")
    writeFileSync(out, JSON.stringify(problems, null, 2))
  })
  })
})
