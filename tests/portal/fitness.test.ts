import { readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { FITNESS_DECLARATION, INDUCTION_FITNESS_LINE } from "@/lib/portal/fitness"
import { createNotify } from "@/lib/portal/notify"
import { saveOnboarding, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"
import { TICKET_TYPES } from "@/lib/portal/types"

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

describe("one-time fitness declaration", () => {
  it("uses the approved wording and has no daily fitness route", () => {
    expect(FITNESS_DECLARATION).toBe(
      "I'm fit to do construction labouring work safely. I will tell my site supervisor and MS Workforce before starting if I'm ever not fit to work (for example sick, injured, tired, or affected by alcohol, drugs or medicine).",
    )
    expect(INDUCTION_FITNESS_LINE).toBe("If you're not fit to work on the day, tell your site supervisor and don't start.")
    const routes = walk("app").join("\n")
    expect(routes).not.toMatch(/check-in|on-site|fit-for-work|arrive-window|daily-fit/)
  })

  it("will not finish onboarding until the fitness box is ticked, and stores that tick once with the date", async () => {
    const now = new Date("2026-10-17T01:00:00.000Z")
    const store = createMemoryStore({ seed: true, now })
    const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock") }
    const casey = await store.workers.get("w-casey")
    if (!casey) throw new Error("missing casey")
    casey.signaturePng = "sig"
    casey.policiesAck = true
    casey.privacyConsent = true
    casey.healthConsent = true
    for (const type of TICKET_TYPES) casey.tickets[type] = { status: "No" }
    casey.otherTicketsHeld = ["None of these"]
    await store.workers.save(casey)

    const blocked = await saveOnboarding(ctx, "w-casey", { finish: true, typedName: "Casey Morgan", declaration: false })
    expect(blocked.ok).toBe(false)
    expect((await store.workers.get("w-casey"))?.onboardingSubmitted).toBeFalsy()

    const finished = await saveOnboarding(ctx, "w-casey", { finish: true, typedName: "Casey Morgan", declaration: true })
    expect(finished.ok).toBe(true)
    const done = await store.workers.get("w-casey")
    expect(done?.declaration).toBe(true)
    expect(done?.termsSignedOn).toBe("2026-10-17")
    expect(done?.onboardingSubmitted).toBe("2026-10-17")

    const again = await saveOnboarding(ctx, "w-casey", { finish: true, typedName: "Casey Morgan", declaration: true })
    expect(again.ok).toBe(true)
    expect((await store.workers.get("w-casey"))?.termsSignedOn).toBe("2026-10-17")
  })
})
