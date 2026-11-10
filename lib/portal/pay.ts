import { addDays, daysBetween, formatLongDate, instantInSydney, isThursday, parseCalendarDate, sydneyParts } from "@/lib/portal/dates"

export const MS_PHONE = "0435 842 164"
/** A Thursday. Each pay week runs from this weekday to the next Wednesday. */
export const DEFAULT_PAY_ANCHOR = "2026-11-05"

export type PayWeek = {
  start: string
  end: string
  payDay: string
  label: string
  afterCutoff: boolean
}

export function payAnchor(): string {
  const value = process.env.PORTAL_PAY_ANCHOR?.trim()
  const parsed = value ? parseCalendarDate(value) : null
  return parsed && isThursday(parsed) ? parsed : DEFAULT_PAY_ANCHOR
}

/** The Thursday-to-Wednesday week that contains this date. Pay day is the Thursday after it. */
export function weekContaining(isoDate: string, anchor = payAnchor()): PayWeek {
  const diff = daysBetween(anchor, isoDate)
  const index = Math.floor(diff / 7)
  const start = addDays(anchor, index * 7)
  const end = addDays(start, 6)
  return {
    start,
    end,
    payDay: addDays(end, 1),
    label: start + " to " + end,
    afterCutoff: false,
  }
}

export function payWeek(signedAt: Date, anchor = payAnchor()): PayWeek {
  const parts = sydneyParts(signedAt)
  const current = weekContaining(parts.iso, anchor)
  const cutoff = parts.iso === current.end && parts.minutes > 18 * 60
  if (!cutoff) return current
  const next = weekContaining(addDays(current.end, 1), anchor)
  return { ...next, afterCutoff: true }
}

export function cutoffMessage(week: PayWeek): string | null {
  if (!week.afterCutoff) return null
  return "Signed after the cut-off: this will be paid on " + formatLongDate(week.payDay) + "."
}

export function olderThanDays(workDate: string, today: string, days: number): boolean {
  return daysBetween(workDate, today) > days
}

export type ShiftReminder = "daily" | "cutoff" | null

export function timesheetReminder(input: {
  now: Date
  hasShiftToday: boolean
  signedToday: boolean
  remindersOff?: boolean
}): ShiftReminder {
  if (input.remindersOff || !input.hasShiftToday || input.signedToday) return null
  const parts = sydneyParts(input.now)
  const week = weekContaining(parts.iso)
  if (parts.iso === week.end && parts.minutes >= 16 * 60 + 30) return "cutoff"
  if (parts.minutes >= 15 * 60 + 30 && parts.minutes < 16 * 60 + 30) return "daily"
  return null
}

export function xeroCsv(rows: Array<{ employee: string; date: string; start: string; finish: string; breakMinutes: number; hours: number }>): string {
  const lines = ["employee,date,start,finish,break,hours"]
  for (const row of rows) {
    lines.push([csv(row.employee), row.date, row.start, row.finish, String(row.breakMinutes), String(row.hours)].join(","))
  }
  return lines.join("\n")
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"'
  return value
}

export function sydneyInstant(isoDate: string, time: string): Date {
  return instantInSydney(isoDate, time)
}

/** A submitted or approved sheet with a signature has already been logged. */
export function timesheetIsSigned(sheet: { status?: string; signaturePng?: string }): boolean {
  if (sheet.status === "Approved") return true
  return Boolean(sheet.signaturePng)
}

export function datesInWeek(week: PayWeek): string[] {
  const dates: string[] = []
  for (let day = 0; day < 7; day += 1) dates.push(addDays(week.start, day))
  return dates
}

/** The week being paid. On Thursday that is the week that ended yesterday, until 6pm on the closing Wednesday. */
export function payRunWeek(now: Date, anchor = payAnchor()): PayWeek {
  const parts = sydneyParts(now)
  const current = weekContaining(parts.iso, anchor)
  if (parts.iso === current.end && parts.minutes > 18 * 60) return current
  if (parts.weekday.startsWith("Thu")) return weekContaining(addDays(parts.iso, -1), anchor)
  return current
}
