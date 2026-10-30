import { describe, expect, it } from "vitest"
import { createNotify } from "@/lib/portal/notify"
import { createOffers, respondToOffer, submitTimesheet, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return { ctx }
}

const offerInput = {
  placementRef: "P-WAIT-1",
  suburb: "Manly",
  shiftDate: "2026-10-20",
  startTime: "07:00",
  expectedHours: 8,
  roleName: "Labourer",
  rateToWorker: "$42 an hour",
  requiredTickets: ["whiteCard"] as ["whiteCard"],
}

describe("waiting for approval", () => {
  it("does not send an offer to a worker who is not ready", async () => {
    const { ctx } = harness()
    const result = await createOffers(ctx, "w-mav", { ...offerInput, workerIds: ["w-casey"] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.created).toEqual([])
    expect(result.skipped).toContain("Casey Morgan")
    expect((await ctx.store.offers.all()).some((offer) => offer.workerId === "w-casey" && offer.placementRef === "P-WAIT-1")).toBe(false)
  })

  it("will not let a waiting worker accept an offer", async () => {
    const { ctx } = harness()
    const sam = await ctx.store.workers.get("w-sam")
    if (!sam) throw new Error("missing sam")
    sam.status = "Applicant"
    await ctx.store.workers.save(sam)
    const answer = await respondToOffer(ctx, { workerId: "w-sam", offerId: "offer-sam-open", accept: true })
    expect(answer.ok).toBe(false)
    if (answer.ok || !("error" in answer)) return
    expect(answer.error).toMatch(/Waiting for approval/)
    expect((await ctx.store.offers.get("offer-sam-open"))?.status).toBe("Offered")
  })

  it("will not let a waiting worker submit hours", async () => {
    const { ctx } = harness()
    const sam = await ctx.store.workers.get("w-sam")
    const offer = await ctx.store.offers.get("offer-sam-today")
    if (!sam || !offer) throw new Error("missing demo shift")
    sam.status = "Onboarding"
    await ctx.store.workers.save(sam)
    const result = await submitTimesheet(ctx, {
      workerId: "w-sam",
      offerId: offer.id,
      workDate: offer.shiftDate,
      start: "07:00",
      finish: "15:30",
      breakMinutes: 30,
      incident: false,
      workerConfirmed: true,
      supervisorName: "Pat Riley",
      supervisorEmail: "pat@example.com",
      supervisorRole: "Site supervisor",
      supervisorConfirmed: true,
      signaturePng: "data:image/png;base64,abc",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/Waiting for approval/)
  })
})
