export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
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

export function hoursWarnings(hours: number): string[] {
  const warnings: string[] = []
  if (hours > 12) warnings.push("That's more than 12 hours. Check the times with your supervisor.")
  if (hours < 2) warnings.push("That's under 2 hours. Check the times with your supervisor.")
  return warnings
}
