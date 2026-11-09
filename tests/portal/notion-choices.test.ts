import { describe, expect, it } from "vitest"
import { createMemoryStore } from "@/lib/portal/store"
import { timesheetNotionProperties, toNotionProperties, workerNotionProperties } from "@/lib/portal/notion/map"
import { blankTickets } from "@/lib/portal/types"

const EN = "\u2013"

function worker() {
  const store = createMemoryStore({ seed: true })
  return store.workers.get("w-sam").then((row) => {
    if (!row) throw new Error("missing worker")
    return row
  })
}

describe("live Notion choices", () => {
  it("writes ticket and list choices with the live en dash and no comma", async () => {
    const row = await worker()
    row.roles = ["General labourer", "Other, please explain"]
    row.experienceLevel = "Other, please explain"
    row.workAreas = ["Northern Beaches", "Other, please explain"]
    row.rtw = "Other, please explain"
    row.vevoMethod = "Other, please explain"
    row.transport = "Other, please explain"
    row.fitness = "Yes, I can safely do these tasks"
    row.allergyTypes = ["Foods (e.g. nuts, shellfish)"]
    row.otherTicketsHeld = ["Plant ticket (excavator, skid steer, roller)"]
    row.emergencyRelationship = "Other, please explain"
    row.epipen = "Yes, I always carry it"
    row.injury = "Yes, a past injury that still affects me"
    row.medicalSharing = "Yes, share it with the site supervisor and first aider"
    row.licenceState = "NSW"
    row.constructionRecent = "Not sure"
    row.allergies = "I'd rather tell MS Workforce by phone"
    row.formStatus = "Onboarding complete"
    row.tickets.whiteCard.status = "Yes, I have it"
    const props = workerNotionProperties(row)
    expect(props["White card"]).toBe("Yes " + EN + " I have it")
    expect(props["Roles of interest"]).toEqual(["General labourer", "Other " + EN + " please explain"])
    expect(props["RTW evidence"]).toBe("Other")
    expect(props["Fitness declaration"]).toBe("Yes " + EN + " I can safely do these tasks")
    expect(props["Allergy types"]).toEqual(["Foods (e.g. nuts or shellfish)"])
    expect(props["Other tickets held"]).toEqual(["Plant ticket (excavator / skid steer / roller)"])
    expect(props["Emergency relationship"]).toBe("Other " + EN + " please explain")
    expect(props["Carries EpiPen"]).toBe("Yes " + EN + " I always carry it")
    expect(props["Form status"]).toBe("Onboarding complete")
    const typed = toNotionProperties(props)
    expect(typed["Form status"]).toEqual({ rich_text: [{ type: "text", text: { content: "Onboarding complete" } }] })
    expect(typed["Emergency relationship"]).toEqual({ select: { name: "Other " + EN + " please explain" } })
    expect(typed["Construction work in last 2 years"]).toEqual({ select: { name: "Not sure" } })
    expect(typed["Driver licence state"]).toEqual({ select: { name: "NSW" } })
    expect(typed.Allergies).toEqual({ select: { name: "I'd rather tell MS Workforce by phone" } })
    const packed = JSON.stringify(typed)
    expect(packed).not.toContain("Other, please explain")
    expect(packed).not.toContain("Yes, I have it")
    expect(packed).not.toContain("nuts, shellfish")
    expect(packed).not.toContain("skid steer, roller")
  })

  it("keeps only the Work days choices that exist, and notes the rest", async () => {
    const row = await worker()
    row.workDays = ["Monday", "Tuesday", "Short notice OK", "Other, please explain"]
    const partial = workerNotionProperties(row)
    expect(partial["Work days"]).toEqual(["Short notice OK"])
    expect(String(partial.Notes)).toContain("Monday")
    expect(String(partial.Notes)).toContain("Tuesday")
    expect(String(partial.Notes)).not.toContain("Short notice OK:")

    row.workDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    row.notes = undefined
    const full = workerNotionProperties(row)
    expect(full["Work days"]).toEqual(["Monday through Sunday"])
    expect(full.Notes).toBeUndefined()
  })

  it("skips a select value Notion does not have and keeps it in Notes", async () => {
    const row = await worker()
    row.idSightedMethod = "Photo in portal"
    row.notes = "Already noted"
    const props = workerNotionProperties(row)
    expect(props["ID sighted method"]).toBeUndefined()
    expect(String(props.Notes)).toContain("Already noted")
    expect(String(props.Notes)).toContain("ID sighted method: Photo in portal")
  })

  it("sends the supervisor role as the live select, including Other", () => {
    const sheet = {
      id: "ts",
      workerId: "w-sam",
      offerId: "offer",
      placementRef: "P-1",
      workDate: "2026-10-17",
      start: "07:00",
      finish: "15:30",
      breakMinutes: 30,
      totalHours: 8,
      tasks: "Carrying materials",
      incident: false,
      status: "Submitted" as const,
      supervisorRole: "Other, please explain",
      source: "Portal" as const,
      workerName: "Sam Lee",
    }
    const props = timesheetNotionProperties(sheet)
    expect(props["Approver role"]).toBe("Other")
    const typed = toNotionProperties(props)
    expect(typed["Approver role"]).toEqual({ select: { name: "Other" } })
  })

  it("keeps a live legacy ticket choice and skips one Notion does not share", () => {
    const row = {
      id: "w",
      role: "worker" as const,
      name: "Sam",
      mobile: "+61400111222",
      status: "Ready" as const,
      roles: [],
      whatsappOk: false,
      privacyConsent: true,
      tickets: blankTickets(),
      createdAt: "2026-10-17T00:00:00.000Z",
      updatedAt: "2026-10-17T00:00:00.000Z",
    }
    row.tickets.whiteCard.status = "Held"
    row.tickets.heights.status = "Yes – I have a White Card"
    const props = workerNotionProperties(row)
    expect(props["White card"]).toBe("Held")
    expect(props["Work at heights"]).toBeUndefined()
    expect(String(props.Notes)).toContain("Yes – I have a White Card")
  })
})
