import { crc32 } from "node:zlib"
import { describe, expect, it } from "vitest"
import { signedFilePath, verifyFileToken } from "@/lib/portal/files"
import {
  approveHeadshot,
  approvedHeadshot,
  headshotViewDecision,
  pendingHeadshot,
  purgeHeadshots,
  rejectHeadshot,
  saveHeadshot,
} from "@/lib/portal/headshot"
import { createNotify } from "@/lib/portal/notify"
import { purgeDocuments, verifyWorker, type Ctx } from "@/lib/portal/services"
import { createMemoryStore } from "@/lib/portal/store"

function harness(now = new Date("2026-10-17T01:00:00.000Z")) {
  const store = createMemoryStore({ seed: true, now })
  const ctx: Ctx = { store, now, mode: "mock", notify: createNotify(store, "mock") }
  return ctx
}

function jpegWithExif() {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    Buffer.from([0xff, 0xe1, 0x00, 0x09]),
    Buffer.from("EXIFGPS"),
    Buffer.from([0xff, 0xd9]),
  ])
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body) >>> 0)
  return Buffer.concat([length, body, crc])
}

function pngWithText() {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(1, 0)
  ihdr.writeUInt32BE(1, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("tEXt", Buffer.from("GPS\0secret-location")), chunk("IEND", Buffer.alloc(0))])
}

describe("headshots", () => {
  it("requires consent, strips location data, and hides the photo until it is approved", async () => {
    const ctx = harness()
    const refused = await saveHeadshot(ctx, "w-sam", { bytes: jpegWithExif(), consent: false })
    expect(refused.ok).toBe(false)
    expect((await ctx.store.documents.all()).some((doc) => doc.kind === "headshot")).toBe(false)

    const heic = Buffer.alloc(12)
    heic.write("ftyp", 4)
    heic.write("heic", 8)
    expect((await saveHeadshot(ctx, "w-sam", { bytes: heic, consent: true })).ok).toBe(false)

    const saved = await saveHeadshot(ctx, "w-sam", { bytes: jpegWithExif(), consent: true })
    expect(saved.ok).toBe(true)
    if (!saved.ok) return
    const blob = await ctx.store.blobs.get(saved.id)
    const stored = Buffer.from(blob?.base64 || "", "base64")
    expect(stored.includes(Buffer.from("EXIFGPS"))).toBe(false)
    expect(stored[0]).toBe(0xff)
    expect(approvedHeadshot(await ctx.store.documents.all(), "w-sam")).toBeUndefined()
    expect(pendingHeadshot(await ctx.store.documents.all(), "w-sam")?.id).toBe(saved.id)

    const png = await saveHeadshot(ctx, "w-alex", { bytes: pngWithText(), consent: true })
    expect(png.ok).toBe(true)
    if (!png.ok) return
    const pngBlob = Buffer.from((await ctx.store.blobs.get(png.id))?.base64 || "", "base64")
    expect(pngBlob.includes(Buffer.from("secret-location"))).toBe(false)
    expect(pngBlob.includes(Buffer.from("IHDR"))).toBe(true)

    expect(headshotViewDecision({ signatureOk: true, role: "worker", viewerId: "w-alex", ownerId: "w-sam" })).toBe("forbidden")
    expect(headshotViewDecision({ signatureOk: true, role: "worker", viewerId: "w-sam", ownerId: "w-sam" })).toBe("ok")
    expect(headshotViewDecision({ signatureOk: true, role: "admin", viewerId: "w-mav", ownerId: "w-sam" })).toBe("ok")
    expect(headshotViewDecision({ signatureOk: false, role: "admin", viewerId: "w-mav", ownerId: "w-sam" })).toBe("expired")

    const path = signedFilePath(saved.id, ctx.now.getTime(), "test-secret")
    const params = new URL(path, "https://example.com").searchParams
    const exp = Number(params.get("exp"))
    expect(exp - Math.floor(ctx.now.getTime() / 1000)).toBeLessThanOrEqual(300)
    expect(verifyFileToken(saved.id, exp, params.get("sig") || "", "test-secret", ctx.now.getTime() + 301_000)).toBe(false)
  })

  it("keeps the approved photo until a new one is approved, then deletes rejected and inactive files on the purge step", async () => {
    const ctx = harness()
    const first = await saveHeadshot(ctx, "w-sam", { bytes: jpegWithExif(), consent: true })
    if (!first.ok) throw new Error(first.error)
    expect((await approveHeadshot(ctx, "w-sam", first.id)).ok).toBe(false)
    expect((await approveHeadshot(ctx, "w-mav", first.id)).ok).toBe(true)
    expect(approvedHeadshot(await ctx.store.documents.all(), "w-sam")?.id).toBe(first.id)

    const second = await saveHeadshot(ctx, "w-sam", { bytes: jpegWithExif(), consent: true })
    if (!second.ok) throw new Error(second.error)
    expect(approvedHeadshot(await ctx.store.documents.all(), "w-sam")?.id).toBe(first.id)
    expect((await approveHeadshot(ctx, "w-mav", second.id)).ok).toBe(true)
    expect(approvedHeadshot(await ctx.store.documents.all(), "w-sam")?.id).toBe(second.id)
    expect(await ctx.store.blobs.get(first.id)).toBeNull()

    const rejected = await saveHeadshot(ctx, "w-sam", { bytes: jpegWithExif(), consent: true })
    if (!rejected.ok) throw new Error(rejected.error)
    expect((await rejectHeadshot(ctx, "w-mav", rejected.id, "Face not clear")).ok).toBe(true)
    expect((await purgeHeadshots(ctx)).removed).toBe(0)
    expect(await ctx.store.blobs.get(rejected.id)).toBeTruthy()
    const doc = await ctx.store.documents.get(rejected.id)
    if (!doc?.rejectedAt) throw new Error("missing rejection")
    doc.rejectedAt = new Date(ctx.now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    await ctx.store.documents.save(doc)
    expect((await purgeDocuments(ctx)).removed).toBe(0)
    expect((await purgeHeadshots(ctx)).removed).toBe(1)
    expect(await ctx.store.blobs.get(rejected.id)).toBeNull()
    expect(await ctx.store.blobs.get(second.id)).toBeTruthy()

    expect((await verifyWorker(ctx, "w-mav", "w-sam", { status: "Inactive" })).ok).toBe(true)
    const sam = await ctx.store.workers.get("w-sam")
    if (!sam) throw new Error("missing sam")
    expect(sam.inactiveOn).toBe(ctx.now.toISOString())
    expect((await purgeHeadshots(ctx)).removed).toBe(0)
    sam.inactiveOn = new Date(ctx.now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString()
    await ctx.store.workers.save(sam)
    expect((await purgeHeadshots(ctx)).removed).toBe(1)
    expect(await ctx.store.blobs.get(second.id)).toBeNull()
  })
})
