import { sensitiveMessage } from "@/lib/portal/privacy"

export type TicketEntry = { number?: string; expiry?: string; noExpiry?: boolean }

export const TRAINING_ITEMS = ["Asbestos awareness", "Silica awareness"] as const

export function isTrainingItem(key: string) {
  return (TRAINING_ITEMS as readonly string[]).includes(key)
}

export function asksForExpiry(key: string) {
  return !isTrainingItem(key)
}

export function ticketNumberProblem(number: string): string | null {
  const value = number.trim()
  if (!value) return "Enter the number on the card."
  if (value.length > 30) return "That number is too long."
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(value)) return "Use letters, numbers, spaces and dashes only."
  const sensitive = sensitiveMessage(value)
  if (sensitive) return sensitive
  return null
}

export function ticketEntryProblem(entry: TicketEntry, today: string, key = ""): string | null {
  const numberProblem = ticketNumberProblem(entry.number || "")
  if (numberProblem) return numberProblem
  if (key && !asksForExpiry(key)) return null
  if (entry.noExpiry) return null
  if (!entry.expiry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiry)) {
    return "Enter the expiry date, or tick that this card doesn't expire."
  }
  if (entry.expiry < today) return "This ticket has expired. Choose 'Booked in for the course' or call MS Workforce."
  return null
}
