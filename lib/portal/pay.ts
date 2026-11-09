import { addDays, daysBetween, instantInSydney, sydneyParts } from "@/lib/portal/dates"

export const MS_PHONE = "0435 842 164"
export const DEFAULT_PAY_ANCHOR = "2026-11-05"

export type Fortnight = {
  start: string
  end: string
  payDay: string
  label: string
  afterCutoff: boolean
}

export function payAnchor(): string {
  const value = process.env.PORTAL_PAY_ANCHOR
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : DEFAULT_PAY_ANCHOR
}

export function fortnightContaining(isoDate: string, anchor = payAnchor()): Fortnight {
  const diff = daysBetween(anchor, isoDate)
  const index = Math.floor(diff / 14)
  const start = addDays(anchor, index * 14)
  const end = addDays(start, 13)
  return {
    start,
    end,
    payDay: addDays(end, 1),
    label: start + " to " + end,
    afterCutoff: false,
  }
}

export function payFortnight(signedAt: Date, anchor = payAnchor()): Fortnight {
  const parts = sydneyParts(signedAt)
  const current = fortnightContaining(parts.iso, anchor)
  const cutoff = parts.iso === current.end && parts.minutes > 18 * 60
  if (!cutoff) return current
  const next = fortnightContaining(addDays(current.end, 1), anchor)
  return { ...next, afterCutoff: true }
}

export function cutoffMessage(fortnight: Fortnight): string | null {
  if (!fortnight.afterCutoff) return null
  return "Signed after the cut-off: this will be paid on Thursday " + fortnight.payDay + "."
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
  const fortnight = fortnightContaining(parts.iso)
  if (parts.iso === fortnight.end && parts.minutes >= 16 * 60 + 30) return "cutoff"
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

export function datesInFortnight(fortnight: Fortnight): string[] {
  const dates: string[] = []
  for (let day = 0; day < 14; day += 1) dates.push(addDays(fortnight.start, day))
  return dates
}

export function payRunFortnight(now: Date, anchor = payAnchor()): Fortnight {
  const parts = sydneyParts(now)
  const current = fortnightContaining(parts.iso, anchor)
  if (parts.iso === current.end && parts.minutes > 18 * 60) return current
  if (parts.weekday.startsWith("Thu")) return fortnightContaining(addDays(parts.iso, -1), anchor)
  return current
}
