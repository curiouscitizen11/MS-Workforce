import { describe, expect, it } from "vitest"
import { createNotify } from "@/lib/portal/notify"
import { readSafety, saveSafety, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

function harness() {
  const now = new Date("2026-10-17T01:00:00.000Z")
  const store = createMemoryStore({ seed: true, now })
  const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock", async () => {
    throw new Error("network")
  }) }
  return { ctx }
}

const input = {
  consent: true,
  emergencyContact: "Pat Lee",
  emergencyRelationship: "Parent",
  emergencyPhone: "0400111222",
  allergies: "Yes",
  allergyTypes: ["Bee or wasp stings"],
  anaphylaxis: "No",
  epipen: "No",
  medicalConditions: ["Asthma"],
  injury: "No",
  tasksAffected: [],
  safetyMedication: "No",
  medicalSharing: "Only in an emergency",
}

describe("safety info", () => {
  it("lets the worker and the admin read it, and keeps health details out of the audit log", async () => {
    const { ctx } = harness()
    const blocked = await saveSafety(ctx, "w-sam", { ...input, consent: false })
    expect(blocked.ok).toBe(false)
    const saved = await saveSafety(ctx, "w-sam", input)
    expect(saved.ok).toBe(true)
    const own = await readSafety(ctx, "w-sam", "w-sam")
    expect(own.ok).toBe(true)
    if (own.ok) expect(own.safety.emergencyContact).toBe("Pat Lee")
    const admin = await readSafety(ctx, "w-mav", "w-sam")
    expect(admin.ok).toBe(true)
    const other = await readSafety(ctx, "w-alex", "w-sam")
    expect(other.ok).toBe(false)
    const audits = await ctx.store.audits.all()
    const event = audits.find((item) => item.action === "update-safety")
    expect(event?.detail).toBe("Safety info updated.")
    expect(JSON.stringify(event)).not.toContain("Pat Lee")
    expect(JSON.stringify(event)).not.toContain("Asthma")
    expect(JSON.stringify(event)).not.toContain("Bee")
  })
})
