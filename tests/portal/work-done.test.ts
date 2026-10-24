import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { workDoneProblem, workDoneText } from "@/lib/portal/work-done"
import { submitTimesheet, type Ctx } from "@/lib/portal/services"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))

vi.mock("@/app/portal/actions", () => ({
  lodgeTimesheet: async () => ({ ok: false as const, error: "not used" }),
}))

describe("what the worker did today", () => {
  it("turns old task chips into one short sentence", () => {
    expect(workDoneText(["Carrying materials", "Other, please explain"], "Helped the chippy")).toBe("Carrying materials. Helped the chippy")
    expect(workDoneText("Stripped ceiling sheets in unit 4")).toBe("Stripped ceiling sheets in unit 4")
    expect(workDoneProblem("")).toMatch(/what you did/i)
    expect(workDoneProblem("x".repeat(201))).toMatch(/200/)
    expect(workDoneProblem("Stripped ceiling sheets")).toBeNull()
  })

  it("asks for that sentence on the hours form and stores it for Notion as text", async () => {
    const { TimesheetForm } = await import("@/components/portal/TimesheetForm")
    const html = renderToStaticMarkup(
      createElement(TimesheetForm, {
        today: "2026-10-17",
        workerName: "Sam Lee",
        shifts: [
          {
            id: "offer-1",
            workDate: "2026-10-17",
            siteName: "Brookvale frame stage",
            suburb: "Brookvale",
            builder: "Site",
            start: "07:00",
            finish: "15:30",
            signer: "Pat Riley",
            signerRole: "Site supervisor",
          },
        ],
        savedSheets: [],
      }),
    )
    expect(html).toContain("What did you do today?")
    expect(html).toContain("e.g. Stripped ceiling sheets in unit 4")
    expect(html).toContain("0/200")
    expect(html).not.toContain("What did you mainly do?")
    expect(html).not.toContain("Anything MS Workforce should know")
    expect(html).toContain("Were you injured, or was there an incident or near miss today?")
    expect(html).not.toContain("Carrying materials")

    const store = createMemoryStore({ seed: true, now: new Date("2026-10-17T01:00:00.000Z") })
    const ctx: Ctx = { store, now: new Date("2026-10-17T01:00:00.000Z"), mode: "mock", notify: createNotify(store, "mock", async () => {
      throw new Error("network")
    }), }
    expect((await store.timesheets.get("ts-sam-yest"))?.tasks).toBe("Carrying materials")
    const missing = await submitTimesheet(ctx, {
      workerId: "w-sam",
      offerId: "offer-sam-today",
      workDate: "2026-10-17",
      start: "07:00",
      finish: "15:30",
      breakMinutes: 30,
      breakStart: "12:00",
      tasks: "  ",
      incident: false,
      workerConfirmed: true,
      supervisorName: "Pat Riley",
      supervisorEmail: "pat.riley@example.com",
      supervisorRole: "Site supervisor",
      supervisorConfirmed: true,
      signaturePng: "data:image/png;base64,abc",
    })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.error).toMatch(/what you did/i)
  })
})