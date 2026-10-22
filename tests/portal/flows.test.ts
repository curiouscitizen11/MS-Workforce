import { describe, expect, it } from "vitest"
import { encryptString } from "@/lib/portal/crypto"
import { notionRequest } from "@/lib/portal/notion/client"
import { timesheetNotionProperties, workerNotionProperties } from "@/lib/portal/notion/map"
import { assertCanCreateShiftOffersDatabase } from "../../lib/portal/notion/shift-offers.mjs"
import { createNotify } from "@/lib/portal/notify"
import {
  complianceFor,
  createOffers,
  markTicketChecked,
  processOutbox,
  purgeDocuments,
  requestMagicLink,
  requestOtp,
  respondToOffer,
  saveOnboarding,
  saveTicket,
  saveTicketAnswers,
  saveTicketPhoto,
  submitApplication,
  submitTimesheet,
  verifyOtp,
  verifyWorker,
  wipePassports,
  type Ctx,
} from "@/lib/portal/services"
import { TICKET_PHOTO_MAX_BYTES, ticketPhotoDecision } from "@/lib/portal/ticket-photos"
import { TICKET_TYPES } from "@/lib/portal/types"
import { createMemoryStore } from "@/lib/portal/store"
import { totpCode } from "@/lib/portal/totp"

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")

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
      confirmEmail: "New.Worker@Example.com",
      suburb: "Dee Why",
      roles: ["General labourer"],
      experience: "Site cleaning on weekends.",
      whatsappOk: true,
      privacyConsent: true,
      tickets: {
        whiteCard: "Yes, I have it",
        heights: "No",
        asbestosA: "No",
        asbestosB: "No",
        confinedSpace: "No",
        firstAid: "No",
        driverLicence: "No",
      },
    }
    expect((await submitApplication(ctx, input)).ok).toBe(true)
    expect((await submitApplication(ctx, input)).ok).toBe(true)
    const matches = (await ctx.store.workers.all()).filter((worker) => worker.mobile === "+61412555010")
    expect(matches).toHaveLength(1)
    expect(matches[0].status).toBe("Applicant")
    const again = await submitApplication(ctx, { ...input, mobile: "0400 111 222", name: "Sam Lee" })
    expect(again.ok).toBe(false)
    expect(matches[0].email).toBe("new.worker@example.com")
    const mismatch = await submitApplication(ctx, { ...input, mobile: "0412 555 011", confirmEmail: "other@example.com" })
    expect(mismatch.ok).toBe(false)
    if (!mismatch.ok) expect(mismatch.error).toBe("Emails don't match.")
    const bad = await submitApplication(ctx, { ...input, mobile: "0412 555 012", email: "not-an-email", confirmEmail: "not-an-email" })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toBe("That email does not look right.")
    const link = await requestMagicLink(ctx, {
      email: "Sam.Lee@example.com",
      confirmEmail: "nope@example.com",
      origin: "http://localhost:3000",
    })
    expect(link.ok).toBe(false)
    if (!link.ok) expect(link.error).toBe("Emails don't match.")
    const sent = await requestMagicLink(ctx, {
      email: "Sam.Lee@example.com",
      confirmEmail: "sam.lee@example.com",
      origin: "http://localhost:3000",
    })
    expect(sent.ok).toBe(true)
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
      incident: false,
      workerConfirmed: true,
      supervisorName: "Pat Riley",
      supervisorRole: "Site supervisor",
      supervisorConfirmed: true,
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
    const sheet = await ctx.store.timesheets.get(result.id)
    if (!sheet) throw new Error("missing timesheet")
    const props = timesheetNotionProperties(sheet)
    expect(props.Entry).toBe("Sam Lee – 2026-10-17")
    expect(props.Source).toBe("Portal")
    expect(props.Status).toBe("Approved")
    expect(props["Signature"]).toBeUndefined()
    expect(JSON.stringify(props).toLowerCase()).not.toMatch(/\btfn\b|tax file|\bbank\b|superannuation|passport|\bgps\b|latitude/)
  })

  it("clears ticket verification when a card changes", async () => {
    const { ctx } = harness()
    const before = await ctx.store.workers.get("w-sam")
    expect(before?.ticketsVerified).toBe(true)
    const blocked = await saveTicket(ctx, "w-sam", "heights", { status: "Yes, I have it", expiry: "2027-01-01", number: "HT-9999" })
    expect(blocked.ok).toBe(false)
    expect((await ctx.store.workers.get("w-sam"))?.tickets.heights.number).toBeUndefined()
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: Buffer.from("%PDF-1.4"), licenceKey: "heights", side: "front" })).ok).toBe(false)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: JPEG, licenceKey: "heights", side: "front" })).ok).toBe(true)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: PNG, licenceKey: "heights", side: "back" })).ok).toBe(true)
    const saved = await saveTicket(ctx, "w-sam", "heights", { status: "Yes, I have it", expiry: "2027-01-01", number: "HT-9999" })
    expect(saved.ok).toBe(true)
    const after = await ctx.store.workers.get("w-sam")
    expect(after?.ticketsVerified).toBe(false)
    expect(after?.tickets.heights.status).toBe("Yes, I have it")
    expect(after?.tickets.heights.number).toBeUndefined()
    expect(after?.tickets.heights.expiry).toBeUndefined()
    expect(after?.tickets.whiteCard.number).toBe("WC-441928")
    const rejected = await saveTicket(ctx, "w-sam", "heights", { status: "Expired" })
    expect(rejected.ok).toBe(false)
  })

  it("lets only an admin open ticket photos, and keeps the check record after the photos go", async () => {
    expect(ticketPhotoDecision({ signatureOk: true, role: "worker" })).toBe("forbidden")
    expect(ticketPhotoDecision({ signatureOk: true, role: null })).toBe("forbidden")
    expect(ticketPhotoDecision({ signatureOk: false, role: "admin" })).toBe("expired")
    expect(ticketPhotoDecision({ signatureOk: true, role: "admin" })).toBe("ok")

    const { ctx } = harness()
    const missing = await markTicketChecked(ctx, "w-mav", "w-sam", {
      licenceKey: "heights",
      number: "HT-22",
      expiry: "2026-11-01",
      noExpiry: false,
    })
    expect(missing.ok).toBe(false)
    await saveTicketPhoto(ctx, "w-sam", { bytes: JPEG, licenceKey: "heights", side: "front" })
    await saveTicketPhoto(ctx, "w-sam", { bytes: PNG, licenceKey: "heights", side: "back" })
    const marked = await markTicketChecked(ctx, "w-mav", "w-sam", {
      licenceKey: "heights",
      number: "HT-22",
      expiry: "2026-11-01",
      noExpiry: false,
    })
    expect(marked.ok).toBe(true)
    const checked = await ctx.store.workers.get("w-sam")
    if (!checked) throw new Error("missing worker")
    expect(checked.tickets.heights.number).toBe("HT-22")
    expect(checked.tickets.heights.expiry).toBe("2026-11-01")
    expect(checked.tickets.heights.checkedBy).toBe("Mav")
    expect(checked.tickets.heights.checkedAt).toBeTruthy()
    const flag = complianceFor(checked, "2026-10-17")
    expect(flag.badge).toBe("warning")
    expect(flag.reasons.some((reason) => reason.includes("Work at heights"))).toBe(true)

    checked.licenceChecks = { "Forklift (LF)": { number: "LF-9", expiry: "2026-10-01", checkedBy: "Mav", checkedAt: ctx.now.toISOString() } }
    const forklift = complianceFor(checked, "2026-10-17")
    expect(forklift.badge).toBe("restricted")
    expect(forklift.reasons.some((reason) => reason.includes("Forklift"))).toBe(true)

    const props = workerNotionProperties(checked)
    expect(props["White card expiry"]).toBe(checked.tickets.whiteCard.expiry)
    expect(JSON.stringify(props)).not.toContain("HT-22")
    expect(JSON.stringify(props)).not.toContain("iVBORw0")
    expect(JSON.stringify(props).toLowerCase()).not.toContain("passport")

    const old = new Date(ctx.now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    checked.tickets.heights.checkedAt = old
    checked.tickets.heights.number = "HT-22"
    checked.tickets.heights.expiry = "2027-04-01"
    checked.tickets.heights.checkedBy = "Mav"
    await ctx.store.workers.save(checked)
    for (const doc of await ctx.store.documents.all()) {
      if (doc.workerId === "w-sam" && doc.licenceKey === "heights" && !doc.deletedAt) {
        doc.verifiedAt = old
        await ctx.store.documents.save(doc)
      }
    }
    for (const side of ["front", "back"] as const) {
      const id = "doc-age-" + side
      await ctx.store.documents.save({
        id,
        workerId: "w-sam",
        kind: "ticket",
        licenceKey: "heights",
        side,
        contentType: "image/jpeg",
        bytes: 4,
        createdAt: old,
        verifiedAt: old,
      })
      await ctx.store.blobs.save({ id, contentType: "image/jpeg", base64: "aaaa" })
    }
    const purged = await purgeDocuments(ctx)
    expect(purged.removed).toBeGreaterThanOrEqual(2)
    const kept = await ctx.store.workers.get("w-sam")
    expect(kept?.tickets.heights.number).toBe("HT-22")
    expect(kept?.tickets.heights.expiry).toBe("2027-04-01")
    expect(kept?.tickets.heights.checkedBy).toBe("Mav")
    expect(kept?.tickets.heights.checkedAt).toBe(old)
    expect(kept?.tickets.heights.photosDeletedAt).toBeTruthy()
    expect(await ctx.store.blobs.get("doc-age-front")).toBeNull()
    expect(await ctx.store.blobs.get("doc-age-back")).toBeNull()
    const audits = await ctx.store.audits.all()
    expect(audits.some((event) => event.action === "delete-ticket-photos" && event.actorId === "cron")).toBe(true)
  })

  it("rejects a missing back, a bad file, a tax-file-style number, and a non-admin check", async () => {
    const { ctx } = harness()
    const back = await ctx.store.documents.get("doc-sam-wc-back")
    if (!back) throw new Error("missing back photo")
    back.deletedAt = ctx.now.toISOString()
    await ctx.store.documents.save(back)
    const kept = await saveTicket(ctx, "w-sam", "whiteCard", { status: "Yes, I have it" })
    expect(kept.ok).toBe(false)
    const sam = await ctx.store.workers.get("w-sam")
    expect(sam?.tickets.whiteCard.number).toBe("WC-441928")
    expect(sam?.tickets.whiteCard.checkedBy).toBe("Mav")
    expect(sam?.ticketsVerified).toBe(true)

    const huge = Buffer.alloc(TICKET_PHOTO_MAX_BYTES + 1, 0)
    huge[0] = 0xff
    huge[1] = 0xd8
    huge[2] = 0xff
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: huge, licenceKey: "heights", side: "back" })).ok).toBe(false)
    const webp = Buffer.alloc(12)
    webp.write("RIFF", 0)
    webp.write("WEBP", 8)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: webp, licenceKey: "heights", side: "back" })).ok).toBe(false)
    const heic = Buffer.alloc(12)
    heic.write("ftyp", 4)
    heic.write("heic", 8)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: heic, licenceKey: "heights", side: "back" })).ok).toBe(true)
    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: JPEG, licenceKey: "heights", side: "front" })).ok).toBe(true)

    const tfn = await markTicketChecked(ctx, "w-mav", "w-sam", {
      licenceKey: "heights",
      number: "123456789",
      expiry: "2027-01-01",
      noExpiry: false,
    })
    expect(tfn.ok).toBe(false)
    expect((await ctx.store.workers.get("w-sam"))?.tickets.heights.number).toBeUndefined()
    const workerTry = await markTicketChecked(ctx, "w-sam", "w-sam", {
      licenceKey: "heights",
      number: "HT-22",
      expiry: "2027-01-01",
      noExpiry: false,
    })
    expect(workerTry.ok).toBe(false)
    expect((await ctx.store.workers.get("w-sam"))?.tickets.heights.checkedBy).toBeUndefined()
  })

  it("keeps photos younger than 7 days and still lets onboarding finish when no card is held", async () => {
    const { ctx } = harness()
    const youngAt = new Date(ctx.now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
    await ctx.store.documents.save({
      id: "doc-young",
      workerId: "w-alex",
      kind: "ticket",
      licenceKey: "whiteCard",
      side: "front",
      contentType: "image/jpeg",
      bytes: 4,
      createdAt: youngAt,
      verifiedAt: youngAt,
    })
    await ctx.store.blobs.save({ id: "doc-young", contentType: "image/jpeg", base64: "aaaa" })
    const early = await purgeDocuments(ctx)
    expect(early.removed).toBe(0)
    expect(await ctx.store.blobs.get("doc-young")).toBeTruthy()
    expect(await ctx.store.blobs.get("doc-sam-wc-front")).toBeTruthy()

    const due = new Date(ctx.now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const young = await ctx.store.documents.get("doc-young")
    if (!young) throw new Error("missing young photo")
    young.verifiedAt = due
    await ctx.store.documents.save(young)
    const alex = await ctx.store.workers.get("w-alex")
    if (!alex) throw new Error("missing alex")
    alex.tickets.whiteCard = { status: "Yes, I have it", number: "WC-1", expiry: "2027-01-01", checkedBy: "Mav", checkedAt: due }
    await ctx.store.workers.save(alex)
    const later = await purgeDocuments(ctx)
    expect(later.removed).toBe(1)
    expect(await ctx.store.blobs.get("doc-young")).toBeNull()
    const kept = await ctx.store.workers.get("w-alex")
    expect(kept?.tickets.whiteCard.number).toBe("WC-1")
    expect(kept?.tickets.whiteCard.checkedBy).toBe("Mav")
    expect(kept?.tickets.whiteCard.photosDeletedAt).toBeTruthy()

    const casey = await ctx.store.workers.get("w-casey")
    if (!casey) throw new Error("missing casey")
    casey.signaturePng = "sig"
    casey.policiesAck = true
    casey.privacyConsent = true
    casey.healthConsent = true
    await ctx.store.workers.save(casey)
    const named = await saveOnboarding(ctx, "w-casey", { preferredName: "Case" })
    expect(named.ok).toBe(true)
    const blocked = await saveOnboarding(ctx, "w-casey", { finish: true, typedName: "Casey Morgan" })
    expect(blocked.ok).toBe(false)
    expect((await ctx.store.workers.get("w-casey"))?.onboardingSubmitted).toBeFalsy()
    expect((await ctx.store.workers.get("w-casey"))?.preferredName).toBe("Case")

    const skipped = await saveOnboarding(ctx, "w-casey", { otherTicketsHeld: ["Forklift (LF)"] })
    expect(skipped.ok).toBe(true)
    expect((await ctx.store.workers.get("w-casey"))?.otherTicketsHeld || []).not.toContain("Forklift (LF)")

    const none = Object.fromEntries(TICKET_TYPES.map((type) => [type, "No"]))
    const answers = await saveTicketAnswers(ctx, "w-casey", { tickets: none, otherTicketsHeld: ["None of these"] })
    expect(answers.ok).toBe(true)
    expect((await ctx.store.workers.get("w-casey"))?.tickets.whiteCard.status).toBe("No")
    const finished = await saveOnboarding(ctx, "w-casey", { finish: true, typedName: "Casey Morgan" })
    expect(finished.ok).toBe(true)
    expect((await ctx.store.workers.get("w-casey"))?.onboardingSubmitted).toBeTruthy()
    expect((await ctx.store.workers.get("w-casey"))?.tickets.whiteCard.number).toBeUndefined()
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
