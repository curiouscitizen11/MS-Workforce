import { describe, expect, it } from "vitest"
import { hoursSignStamp } from "@/lib/portal/hours"
import { applyTimesheetGate, timesheetReadyToSubmit } from "@/components/portal/TimesheetForm"
import { submitTimesheet, type Ctx } from "@/lib/portal/services"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"

function harness() {
  const now = new Date("2026-10-17T01:00:00.000Z")
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return { ctx }
}

const hours = {
  workerId: "w-sam",
  offerId: "offer-sam-today",
  workDate: "2026-10-17",
  start: "07:00",
  finish: "15:30",
  breakMinutes: 30,
  breakStart: "12:00",
  tasks: "Carrying materials",
  incident: false,
  workerConfirmed: true,
  supervisorName: "Pat Riley",
  supervisorEmail: "pat.riley@example.com",
  supervisorRole: "Site supervisor",
  supervisorConfirmed: true,
  signaturePng: "data:image/png;base64,abc",
}

describe("timesheet confirmations", () => {
  it("keeps submit off until hours and the signature are both confirmed", () => {
    const blank = { hoursConfirmed: false, signatureConfirmed: false, signature: null }
    expect(timesheetReadyToSubmit(blank)).toBe(false)
    const hoursOnly = applyTimesheetGate(blank, "confirm-hours")
    expect(timesheetReadyToSubmit(hoursOnly)).toBe(false)
    const signed = applyTimesheetGate({ ...hoursOnly, signature: "data:image/png;base64,abc" }, "confirm-signature")
    expect(timesheetReadyToSubmit(signed)).toBe(true)
  })

  it("voids the signature when the hours are edited", () => {
    const signed = applyTimesheetGate(
      { hoursConfirmed: true, signatureConfirmed: false, signature: "data:image/png;base64,abc" },
      "confirm-signature",
    )
    expect(applyTimesheetGate(signed, "edit-hours")).toEqual({
      hoursConfirmed: false,
      signatureConfirmed: false,
      signature: null,
    })
  })

  it("rejects a missing or mismatched signature on the server", async () => {
    const { ctx } = harness()
    const missing = await submitTimesheet(ctx, { ...hours, signaturePng: "" })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.error).toMatch(/sign/i)
    const mismatched = await submitTimesheet(ctx, { ...hours, signedHours: "07:00|15:00|30|12:00" })
    expect(mismatched.ok).toBe(false)
    if (!mismatched.ok) expect(mismatched.error).toMatch(/does not match/)
    const matched = await submitTimesheet(ctx, { ...hours, signedHours: hoursSignStamp(hours) })
    expect(matched.ok).toBe(true)
  })
})
