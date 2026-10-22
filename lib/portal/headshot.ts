import { deletePrivateBlob, storePrivateBlob } from "@/lib/portal/blob"
import { contentTypeFor, sniffFile, stripJpegExif, stripPngMetadata } from "@/lib/portal/files"
import { newId } from "@/lib/portal/id"
import type { Ctx } from "@/lib/portal/services"
import type { PortalDocument } from "@/lib/portal/types"
import { MS_PHONE } from "@/lib/portal/pay"

export const HEADSHOT_GUIDANCE =
  "A clear photo of your face, looking at the camera. No sunglasses, hat or hard hat. Plain background if you can."

export const HEADSHOT_CONSENT =
  "I agree MS Workforce can show this photo on my worker ID card so builders can check it's me."

export const HEADSHOT_REJECT_REASONS = ["Face not clear", "Not a photo of you", "Sunglasses, hat or hard hat"] as const

export const HEADSHOT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024
export const HEADSHOT_STORED_MAX_BYTES = 150 * 1024
export const HEADSHOT_REJECT_MS = 7 * 24 * 60 * 60 * 1000
export const HEADSHOT_INACTIVE_MS = 30 * 24 * 60 * 60 * 1000

export function headshotViewDecision(input: {
  signatureOk: boolean
  role: "worker" | "admin" | null
  viewerId: string | null
  ownerId: string
}): "expired" | "forbidden" | "ok" {
  if (!input.signatureOk) return "expired"
  if (input.role === "admin") return "ok"
  if (input.role === "worker" && input.viewerId && input.viewerId === input.ownerId) return "ok"
  return "forbidden"
}

