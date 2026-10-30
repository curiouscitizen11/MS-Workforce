import { readFileSync } from "fs"
import { describe, expect, it } from "vitest"
import { PLACEMENT_PROPERTIES, placementProperties } from "@/lib/portal/book-labour"
import { hidePortalChrome } from "@/lib/portal/chrome"
import { toNotionProperties } from "@/lib/portal/notion/map"
import { createNotify } from "@/lib/portal/notify"
import { processOutbox, submitBookLabour, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

const NOW = new Date("2026-10-30T01:00:00.000Z")

function harness(mode: "mock" | "live" = "mock") {
  const store = createMemoryStore({ seed: true, now: NOW })
  const notify = createNotify(store, mode, async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now: NOW, mode, notify }
  return { ctx }
}

function request(extra: Record<string, unknown> = {}) {
  return {
    company: "Harbour Build",
    name: "Alex Stone",
    phone: "02 9999 0000",
    email: "alex.stone@example.com",
    address: "12 Harbour Street",
    suburb: "Manly",
    roles: ["General labourer", "Other"],
    otherRole: "Traffic control",
    workers: 4,
    start: "2026-11-12",
    ongoing: false,
    end: "2026-11-20",
    shift: "Mon–Fri, 7:00 am start, 8-hour days",
    notes: "Parking in the side street.",
    heard: "Google",
    companyWebsite: "",
    startedAt: NOW.getTime() - 10_000,
    ...extra,
  }
}

describe("book labour", () => {
  it("hides the menu on the book labour page", () => {
    expect(hidePortalChrome("/portal/book-labour")).toBe(true)
  })

  it("checks required answers, ongoing, other role and the worker count", async () => {
    const { ctx } = harness()
    const empty = await submitBookLabour(ctx, { startedAt: NOW.getTime() - 10_000 }, "203.0.113.40")
    expect(empty.ok).toBe(false)
    if (empty.ok) return
    expect(empty.error).toBe("Enter the company name.")

    const other = await submitBookLabour(ctx, request({ otherRole: "" }), "203.0.113.40")
    expect(other.ok).toBe(false)
    if (other.ok) return
    expect(other.error).toMatch(/other role/)

    const count = await submitBookLabour(ctx, request({ workers: 51 }), "203.0.113.40")
    expect(count.ok).toBe(false)
    if (count.ok) return
    expect(count.error).toMatch(/1 to 50/)

    const ongoing = await submitBookLabour(ctx, request({ ongoing: true, end: "" }), "203.0.113.41")
    expect(ongoing.ok).toBe(true)
    const queued = (await ctx.store.outbox.all()).filter((item) => item.kind === "placements").at(-1)
    const properties = (queued?.payload as { properties: Record<string, unknown> }).properties
    expect(properties["Open ended"]).toBe(true)
    expect(properties.End).toBeUndefined()
  })

  it("drops a honeypot and stops the sixth request from one address", async () => {
    const { ctx } = harness()
    const honeypot = await submitBookLabour(ctx, request({ companyWebsite: "https://spam.example" }), "203.0.113.50")
    expect(honeypot).toEqual({ ok: true, ignored: true })
    expect(await ctx.store.outbox.all()).toEqual([])
    expect(await ctx.store.notifications.all()).toEqual([])

    const fast = await submitBookLabour(ctx, request({ startedAt: NOW.getTime() }), "203.0.113.50")
    expect(fast.ok).toBe(false)
    if (fast.ok) return
    expect(fast.error).toMatch(/wait a moment/)

    for (let n = 0; n < 5; n += 1) {
      const sent = await submitBookLabour(ctx, request(), "203.0.113.51")
      expect(sent.ok).toBe(true)
    }
    const limited = await submitBookLabour(ctx, request(), "203.0.113.51")
    expect(limited.ok).toBe(false)
    if (limited.ok) return
    expect(limited.error).toMatch(/Too many requests/)
    expect((await ctx.store.outbox.all()).filter((item) => item.kind === "placements")).toHaveLength(5)
  })

  it("queues one new placements row and alerts through the existing path", async () => {
    const { ctx } = harness()
    const sent = await submitBookLabour(ctx, request({ notes: "Please call about the bank of lifts." }), "203.0.113.60")
    expect(sent).toEqual({ ok: true })
    const queued = (await ctx.store.outbox.all()).find((item) => item.kind === "placements")
    expect(queued?.status).toBe("skipped-mock")
    const properties = (queued?.payload as { properties: Record<string, unknown> }).properties
    expect(properties).toMatchObject({
      Placement: "Harbour Build – Manly",
      Client: "Harbour Build",
      "Site contact": "Alex Stone",
      "Site phone": "02 9999 0000",
      "Site email": "alex.stone@example.com",
      "Site address": "12 Harbour Street",
      "Site suburb": "Manly",
      "Roles requested": ["General labourer", "Other"],
      "Labour request details": "Other role: Traffic control\nPlease call about the bank of lifts.",
      "Workers needed": 4,
      Start: "2026-11-12",
      "Open ended": false,
      End: "2026-11-20",
      Shift: "Mon–Fri, 7:00 am start, 8-hour days",
      "Heard about us": "Google",
      Status: "Enquiry",
      "Request source": "Website form",
    })
    expect(Object.keys(properties).sort()).toEqual([...PLACEMENT_PROPERTIES].sort())
    const typed = toNotionProperties(properties)
    expect(typed.Placement).toEqual({ title: [{ type: "text", text: { content: "Harbour Build – Manly" } }] })
    expect(typed["Site email"]).toEqual({ email: "alex.stone@example.com" })
    expect(typed["Site phone"]).toEqual({ phone_number: "02 9999 0000" })
    expect(typed.Start).toEqual({ date: { start: "2026-11-12" } })
    expect(typed.End).toEqual({ date: { start: "2026-11-20" } })
    expect(typed.Status).toEqual({ select: { name: "Enquiry" } })
    expect(typed["Request source"]).toEqual({ select: { name: "Website form" } })
    expect(typed["Heard about us"]).toEqual({ select: { name: "Google" } })
    expect(typed["Workers needed"]).toEqual({ number: 4 })
    expect(typed["Open ended"]).toEqual({ checkbox: false })
    expect(typed["Roles requested"]).toEqual({
      multi_select: [{ name: "General labourer" }, { name: "Other" }],
    })

    const notes = await ctx.store.notifications.all()
    expect(notes.some((item) => item.channel === "sms")).toBe(false)
    const email = notes.find((item) => item.channel === "email")
    expect(email?.subject).toBe("New Book labour: Harbour Build – Manly")
    expect(email?.body).toContain("02 9999 0000")
    expect(email?.body).toContain("bank of lifts")
    expect(notes.some((item) => item.channel === "whatsapp" && item.body.includes("Harbour Build"))).toBe(true)
  })

  it("keeps the page free of ticket wording and private contact details", () => {
    const text = [
      "app/portal/book-labour/page.tsx",
      "components/portal/BookLabourForm.tsx",
      "lib/portal/book-labour.ts",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n")
      .toLowerCase()
    for (const word of ["ticket", "licen", "card", "pty", "abn", "gmail", "0435"]) {
      expect(text).not.toContain(word)
    }
    expect(text).toContain("hello@msworkforce.au")
  })

  it("creates a new placements row when Notion is live", async () => {
    const { ctx } = harness("live")
    const properties = placementProperties({
      company: "Harbour Build",
      name: "Alex Stone",
      phone: "+61400111000",
      email: "alex.stone@example.com",
      address: "12 Harbour Street",
      suburb: "Manly",
      roles: ["Site clean"],
      otherRole: "",
      workers: 2,
      start: "2026-11-12",
      ongoing: true,
      end: "",
      shift: "Day shift",
      notes: "",
      heard: "",
    })
    await ctx.store.outbox.save({
      id: "out-place",
      kind: "placements",
      payload: { properties, ip: "203.0.113.70" },
      status: "pending",
      attempts: 0,
      nextAttemptAt: NOW.toISOString(),
      createdAt: NOW.toISOString(),
    })
    const urls: string[] = []
    const previous = {
      PORTAL_MODE: process.env.PORTAL_MODE,
      NOTION_TOKEN: process.env.NOTION_TOKEN,
      NOTION_PLACEMENTS_DB: process.env.NOTION_PLACEMENTS_DB,
    }
    process.env.PORTAL_MODE = "live"
    process.env.NOTION_TOKEN = "test-token"
    process.env.NOTION_PLACEMENTS_DB = "db-placements"
    try {
      await processOutbox(ctx, async (input) => {
        urls.push(String(input))
        return new Response(JSON.stringify({ id: "page-1" }), { status: 200 })
      })
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
    expect(urls.some((url) => url.includes("/query"))).toBe(false)
    expect(urls.some((url) => url.endsWith("/pages"))).toBe(true)
    expect((await ctx.store.outbox.get("out-place"))?.status).toBe("sent")
  })
})
