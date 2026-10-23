import { sensitiveMessage } from "@/lib/portal/privacy"

export type TicketEntry = { number?: string; cardNumber?: string; expiry?: string; issued?: string; noExpiry?: boolean }

export const TRAINING_ITEMS = ["Asbestos awareness", "Silica awareness", "Manual handling"] as const

export function isTrainingItem(key: string) {
  return (TRAINING_ITEMS as readonly string[]).includes(key)
}

export function asksForExpiry(key: string) {
  return !isTrainingItem(key)
}

export function ticketNumberProblem(number: string, label = "licence or card number"): string | null {
  const value = number.trim()
  if (!value) return "Enter the " + label + "."
  if (value.length > 30) return "That number is too long."
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(value)) return "Use letters, numbers, spaces and dashes only."
  const sensitive = sensitiveMessage(value)
  if (sensitive) return sensitive
  return null
}

function issueDateProblem(issued: string | undefined, today: string): string | null {
  const value = (issued || "").trim()
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter the issue date."
  if (value > today) return "The issue date can't be in the future."
  return null
}

export function ticketEntryProblem(entry: TicketEntry, today: string, key = ""): string | null {
  const numberProblem = ticketNumberProblem(entry.number || "", key === "driverLicence" ? "licence number" : "licence or card number")
  if (numberProblem) return numberProblem
  if (key === "driverLicence") {
    const cardProblem = ticketNumberProblem(entry.cardNumber || "", "card number")
    if (cardProblem) return cardProblem
  }
  const issuedProblem = issueDateProblem(entry.issued, today)
  if (issuedProblem) return issuedProblem
  if (key && !asksForExpiry(key)) return null
  if (entry.noExpiry) return null
  if (!entry.expiry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiry)) {
    return "Enter the expiry date, or tick that there is no expiry date on this card."
  }
  if (entry.expiry < today) return "This ticket has expired. Choose 'Booked in for the course' or call MS Workforce."
  return null
}