export function approvedHeadshot(docs: PortalDocument[], workerId: string) {
  return docs
    .filter((doc) => doc.workerId === workerId && doc.kind === "headshot" && doc.headshotStatus === "Approved" && !doc.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function pendingHeadshot(docs: PortalDocument[], workerId: string) {
  return docs
    .filter((doc) => doc.workerId === workerId && doc.kind === "headshot" && doc.headshotStatus === "Pending" && !doc.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

export function workerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "")
  return letters.join("") || "?"
}

function fail(error: string) {
  return { ok: false as const, error }
}

async function audit(ctx: Ctx, actorId: string, action: string, target: string, detail: string) {
  await ctx.store.audits.save({
    id: newId("aud"),
    at: ctx.now.toISOString(),
    actorId,
    action,
    target,
    detail,
  })
}

async function forget(ctx: Ctx, id: string) {
  const blob = await ctx.store.blobs.get(id)
  if (blob?.url) await deletePrivateBlob(blob.url)
  await ctx.store.blobs.remove(id)
}

async function retire(ctx: Ctx, doc: PortalDocument, actorId: string, detail: string) {
  doc.deletedAt = ctx.now.toISOString()
  await ctx.store.documents.save(doc)
  await forget(ctx, doc.id)
  await audit(ctx, actorId, "delete-headshot", doc.id, detail)
}

export async function saveHeadshot(ctx: Ctx, workerId: string, input: { bytes: Buffer; consent: boolean }) {
  const worker = await ctx.store.workers.get(workerId)
  if (!worker || worker.role !== "worker") return fail("Log in as a worker.")
  if (!input.consent) return fail("Tick the box to let MS Workforce show this photo on your ID card.")
  if (input.bytes.length > HEADSHOT_UPLOAD_MAX_BYTES) {
    return fail("That photo is over 10 MB. Take it again a little further from your face.")
  }
  const sniffed = sniffFile(input.bytes)
  if (sniffed === "heic") return fail("Use a JPG or PNG photo so the location data can be removed.")
  if (sniffed !== "jpeg" && sniffed !== "png") return fail("Use a JPG or PNG photo.")
  const bytes = sniffed === "jpeg" ? stripJpegExif(input.bytes) : stripPngMetadata(input.bytes)
  if (bytes.length > HEADSHOT_STORED_MAX_BYTES) {
    return fail("That photo is still too big. Move a little further away and try again.")
  }
  const existing = (await ctx.store.documents.all()).filter(
    (doc) => doc.workerId === workerId && doc.kind === "headshot" && doc.headshotStatus === "Pending" && !doc.deletedAt,
  )
  for (const doc of existing) {
    await retire(ctx, doc, workerId, "Replaced by a newer headshot that is still waiting for a check.")
  }
  const id = newId("doc")
  const contentType = contentTypeFor(sniffed)
  let url: string | null = null
  try {
    url = await storePrivateBlob(id, bytes, contentType, "portal/headshots")
  } catch {
    return fail("The private file store did not accept this photo. Try again, or call MS Workforce on " + MS_PHONE + ".")
  }
  await ctx.store.blobs.save({
    id,
    contentType,
    base64: url ? "" : bytes.toString("base64"),
    url: url || undefined,
  })
  await ctx.store.documents.save({
    id,
    workerId,
    kind: "headshot",
    contentType,
    bytes: bytes.length,
    createdAt: ctx.now.toISOString(),
    headshotStatus: "Pending",
  })
  await audit(ctx, workerId, "upload-headshot", id, "Headshot uploaded.")
  return { ok: true as const, id }
}

export async function approveHeadshot(ctx: Ctx, adminId: string, documentId: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  const doc = await ctx.store.documents.get(documentId)
  if (!doc || doc.kind !== "headshot" || doc.deletedAt || doc.headshotStatus !== "Pending") {
    return fail("That photo is not waiting for a check.")
  }
  doc.headshotStatus = "Approved"
  await ctx.store.documents.save(doc)
  const others = (await ctx.store.documents.all()).filter(
    (item) => item.workerId === doc.workerId && item.kind === "headshot" && item.id !== doc.id && !item.deletedAt,
  )
  for (const item of others) {
    await retire(ctx, item, adminId, "Deleted the previous headshot after the new one was approved.")
  }
  await audit(ctx, adminId, "approve-headshot", doc.id, "Headshot approved.")
  return { ok: true as const }
}

export async function rejectHeadshot(ctx: Ctx, adminId: string, documentId: string, reason: string) {
  const admin = await ctx.store.workers.get(adminId)
  if (!admin || admin.role !== "admin") return fail("Mav's login is required.")
  if (!(HEADSHOT_REJECT_REASONS as readonly string[]).includes(reason)) return fail("Choose a reason from the list.")
  const doc = await ctx.store.documents.get(documentId)
  if (!doc || doc.kind !== "headshot" || doc.deletedAt || doc.headshotStatus === "Rejected") {
    return fail("That photo is not waiting for a check.")
  }
  doc.headshotStatus = "Rejected"
  doc.rejectReason = reason
  doc.rejectedAt = ctx.now.toISOString()
  await ctx.store.documents.save(doc)
  await audit(ctx, adminId, "reject-headshot", doc.id, "Headshot rejected: " + reason + ".")
  return { ok: true as const }
}

export async function purgeHeadshots(ctx: Ctx) {
  let removed = 0
  const workers = await ctx.store.workers.all()
  for (const doc of await ctx.store.documents.all()) {
    if (doc.kind !== "headshot" || doc.deletedAt) continue
    const rejectedAt = doc.rejectedAt || (doc.headshotStatus === "Rejected" ? doc.createdAt : "")
    const rejectedDue = doc.headshotStatus === "Rejected" && rejectedAt && ctx.now.getTime() - Date.parse(rejectedAt) >= HEADSHOT_REJECT_MS
    const worker = workers.find((item) => item.id === doc.workerId)
    const inactiveDue =
      worker?.status === "Inactive" &&
      Boolean(worker.inactiveOn) &&
      ctx.now.getTime() - Date.parse(worker.inactiveOn || "") >= HEADSHOT_INACTIVE_MS
    if (!rejectedDue && !inactiveDue) continue
    await retire(
      ctx,
      doc,
      "cron",
      rejectedDue
        ? "Deleted a rejected headshot 7 days after it was refused."
        : "Deleted a headshot 30 days after the worker became inactive.",
    )
    removed += 1
  }
  return { ok: true as const, removed }
}
