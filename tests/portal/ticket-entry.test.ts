import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TicketMeta, ticketDraft } from "@/components/portal/TicketMeta"
import { ticketEntryProblem } from "@/lib/portal/ticket-entry"
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
  it("labels card fields and hides an expiry that does not apply", () => {
    const white = renderToStaticMarkup(createElement(TicketMeta, { id: "whiteCard", draft: ticketDraft("whiteCard"), onChange: () => undefined }))
    expect(white).toContain("Licence or card number")
    expect(white).toContain("Issue date")
    expect(white).not.toContain('id="whiteCard-expiry"')
    expect(ticketDraft("whiteCard").noExpiry).toBe(true)
    const driver = renderToStaticMarkup(
      createElement(TicketMeta, {
        id: "driverLicence",
        draft: ticketDraft("driverLicence", { number: "1", expiry: "2028-01-01" }),
        onChange: () => undefined,
      }),
    )
    expect(driver).toContain("Licence number")
    expect(driver).toContain("Card number")
    expect(driver).toContain('id="driverLicence-expiry"')
    expect(driver).toContain("No expiry date on this card")
    expect(driver).toContain("portal-check")
    expect(driver).toContain("min-w-0")
    const hiddenExpiry = renderToStaticMarkup(
      createElement(TicketMeta, {
        id: "driverLicence",
        draft: { ...ticketDraft("driverLicence", { number: "1", expiry: "2028-01-01" }), noExpiry: true },
        onChange: () => undefined,
      }),
    )
    expect(hiddenExpiry).not.toContain('id="driverLicence-expiry"')
    expect(hiddenExpiry).toContain("No expiry date on this card")
    const training = renderToStaticMarkup(
      createElement(TicketMeta, { id: "other-Asbestos awareness", draft: ticketDraft("Asbestos awareness"), onChange: () => undefined }),
    )
    expect(training).not.toContain("Expiry date")
    expect(training).toContain("Issue date")
    const handling = renderToStaticMarkup(
      createElement(TicketMeta, { id: "other-Manual handling", draft: ticketDraft("Manual handling"), onChange: () => undefined }),
    )
    expect(handling).not.toContain("Expiry date")
    expect(handling).not.toContain("This card doesn")
    expect(handling).toContain("Issue date")
    expect(ticketEntryProblem({ number: "HT-1" }, "2026-10-17", "heights")).toBe("Enter the expiry date, or tick that there is no expiry date on this card.")
  })

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

  it("stores a driver licence number and card number, and an issue date", async () => {
    const ctx = harness()
    await pair(ctx, "driverLicence")
    const missingCard = await saveTicket(ctx, "w-sam", "driverLicence", {
      status: "Yes, I have it",
      number: "12345678",
      expiry: "2028-01-01",
      issued: "2020-02-02",
    })
    expect(missingCard.ok).toBe(false)
    if (!missingCard.ok) expect(missingCard.error).toMatch(/card number/i)
    const future = await saveTicket(ctx, "w-sam", "driverLicence", {
      status: "Yes, I have it",
      number: "12345678",
      cardNumber: "998877",
      expiry: "2028-01-01",
      issued: "2027-01-01",
    })
    expect(future.ok).toBe(false)
    const saved = await saveTicket(ctx, "w-sam", "driverLicence", {
      status: "Yes, I have it",
      number: "12345678",
      cardNumber: "998877",
      expiry: "2028-01-01",
      issued: "2020-02-02",
    })
    expect(saved.ok).toBe(true)
    const sam = await ctx.store.workers.get("w-sam")
    expect(sam?.tickets.driverLicence.number).toBe("12345678")
    expect(sam?.tickets.driverLicence.cardNumber).toBe("998877")
    expect(sam?.tickets.driverLicence.issued).toBe("2020-02-02")
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
    await pair(ctx, "Manual handling")
    const handling = await saveOtherLicences(ctx, "w-sam", ["Manual handling"], {
      "Manual handling": { number: "MH-1", expiry: "2027-01-01" },
    })
    expect(handling.ok).toBe(true)
    expect((await ctx.store.workers.get("w-sam"))?.licenceChecks?.["Manual handling"]?.expiry).toBeNull()
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
    expect(kept?.licenceChecks?.["Forklift (LF)"]?.checkedBy).toBe("Marek")
    const mismatch = await flagTicketMismatch(ctx, "w-mav", "w-sam", "Forklift (LF)")
    expect(mismatch.ok).toBe(true)
    expect((await ctx.store.workers.get("w-sam"))?.licenceChecks?.["Forklift (LF)"]?.checkedBy).toBeUndefined()
    const detail = (await ctx.store.audits.all()).find((event) => event.action === "ticket-mismatch")?.detail || ""
    expect(detail).toContain("does not match the photo")
    expect(detail).not.toContain("LF-10293")
  })
})
