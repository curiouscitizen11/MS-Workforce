import { acceptedHeldLabel } from "@/lib/portal/ticket-catalogue"
import { TICKET_LABELS, TICKET_TYPES, type PhotoSide, type PortalDocument, type TicketType, type Worker } from "@/lib/portal/types"

export const TICKET_PHOTO_MAX_BYTES = 8 * 1024 * 1024

export const TICKET_PHOTO_TYPES = ["jpeg", "png", "heic"] as const

export function isTicketType(value: string): value is TicketType {
  return (TICKET_TYPES as readonly string[]).includes(value)
}

export function isOtherLicence(value: string): boolean {
  return value !== "None of these" && acceptedHeldLabel(value)
}

export function isPhotoLicenceKey(value: string): boolean {
  return isTicketType(value) || isOtherLicence(value)
}

export function licenceLabel(key: string): string {
  if (isTicketType(key)) return TICKET_LABELS[key]
  return key
}

export type PhotoRef = { key: string; side: PhotoSide }

export type PhotoSlot = { key: string; label: string }

export function requiredPhotoSlots(
  answers: { tickets: Partial<Record<TicketType, string>>; otherTicketsHeld?: string[] },
): PhotoSlot[] {
  const slots: PhotoSlot[] = []
  for (const type of TICKET_TYPES) {
    if (answers.tickets[type] === "Yes, I have it") slots.push({ key: type, label: TICKET_LABELS[type] })
  }
  for (const label of answers.otherTicketsHeld || []) {
    if (!isOtherLicence(label)) continue
    slots.push({ key: label, label })
  }
  return slots
}

export function slotsFromWorker(worker: Pick<Worker, "tickets" | "otherTicketsHeld">): PhotoSlot[] {
  const tickets = {} as Record<TicketType, string>
  for (const type of TICKET_TYPES) tickets[type] = worker.tickets[type]?.status || "No"
  return requiredPhotoSlots({ tickets, otherTicketsHeld: worker.otherTicketsHeld })
}

export function activeTicketPhotos(docs: PortalDocument[], workerId: string, key?: string): PortalDocument[] {
  return docs.filter((doc) => {
    if (doc.workerId !== workerId || doc.deletedAt || doc.kind !== "ticket") return false
    if (!doc.licenceKey || !doc.side) return false
    if (key && doc.licenceKey !== key) return false
    return true
  })
}

export function sidesPresent(docs: PortalDocument[], workerId: string, key: string): Record<PhotoSide, boolean> {
  const rows = activeTicketPhotos(docs, workerId, key)
  return {
    front: rows.some((doc) => doc.side === "front"),
    back: rows.some((doc) => doc.side === "back"),
  }
}

export function latestPhoto(docs: PortalDocument[], workerId: string, key: string, side: PhotoSide): PortalDocument | null {
  const rows = activeTicketPhotos(docs, workerId, key)
    .filter((doc) => doc.side === side)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return rows[0] || null
}

export function missingPhotoMessage(slots: PhotoSlot[], docs: PortalDocument[], workerId: string): string | null {
  const missing = slots.filter((slot) => {
    const sides = sidesPresent(docs, workerId, slot.key)
    return !sides.front || !sides.back
  })
  if (!missing.length) return null
  if (missing.length === 1) {
    return "Add a photo of the front and the back of the " + missing[0].label + " before you continue."
  }
  return "Add a front and back photo for: " + missing.map((slot) => slot.label).join(", ") + "."
}

export function heldLicenceExpiries(worker: Pick<Worker, "otherTicketsHeld" | "licenceChecks">): { label: string; expiry?: string | null }[] {
  const held = new Set(worker.otherTicketsHeld || [])
  return Object.entries(worker.licenceChecks || {})
    .filter(([label]) => held.has(label) && isOtherLicence(label))
    .map(([label, check]) => ({ label, expiry: check.expiry }))
}

/** A ticket photo can be opened only by an admin, and only with a live signature. */
export function ticketPhotoDecision(input: { signatureOk: boolean; role: "worker" | "admin" | null }): "ok" | "expired" | "forbidden" {
  if (!input.signatureOk) return "expired"
  if (input.role !== "admin") return "forbidden"
  return "ok"
}
