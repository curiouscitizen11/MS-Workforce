import { addDays, daysBetween, sydneyToday } from "@/lib/portal/dates"

export type SheetMark = "approved" | "submitted" | "queried" | "unsigned" | "future" | "none"

export type CalendarOffer = {
  id: string
  workerId: string
  status: string
  shiftDate: string
  startTime: string
  roleName: string
  suburb: string
  siteName?: string
  address?: string
}

export type CalendarSheet = {
  id: string
  workerId: string
  offerId?: string
  workDate: string
  status: string
  totalHours: number
  signaturePng?: string
}

export function monthKey(isoDate: string) {
  return isoDate.slice(0, 7)
}

export function shiftMonth(month: string, delta: number) {
  const [year, mon] = month.split("-").map(Number)
  const utc = new Date(Date.UTC(year, mon - 1 + delta, 1))
  return utc.getUTCFullYear() + "-" + String(utc.getUTCMonth() + 1).padStart(2, "0")
}

export function daysInMonth(month: string) {
  return daysBetween(month + "-01", shiftMonth(month, 1) + "-01")
}

export function monthCells(month: string): (string | null)[] {
  if (!/^\d{4}-\d{2}$/.test(month)) return []
  const first = month + "-01"
  const [year, mon, day] = first.split("-").map(Number)
  const lead = (new Date(Date.UTC(year, mon - 1, day)).getUTCDay() + 6) % 7
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  const count = daysInMonth(month)
  for (let index = 0; index < count; index += 1) cells.push(addDays(first, index))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function monthTitle(month: string) {
  const [year, mon] = month.split("-").map(Number)
  return new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, mon - 1, 1)))
}

export function longDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(",", "")
}

export function sheetMark(shiftDate: string, today: string, sheet?: CalendarSheet | null): SheetMark {
  if (shiftDate > today) return "future"
  if (!sheet || sheet.status === "Draft") return "unsigned"
  if (sheet.status === "Approved") return "approved"
  if (sheet.status === "Submitted") return "submitted"
  if (sheet.status === "Queried") return "queried"
  return "unsigned"
}

export function dayEntries(offers: CalendarOffer[], sheets: CalendarSheet[], workerId: string, date: string, today: string) {
  const shifts = offers.filter(
    (offer) => offer.workerId === workerId && offer.shiftDate === date && (offer.status === "Accepted" || offer.status === "Offered"),
  )
  const used = new Set<string>()
  return shifts.map((offer) => {
    const sheet =
      sheets.find((item) => item.workerId === workerId && item.offerId === offer.id && !used.has(item.id)) ||
      (shifts.length === 1
        ? sheets.find((item) => item.workerId === workerId && item.workDate === date && item.status !== "Draft" && !used.has(item.id))
        : undefined)
    if (sheet) used.add(sheet.id)
    const mark = offer.status === "Offered" ? "none" : sheetMark(date, today, sheet)
    return { offer, sheet: sheet && sheet.status !== "Draft" ? sheet : null, mark }
  })
}

export function cellMarks(entries: { offer: CalendarOffer; mark: SheetMark }[]) {
  const marks = entries.map((entry) => entry.mark)
  const mark: SheetMark = marks.includes("unsigned")
    ? "unsigned"
    : marks.includes("queried")
      ? "queried"
      : marks.includes("submitted")
        ? "submitted"
        : marks.includes("approved")
          ? "approved"
          : marks.includes("future")
            ? "future"
            : "none"
  return {
    accepted: entries.some((entry) => entry.offer.status === "Accepted"),
    offered: entries.some((entry) => entry.offer.status === "Offered"),
    mark,
  }
}

export function dayAria(date: string, entries: { offer: CalendarOffer; mark: SheetMark }[], today: string) {
  const when = longDate(date) + (date === today ? ". Today" : "")
  if (!entries.length) return when + ". Nothing on this day."
  const parts = entries.map((entry) => {
    const place = entry.offer.siteName || entry.offer.suburb
    const kind = entry.offer.status === "Offered" ? "Offer" : "Shift"
    const sheet =
      entry.mark === "approved"
        ? " Timesheet approved."
        : entry.mark === "submitted"
          ? " Timesheet submitted."
          : entry.mark === "queried"
            ? " Timesheet queried."
            : entry.mark === "unsigned"
              ? " Not signed."
              : ""
    return kind + " at " + place + "." + sheet
  })
  return when + ". " + parts.join(" ")
}

export function resolveView(monthParam: string | undefined, dayParam: string | undefined, today = sydneyToday()) {
  const current = monthKey(today)
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : current
  const cells = monthCells(month)
  const day = dayParam && cells.includes(dayParam) ? dayParam : month === current ? today : null
  return { month, day, today }
}
