import { describe, expect, it } from "vitest"
import { encryptString } from "@/lib/portal/crypto"
import { notionRequest } from "@/lib/portal/notion/client"
import { workerNotionProperties } from "@/lib/portal/notion/map"
import { assertCanCreateShiftOffersDatabase } from "../../lib/portal/notion/shift-offers.mjs"
import { createNotify } from "@/lib/portal/notify"
import {
  createOffers,
  processOutbox,
  purgeDocuments,
  requestOtp,
  respondToOffer,
  saveTicket,
  submitApplication,
  submitTimesheet,
  verifyOtp,
  verifyWorker,
  wipePassports,
  type Ctx,
} from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"
import { totpCode } from "@/lib/portal/totp"

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  let fetches = 0
  const notify = createNotify(store, "mock", async () => {
    fetches += 1
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return {
    ctx,
    get fetches() {
      return fetches
    },
  }
}

describe("portal flows", () => {
  it("does not call Notion or Twilio in mock mode", async () => {
    const { ctx, fetches } = harness()
    await expect(notionRequest("/users")).rejects.toThrow(/must not call Notion/)
    await requestOtp(ctx, { mobile: "0400 111 222", ip: "10.0.0.1" })
    await processOutbox(ctx, async () => {
      throw new Error("network")
    })
    expect(fetches).toBe(0)
    const outbox = await ctx.store.outbox.all()
    expect(outbox.every((item) => item.status === "skipped-mock")).toBe(true)
  })

  it("locks a mobile after five wrong codes", async () => {
    const { ctx } = harness()
    const sent = await requestOtp(ctx, { mobile: "0400111222", ip: "10.0.0.2" })
    expect(sent.ok).toBe(true)
    if (!sent.ok) return
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await verifyOtp(ctx, { mobile: "0400111222", code: "000000" })
      expect(result.ok).toBe(false)
    }
    const locked = await verifyOtp(ctx, { mobile: "0400111222", code: sent.devCode || "" })
    expect(locked.ok).toBe(false)
    if (!locked.ok) expect(locked.code).toBe("locked")
  })

  it("upserts an application by mobile", async () => {
    const { ctx } = harness()
    const input = {
      name: "New Worker",
      mobile: "0412 555 010",
      email: "new.worker@example.com",
      suburb: "Dee Why",
      roles: ["General labourer"],
      experience: "Site cleaning on weekends.",
      whatsappOk: true,
      privacyConsent: true,
      tickets: {
        whiteCard: "Held",
        heights: "Not held",
        asbestosA: "Not held",
        asbestosB: "Not held",
        confinedSpace: "Not held",
        firstAid: "Not held",
        driverLicence: "Not held",
      },
    }
    expect((await submitApplication(ctx, input)).ok).toBe(true)
    expect((await submitApplication(ctx, input)).ok).toBe(true)
    const matches = (await ctx.store.workers.all()).filter((worker) => worker.mobile === "+61412555010")
    expect(matches).toHaveLength(1)
    expect(matches[0].status).toBe("Applicant")
    const again = await submitApplication(ctx, { ...input, mobile: "0400 111 222", name: "Sam Lee" })
    expect(again.ok).toBe(false)
  })

  it("blocks Alex and lets Sam accept", async () => {
    const { ctx } = harness()
    const blocked = await respondToOffer(ctx, { workerId: "w-alex", offerId: "offer-alex-open", accept: true })
    expect(blocked.ok).toBe(false)
    const other = await respondToOffer(ctx, { workerId: "w-sam", offerId: "offer-alex-open", accept: true })
    expect(other.ok).toBe(false)
    const accepted = await respondToOffer(ctx, { workerId: "w-sam", offerId: "offer-sam-open", accept: true })
    expect(accepted.ok).toBe(true)
    const emails = await ctx.store.notifications.all()
    expect(emails.some((item) => item.channel === "email" && item.subject?.includes("accepted"))).toBe(true)
    expect(emails.some((item) => item.channel === "whatsapp" && item.status === "stub")).toBe(true)
  })

  it("signs a timesheet for 8 hours and sends a confirmation, not an approval link", async () => {
    const { ctx } = harness()
    const result = await submitTimesheet(ctx, {
      workerId: "w-sam",
      offerId: "offer-sam-today",
      workDate: "2026-10-17",
      start: "07:00",
      finish: "15:30",
      breakMinutes: 30,
      supervisorName: "Pat Riley",
      supervisorRole: "Site supervisor",
      signaturePng: "data:image/png;base64,abc",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.hours).toBe(8)
    expect(result.status).toBe("Approved")
    const messages = await ctx.store.notifications.all()
    const body = messages.map((item) => item.body).join("\n")
    expect(body).toContain("This signature is the approval")
    expect(body.toLowerCase()).not.toContain("tally")
    expect(body.toLowerCase()).not.toContain("approval link")
  })

  it("clears ticket verification when a card changes", async () => {
    const { ctx } = harness()
    const before = await ctx.store.workers.get("w-sam")
    expect(before?.ticketsVerified).toBe(true)
    await saveTicket(ctx, "w-sam", "heights", { status: "Held", expiry: "2027-01-01", number: "HT-9999" })
    const after = await ctx.store.workers.get("w-sam")
    expect(after?.ticketsVerified).toBe(false)
  })

  it("keeps passport numbers out of Notion and wipes them", async () => {
    const { ctx } = harness()
    const worker = await ctx.store.workers.get("w-priya")
    if (!worker) throw new Error("missing worker")
    worker.passport = { ciphertext: encryptString("N1234567"), country: "India", collectedAt: ctx.now.toISOString() }
    await ctx.store.workers.save(worker)
    const props = workerNotionProperties(worker)
    expect(JSON.stringify(props).toLowerCase()).not.toContain("n1234567")
    expect(JSON.stringify(props).toLowerCase()).not.toContain("passport")
    const saved = await verifyWorker(ctx, "w-mav", "w-priya", { vevoResult: "Work rights OK" })
    expect(saved.ok).toBe(true)
    expect((await ctx.store.workers.get("w-priya"))?.passport).toBeFalsy()

    const stale = await ctx.store.workers.get("w-jordan")
    if (!stale) throw new Error("missing")
    stale.passport = {
      ciphertext: encryptString("X999"),
      country: "Australia",
      collectedAt: new Date(ctx.now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
    await ctx.store.workers.save(stale)
    await wipePassports(ctx)
    expect((await ctx.store.workers.get("w-jordan"))?.passport).toBeFalsy()
  })

  it("deletes images seven days after verification", async () => {
    const { ctx } = harness()
    await ctx.store.documents.save({
      id: "doc-old",
      workerId: "w-alex",
      kind: "id",
      contentType: "image/png",
      bytes: 4,
      createdAt: ctx.now.toISOString(),
      verifiedAt: new Date(ctx.now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    })
    await ctx.store.blobs.save({ id: "doc-old", contentType: "image/png", base64: "aaaa" })
    const result = await purgeDocuments(ctx)
    expect(result.removed).toBe(1)
    expect(await ctx.store.blobs.get("doc-old")).toBeNull()
    expect((await ctx.store.documents.get("doc-old"))?.deletedAt).toBeTruthy()
  })

  it("refuses to create Shift offers in the live workspace", () => {
    expect(() =>
      assertCanCreateShiftOffersDatabase({
        notionEnv: "test",
        confirm: "yes",
        ids: ["6da57660-0ef5-4faf-a63e-c85a42b68cf2"],
      }),
    ).toThrow(/live/)
    expect(() =>
      assertCanCreateShiftOffersDatabase({
        notionEnv: "production",
        confirm: "yes",
        ids: ["test-page"],
      }),
    ).toThrow(/PORTAL_NOTION_ENV/)
  })

  it("will not offer a do-not-book worker by name", async () => {
    const { ctx } = harness()
    const result = await createOffers(ctx, "w-mav", {
      placementRef: "P-2026-020",
      suburb: "Manly",
      shiftDate: "2026-10-20",
      startTime: "07:00",
      expectedHours: 8,
      roleName: "Labourer",
      rateToWorker: "$42 an hour",
      requiredTickets: ["whiteCard"],
      workerIds: ["w-alex"],
    })
    expect(result.ok).toBe(false)
  })

  it("signs Mav in only with the authenticator code", async () => {
    const { ctx } = harness()
    const sent = await requestOtp(ctx, { mobile: "0400 000 001", ip: "10.0.0.9" })
    expect(sent.ok).toBe(true)
    if (!sent.ok || !sent.devCode) return
    const step = await verifyOtp(ctx, { mobile: "0400000001", code: sent.devCode })
    expect(step.ok).toBe(true)
    if (!step.ok || !step.needsTotp) return
    const { confirmAdminTotp } = await import("@/lib/portal/services")
    const bad = await confirmAdminTotp(ctx, step.workerId, "000000")
    expect(bad.ok).toBe(false)
    const good = await confirmAdminTotp(ctx, step.workerId, totpCode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", ctx.now.getTime()))
    expect(good.ok).toBe(true)
  })
})
