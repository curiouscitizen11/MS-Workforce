import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { workerCanEditTimesheet } from "@/lib/portal/timesheet-lock"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, refresh: () => undefined }),
}))

vi.mock("@/app/portal/actions", () => ({
  lodgeTimesheet: async () => ({ ok: false as const, error: "not used" }),
}))

const shift = {
  id: "offer-1",
  workDate: "2026-10-17",
  siteName: "Brookvale frame stage",
  suburb: "Brookvale",
  builder: "Site",
  start: "07:00",
  finish: "15:30",
  signer: "Pat Riley",
  signerRole: "Site supervisor",
}

function saved(status: string) {
  return {
    offerId: "offer-1",
    workDate: "2026-10-17",
    start: "07:00",
    finish: "15:30",
    breakMinutes: 30,
    breakStart: "12:00",
    tasks: "Carrying materials",
    incident: false,
    supervisorName: "Pat Riley",
    supervisorEmail: "pat.riley@example.com",
    signaturePng: "data:image/png;base64,abc",
    status,
  }
}

describe("approved timesheets stay locked for the worker", () => {
  it("hides the hours editor after pay approval and keeps it open before that", async () => {
    expect(workerCanEditTimesheet("Submitted")).toBe(true)
    expect(workerCanEditTimesheet("Queried")).toBe(true)
    expect(workerCanEditTimesheet(undefined)).toBe(true)
    expect(workerCanEditTimesheet("Approved")).toBe(false)

    const { TimesheetForm } = await import("@/components/portal/TimesheetForm")
    const approved = renderToStaticMarkup(
      createElement(TimesheetForm, {
        today: "2026-10-17",
        workerName: "Sam Lee",
        shifts: [shift],
        savedSheets: [saved("Approved")],
      }),
    )
    expect(approved).toContain("These hours are approved for pay")
    expect(approved).toContain("You can&#x27;t change them")
    expect(approved).not.toContain("Review hours")
    expect(approved).not.toContain("Sign and submit")
    expect(approved).not.toContain('id="start"')
    expect(approved).not.toContain('id="finish"')
    expect(approved).not.toContain('id="break-start"')

    const waiting = renderToStaticMarkup(
      createElement(TimesheetForm, {
        today: "2026-10-17",
        workerName: "Sam Lee",
        shifts: [shift],
        savedSheets: [saved("Submitted")],
      }),
    )
    expect(waiting).toContain("Review hours")
    expect(waiting).toContain('id="start"')
    expect(waiting).toContain('id="finish"')
    expect(waiting).not.toContain("You can&#x27;t change them")
  })
})