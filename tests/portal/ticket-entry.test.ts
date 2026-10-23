import { describe, expect, it } from "vitest"
import { complianceFor, flagTicketMismatch, markTicketChecked, saveOtherLicences, saveTicket, saveTicketPhoto, type Ctx } from "@/lib/portal/services"
import { createNotify } from "@/lib/portal/notify"
import { createMemoryStore } from "@/lib/portal/store"
import { SENSITIVE_MESSAGE } from "@/lib/portal/privacy"

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9])
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const notify = createNotify(store, "mock", async () => {
    throw new Error("network")
  })
  const ctx: Ctx = { store, now, mode: "mock", notify }
  return ctx
}

async function pair(ctx: Ctx, key: string) {
  expect((await saveTicketPhoto(ctx, "w-sam", { bytes: JPEG, licenceKey: key, side: "front" })).ok).toBe(true)
  expect((await saveTicketPhoto(ctx, "w-sam", { bytes: PNG, licenceKey: key, side: "back" })).ok).toBe(true)
}

describe("worker ticket number and expiry", () => {
  it("requires a number when the worker says yes, and lets a white card have no expiry", async () => {
    const ctx = harness()
    const missing = await saveTicket(ctx, "w-sam", "whiteCard", { status: "Yes, I have it", number: "  ", noExpiry: true })
    expect(missing.ok).toBe(false)
    const saved = await saveTicket(ctx, "w-sam", "whiteCard", { status: "Yes, I have it", number: " WC-441928 ", noExpiry: true })
    expect(saved.ok).toBe(true)
    const sam = await ctx.store.workers.get("w-sam")
    expect(sam?.tickets.whiteCard.number).toBe("WC-441928")
    expect(sam?.tickets.whiteCard.expiry).toBeNull()
    expect(sam?.tickets.whiteCard.checkedAt).toBeUndefined()
  })

  it("refuses a past expiry and does not change the held card", async () => {
    const ctx = harness()
    await pair(ctx, "heights")
    const before = await ctx.store.workers.get("w-sam")
    const refused = await saveTicket(ctx, "w-sam", "heights", { status: "Yes, I have it", number: "HT-1", expiry: "2026-10-01" })
    expect(refused.ok).toBe(false)
    if (!refused.ok) expect(refused.error).toContain("This ticket has expired")
    const after = await ctx.store.workers.get("w-sam")
    expect(after?.tickets.heights.status).toBe(before?.tickets.heights.status)
    expect(after?.tickets.heights.number).toBe(before?.tickets.heights.number)
  })

  it("refuses a tax-file-style number and a BSB-style number", async () => {
    const ctx = harness()
    await pair(ctx, "heights")
    const tfn = await saveTicket(ctx, "w-sam", "heights", { status: "Yes, I have it", number: "123456789", expiry: "2027-06-01" })
    const bsb = await saveTicket(ctx, "w-sam", "heights", { status: "Yes, I have it", number: "062-000", expiry: "2027-06-01" })
    expect(tfn.ok).toBe(false)
    expect(bsb.ok).toBe(false)
    if (!tfn.ok) expect(tfn.error).toBe(SENSITIVE_MESSAGE)
    if (!bsb.ok) expect(bsb.error).toBe(SENSITIVE_MESSAGE)
    expect((await ctx.store.workers.get("w-sam"))?.tickets.heights.number).toBeUndefined()
    const audits = JSON.stringify(await ctx.store.audits.all())
    expect(audits).not.toContain("123456789")
    expect(audits).not.toContain("062-000")
  })

  it("clears the check when the number or expiry changes, and keeps it when they do not", async () => {
    const ctx = harness()
    const before = await ctx.store.workers.get("w-sam")
    const expiry = before?.tickets.whiteCard.expiry || ""
    const checkedAt = before?.tickets.whiteCard.checkedAt
    const same = await saveTicket(ctx, "w-sam", "whiteCard", { status: "Yes, I have it", number: "WC-441928", expiry })
    expect(same.ok).toBe(true)
    const kept = await ctx.store.workers.get("w-sam")
    expect(kept?.tickets.whiteCard.checkedAt).toBe(checkedAt)
    expect(kept?.ticketsVerified).toBe(true)

    const changed = await saveTicket(ctx, "w-sam", "whiteCard", { status: "Yes, I have it", number: "WC-100001", expiry })
    expect(changed.ok).toBe(true)
    const cleared = await ctx.store.workers.get("w-sam")
    expect(cleared?.tickets.whiteCard.number).toBe("WC-100001")
    expect(cleared?.tickets.whiteCard.checkedAt).toBeUndefined()
    expect(cleared?.ticketsVerified).toBe(false)
    const audits = JSON.stringify(await ctx.store.audits.all())
    expect(audits).not.toContain("WC-100001")
  })

  it("clears the check when a photo is replaced, and a mismatch does not delete the photos", async () => {
    const ctx = harness()
    await pair(ctx, "heights")
    expect((await saveTicket(ctx, "w-sam", "heights", { status: "Yes, I have it", number: "HT-30", expiry: "2026-11-16" })).ok).toBe(true)
    const marked = await markTicketChecked(ctx, "w-mav", "w-sam", {
      licenceKey: "heights",
      number: "HT-30",
      expiry: "2026-11-16",
      noExpiry: false,
    })
    expect(marked.ok).toBe(true)
    const flagged = complianceFor((await ctx.store.workers.get("w-sam"))!, "2026-10-17")
    expect(flagged.tickets.find((ticket) => ticket.type === "heights")?.validity).toBe("expiring")

    const blobsBefore = (await ctx.store.blobs.all()).map((blob) => blob.id).sort()
    const mismatch = await flagTicketMismatch(ctx, "w-mav", "w-sam", "heights")
    expect(mismatch.ok).toBe(true)
    const afterMismatch = await ctx.store.workers.get("w-sam")
    expect(afterMismatch?.tickets.heights.checkedAt).toBeUndefined()
    expect(afterMismatch?.tickets.heights.number).toBe("HT-30")
    expect(afterMismatch?.ticketsVerified).toBe(false)
    const blobsAfter = (await ctx.store.blobs.all()).map((blob) => blob.id).sort()
    expect(blobsAfter).toEqual(blobsBefore)
    const stillThere = (await ctx.store.documents.all()).filter((doc) => doc.workerId === "w-sam" && doc.licenceKey === "heights" && !doc.deletedAt)
    expect(stillThere.length).toBeGreaterThanOrEqual(2)

    expect((await saveTicketPhoto(ctx, "w-sam", { bytes: JPEG, licenceKey: "heights", side: "front" })).ok).toBe(true)
    const replaced = await ctx.store.workers.get("w-sam")
    expect(replaced?.tickets.heights.checkedAt).toBeUndefined()
    expect(replaced?.tickets.heights.number).toBeUndefined()
  })

  it("stores a training certificate without an expiry, and still requires one on a licence", async () => {
    const ctx = harness()
    await pair(ctx, "Asbestos awareness")
    const training = await saveOtherLicences(ctx, "w-sam", ["Asbestos awareness"], { "Asbestos awareness": { number: "AA-100" } })
    expect(training.ok).toBe(true)
    expect((await ctx.store.workers.get("w-sam"))?.licenceChecks?.["Asbestos awareness"]?.expiry).toBeNull()
    await pair(ctx, "Silica awareness")
    const silica = await saveOtherLicences(ctx, "w-sam", ["Asbestos awareness", "Silica awareness"], {
      "Asbestos awareness": { number: "AA-100" },
      "Silica awareness": { number: "SA-20" },
    })
    expect(silica.ok).toBe(true)
    await pair(ctx, "Forklift (LF)")
    const licence = await saveOtherLicences(ctx, "w-sam", ["Forklift (LF)"], { "Forklift (LF)": { number: "LF-1" } })
    expect(licence.ok).toBe(false)
    if (!licence.ok) expect(licence.error).toMatch(/expiry/i)
  })

  it("stores a number on an other licence and keeps a matching check", async () => {
    const ctx = harness()
    await pair(ctx, "Forklift (LF)")
    const saved = await saveOtherLicences(ctx, "w-sam", ["Forklift (LF)"], { "Forklift (LF)": { number: "LF-10293", expiry: "2027-06-01" } })
    expect(saved.ok).toBe(true)
    const marked = await markTicketChecked(ctx, "w-mav", "w-sam", {
      licenceKey: "Forklift (LF)",
      number: "LF-10293",
      expiry: "2027-06-01",
      noExpiry: false,
    })
    expect(marked.ok).toBe(true)
    const again = await saveOtherLicences(ctx, "w-sam", ["Forklift (LF)"], { "Forklift (LF)": { number: "LF-10293", expiry: "2027-06-01" } })
    expect(again.ok).toBe(true)
    const kept = await ctx.store.workers.get("w-sam")
    expect(kept?.licenceChecks?.["Forklift (LF)"]?.checkedBy).toBe("Mav")
    const mismatch = await flagTicketMismatch(ctx, "w-mav", "w-sam", "Forklift (LF)")
    expect(mismatch.ok).toBe(true)
    expect((await ctx.store.workers.get("w-sam"))?.licenceChecks?.["Forklift (LF)"]?.checkedBy).toBeUndefined()
    const detail = (await ctx.store.audits.all()).find((event) => event.action === "ticket-mismatch")?.detail || ""
    expect(detail).toContain("does not match the photo")
    expect(detail).not.toContain("LF-10293")
  })
})
