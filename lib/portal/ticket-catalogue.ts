import { assessTicket, warningWindowDays } from "@/lib/portal/compliance"
import { daysBetween } from "@/lib/portal/dates"
import { sensitiveMessage } from "@/lib/portal/privacy"
import { asksForExpiry, isTrainingItem } from "@/lib/portal/ticket-entry"
import { OTHER_TICKETS, TICKET_LABELS, TICKET_TYPES, type TicketType } from "@/lib/portal/types"

export type PickerItem = { id: string; label: string; status?: string }

export type PickerGroup = { name: string; items: PickerItem[] }

export type TicketRow = {
  id: string
  key: string
  kind: "ticket" | "other"
  label: string
  status: string
}

const HELD = new Set<string>(["Yes, I have it", "Booked in for the course"])

export function normalTicketName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

export function customTicketNameProblem(name: string, taken: string[] = []): string | null {
  const value = normalTicketName(name)
  if (!value) return "Type the name of the ticket or training."
  if (value.length > 60) return "That name is too long."
  if (!/^[A-Za-z0-9][A-Za-z0-9 &'().,/-]*$/.test(value)) return "Use letters, numbers and simple punctuation only."
  const sensitive = sensitiveMessage(value)
  if (sensitive) return sensitive
  const lower = value.toLowerCase()
  if (lower === "none of these" || lower === "other" || lower === "other, please explain") {
    return "Type the real name of the ticket or training."
  }
  if ((TICKET_TYPES as readonly string[]).includes(value)) return "That one is already in the list."
  const known = [
    ...TICKET_TYPES.map((type) => TICKET_LABELS[type]),
    ...OTHER_TICKETS,
  ]
  if (known.some((label) => label.toLowerCase() === lower)) return "That one is already in the list."
  if (taken.some((label) => label.toLowerCase() === lower)) return "That one is already added."
  return null
}

/** A stored "other tickets" label: a known catalogue row, or a name the worker typed. */
export function acceptedHeldLabel(value: string): boolean {
  if ((OTHER_TICKETS as readonly string[]).includes(value)) return true
  return customTicketNameProblem(value) === null
}

export function ticketCatalogue(): PickerGroup[] {
  const licences = [
    ...TICKET_TYPES.filter((type) => type !== "other").map((type) => ({ id: "ticket:" + type, label: TICKET_LABELS[type] })),
    ...OTHER_TICKETS.filter((item) => !isTrainingItem(item) && item !== "None of these" && item !== "Other, please explain").map((item) => ({
      id: "other:" + item,
      label: item,
    })),
  ]
  const training = (["Asbestos awareness", "Silica awareness"] as const).map((item) => ({ id: "other:" + item, label: item }))
  return [
    { name: "Licences", items: licences },
    { name: "Training", items: training },
  ]
}

export function matchesSearch(label: string, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return label.toLowerCase().includes(q)
}

type TicketSnapshot = { status?: string; expiry?: string | null }

export function addedTicketIds(input: {
  tickets: Partial<Record<TicketType, TicketSnapshot>>
  otherHeld?: string[]
}): string[] {
  const ids = ["ticket:whiteCard"]
  for (const type of TICKET_TYPES) {
    if (type === "whiteCard" || type === "other") continue
    if (HELD.has(input.tickets[type]?.status || "")) ids.push("ticket:" + type)
  }
  if (HELD.has(input.tickets.other?.status || "")) ids.push("ticket:other")
  for (const label of input.otherHeld || []) {
    if (label === "None of these" || !acceptedHeldLabel(label)) continue
    ids.push("other:" + label)
  }
  return ids
}

function ticketStatusWord(type: TicketType, ticket: TicketSnapshot | undefined, today: string) {
  if (ticket?.status === "Booked in for the course") return "Booked"
  const row = assessTicket({ type, status: ticket?.status, expiry: ticket?.expiry }, today)
  if (row.validity === "expired") return "Expired"
  if (row.validity === "expiring") return "Expires soon"
  if (row.validity === "valid") return "Valid"
  return "Not added yet"
}

function otherStatusWord(label: string, expiry: string | null | undefined, today: string) {
  if (!asksForExpiry(label)) return "Valid"
  if (!expiry || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return "Valid"
  const days = daysBetween(today, expiry)
  if (days < 0) return "Expired"
  if (days <= warningWindowDays("other")) return "Expires soon"
  return "Valid"
}

export function ticketRows(input: {
  today: string
  tickets: Partial<Record<TicketType, TicketSnapshot>>
  otherHeld?: string[]
  otherDetails?: Record<string, { expiry?: string | null }>
}): TicketRow[] {
  const added = new Set(addedTicketIds(input))
  const rows: TicketRow[] = []
  for (const group of ticketCatalogue()) {
    for (const item of group.items) {
      if (!added.has(item.id)) continue
      if (item.id.startsWith("ticket:")) {
        const key = item.id.slice("ticket:".length) as TicketType
        rows.push({ id: item.id, key, kind: "ticket", label: item.label, status: ticketStatusWord(key, input.tickets[key], input.today) })
      } else {
        const key = item.id.slice("other:".length)
        rows.push({
          id: item.id,
          key,
          kind: "other",
          label: item.label,
          status: otherStatusWord(key, input.otherDetails?.[key]?.expiry, input.today),
        })
      }
    }
  }
  if (added.has("ticket:other")) {
    rows.push({
      id: "ticket:other",
      key: "other",
      kind: "ticket",
      label: TICKET_LABELS.other,
      status: ticketStatusWord("other", input.tickets.other, input.today),
    })
  }
  for (const label of input.otherHeld || []) {
    const id = "other:" + label
    if (rows.some((row) => row.id === id)) continue
    if (label === "None of these" || !acceptedHeldLabel(label)) continue
    rows.push({
      id,
      key: label,
      kind: "other",
      label,
      status: otherStatusWord(label, input.otherDetails?.[label]?.expiry, input.today),
    })
  }
  return rows
}

/** Known multi-select options stay in Notion. Typed names go in the existing text field. */
export function notionOtherTickets(held: string[] | undefined) {
  const known: string[] = []
  const custom: string[] = []
  for (const label of held || []) {
    if ((OTHER_TICKETS as readonly string[]).includes(label)) known.push(label)
    else if (label.trim()) custom.push(label.trim())
  }
  return { known, custom }
}
