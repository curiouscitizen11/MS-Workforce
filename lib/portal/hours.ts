export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export const STANDARD_BREAK_MINUTES = 30
const SHORT_SHIFT_MINUTES = 4 * 60

export function breakChoiceProblem(input: {
  start: string
  finish: string
  breakMinutes: number
  breakStart?: string
}): string | null {
  const startMin = parseTime(input.start)
  const finishMin = parseTime(input.finish)
  if (startMin === null || finishMin === null) return null
  const span = finishMin - startMin
  if (span <= 0) return null
  const minutes = input.breakMinutes
  const short = span < SHORT_SHIFT_MINUTES
  if (short) {
    if (minutes !== 0 && minutes !== STANDARD_BREAK_MINUTES) {
      return "Choose no break, or a 30-minute unpaid break."
    }
  } else if (minutes !== STANDARD_BREAK_MINUTES) {
    return "Shifts of 4 hours or more need a 30-minute unpaid break."
  }
  if (minutes === 0) return null
  const breakStart = (input.breakStart || "").trim()
  if (!breakStart) return "Enter the break start time."
  const breakMin = parseTime(breakStart)
  if (breakMin === null) return "Enter the break start as a time, like 12:00."
  if (breakMin % 15 !== 0) return "Use 15-minute steps for the break start."
  if (breakMin < startMin || breakMin + STANDARD_BREAK_MINUTES > finishMin) {
    return "The break needs to start during the shift and finish before you clock off."
  }
  return null
}

export function formatBreak(minutes: number, breakStart?: string): string {
  if (minutes === 0) return "No break"
  if (minutes === STANDARD_BREAK_MINUTES) {
    return breakStart ? "30-minute break from " + breakStart : "30-minute break"
  }
  return minutes + " min"
}

export function paidHours(
  start: string,
  finish: string,
  breakMinutes: number,
): { ok: true; hours: number } | { ok: false; error: string } {
  const startMin = parseTime(start)
  const finishMin = parseTime(finish)
  if (startMin === null || finishMin === null) {
    return { ok: false, error: "Enter start and finish as times, like 07:00." }
  }
  if (!Number.isFinite(breakMinutes) || breakMinutes < 0 || breakMinutes > 600) {
    return { ok: false, error: "Enter the unpaid break in minutes." }
  }
  const span = finishMin - startMin
  if (span <= 0) {
    return { ok: false, error: "Finish time needs to be after the start time." }
  }
  const paid = span - breakMinutes
  if (paid <= 0) {
    return { ok: false, error: "The break is as long as the shift. Check the times." }
  }
  const hours = Math.round((paid / 60) * 100) / 100
  return { ok: true, hours }
}

export type HoursWarning = { level: "warn" | "confirm"; message: string }

export function onQuarterHour(value: string): boolean {
  const minutes = parseTime(value)
  return minutes !== null && minutes % 15 === 0
}

export function formatHours(hours: number): string {
  return hours.toFixed(1)
}

export function hoursWarnings(hours: number): HoursWarning[] {
  const warnings: HoursWarning[] = []
  if (hours > 12) {
    warnings.push({ level: "confirm", message: "That's more than 12 hours. Confirm the times before you hand the phone over." })
  } else if (hours > 10) {
    warnings.push({ level: "warn", message: "That's more than 10 hours. Check the times with your supervisor." })
  }
  if (hours < 4) {
    warnings.push({ level: "confirm", message: "That's under 4 hours. Confirm the times before you hand the phone over." })
  }
  return warnings
}
