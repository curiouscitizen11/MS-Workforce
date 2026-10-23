import { describe, expect, it } from "vitest"
import {
  assertNotionPayloadSafe,
  timesheetNotionProperties,
  toNotionProperties,
  unknownNotionProperty,
  withoutUnknownNotionProperty,
  workerNotionProperties,
  writeNotionProperties,
} from "@/lib/portal/notion/map"
import { processOutbox, type Ctx } from "@/lib/portal/services"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"
import type { Timesheet } from "@/lib/portal/types"

const sheet: Timesheet = {
  id: "ts-1",
  workerId: "w-sam",
  offerId: "offer-1",
  placementRef: "PL-1",
  workerName: "Sam Lee",
  workDate: "2026-10-17",
  start: "07:00",
  finish: "15:30",
  breakMinutes: 30,
  breakStart: "12:15",
  totalHours: 8,
  tasks: "Stripped ceiling sheets in unit 4",
  incident: false,
  status: "Submitted",
  supervisorName: "Alex Stone",
  supervisorEmail: "alex.stone@example.com",
  supervisorRole: "Site supervisor",
  corrected: false,
  signerMismatch: false,
  source: "Portal",
}

function harness() {
  const now = new Date("2026-10-17T01:00:00.000Z")
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "live", notify }
  return { ctx, now }
}

async function withLiveNotion(run: () => Promise<void>) {
  const previous = {
    PORTAL_MODE: process.env.PORTAL_MODE,
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    NOTION_TIMESHEETS_DB: process.env.NOTION_TIMESHEETS_DB,
  }
  process.env.PORTAL_MODE = "live"
  process.env.NOTION_TOKEN = "test-token"
  process.env.NOTION_TIMESHEETS_DB = "db-timesheets"
  try {
    await run()
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}

describe("Notion fields Elon still needs to add", () => {
  it("maps break start, supervisor details, the driver card number and issue dates", async () => {
    const props = timesheetNotionProperties(sheet)
    expect(props["Break start"]).toBe("12:15")
    expect(props["Supervisor name"]).toBe("Alex Stone")
    expect(props["Supervisor email"]).toBe("alex.stone@example.com")
    expect(props["Approved by"]).toBe("Alex Stone")
    expect(props.Tasks).toBe("Stripped ceiling sheets in unit 4")
    const typed = toNotionProperties(props)
    expect(typed["Break start"]).toEqual({ rich_text: [{ type: "text", text: { content: "12:15" } }] })
    expect(typed["Supervisor name"]).toEqual({ rich_text: [{ type: "text", text: { content: "Alex Stone" } }] })
    expect(typed["Supervisor email"]).toEqual({ email: "alex.stone@example.com" })
    expect(typed.Tasks).toEqual({ rich_text: [{ type: "text", text: { content: "Stripped ceiling sheets in unit 4" } }] })

    const { ctx } = harness()
    const worker = await ctx.store.workers.get("w-sam")
    if (!worker) throw new Error("missing worker")
    worker.tickets.driverLicence.cardNumber = "DLCARD1"
    worker.tickets.driverLicence.issued = "2020-02-02"
    worker.tickets.whiteCard.issued = "2019-01-01"
    worker.tickets.heights.issued = "2021-03-03"
    const workerProps = workerNotionProperties(worker)
    expect(workerProps["Driver card number"]).toBe("DLCARD1")
    expect(workerProps["Driver licence issued"]).toBe("2020-02-02")
    expect(workerProps["White card issued"]).toBe("2019-01-01")
    expect(workerProps["Work at heights issued"]).toBe("2021-03-03")
    const workerTyped = toNotionProperties(workerProps)
    expect(workerTyped["Driver card number"]).toEqual({ rich_text: [{ type: "text", text: { content: "DLCARD1" } }] })
    expect(workerTyped["Driver licence issued"]).toEqual({ date: { start: "2020-02-02" } })
    expect(workerTyped["White card issued"]).toEqual({ date: { start: "2019-01-01" } })
    expect(JSON.stringify(workerProps)).not.toContain("HT-22")
    expect(JSON.stringify(workerProps).toLowerCase()).not.toMatch(/passport|tfn|tax file|\bbank\b|superannuation/)
    expect(() => assertNotionPayloadSafe({ "Supervisor name": "Alex Stone" })).not.toThrow()
    expect(() => assertNotionPayloadSafe({ "Super fund": "hidden" })).toThrow(/private field/)
    expect(() => assertNotionPayloadSafe({ Superannuation: "hidden" })).toThrow(/private field/)
  })

  it("skips a column Notion does not have yet, and keeps a type error", async () => {
    expect(unknownNotionProperty("Break start is not a property that exists.")).toBe("Break start")
    expect(unknownNotionProperty("Tasks is expected to be multi_select.")).toBeNull()
    const dropped = withoutUnknownNotionProperty(
      { "Break start": { rich_text: [] }, Tasks: { rich_text: [] } },
      "Break start is not a property that exists.",
    )
    expect(dropped && "Break start" in dropped).toBe(false)
    expect(withoutUnknownNotionProperty({ Tasks: { rich_text: [] } }, "Tasks is expected to be multi_select.")).toBeNull()

    const sent: string[][] = []
    const ok = await writeNotionProperties({ "Break start": 1, "Supervisor email": 2, Tasks: 3 }, async (properties) => {
      sent.push(Object.keys(properties))
      if ("Break start" in properties) return { ok: false, message: "Break start is not a property that exists." }
      if ("Supervisor email" in properties) return { ok: false, message: "Supervisor email is not a property that exists." }
      return { ok: true }
    })
    expect(ok).toEqual({ ok: true })
    expect(sent.at(-1)).toEqual(["Tasks"])

    const rejected = await writeNotionProperties({ Tasks: 3 }, async () => ({
      ok: false,
      message: "Tasks is expected to be multi_select.",
    }))
    expect(rejected.ok).toBe(false)
    if (!rejected.ok) expect(rejected.message).toMatch(/multi_select/)
  })

  it("still syncs a timesheet when Notion is missing the new columns", async () => {
    const { ctx, now } = harness()
    await ctx.store.outbox.save({
      id: "out-missing",
      kind: "timesheets",
      payload: {
        Entry: "Sam Lee – 2026-10-17",
        "Break start": "12:15",
        "Supervisor email": "alex.stone@example.com",
        Tasks: "Stripped ceiling sheets in unit 4",
      },
      status: "pending",
      attempts: 0,
      nextAttemptAt: now.toISOString(),
      createdAt: now.toISOString(),
    })
    const bodies: string[] = []
    await withLiveNotion(async () => {
      await processOutbox(ctx, async (input, init) => {
        const url = String(input)
        const body = String(init?.body || "")
        if (url.includes("/query")) return new Response(JSON.stringify({ results: [] }), { status: 200 })
        bodies.push(body)
        const properties = (JSON.parse(body) as { properties: Record<string, unknown> }).properties
        if ("Break start" in properties) {
          return new Response(JSON.stringify({ message: "Break start is not a property that exists." }), { status: 400 })
        }
        if ("Supervisor email" in properties) {
          return new Response(JSON.stringify({ message: "Supervisor email is not a property that exists." }), { status: 400 })
        }
        return new Response(JSON.stringify({ id: "page-1" }), { status: 200 })
      })
    })
    expect((await ctx.store.outbox.get("out-missing"))?.status).toBe("sent")
    expect(bodies.length).toBe(3)
    expect(bodies.at(-1)).not.toContain("Break start")
    expect(bodies.at(-1)).not.toContain("Supervisor email")
    expect(bodies.at(-1)).toContain("Stripped ceiling sheets")
  })
})
