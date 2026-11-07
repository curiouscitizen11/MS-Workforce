const SYDNEY = "Australia/Sydney"

export function sydneyToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SYDNEY,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  return utc.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso + "T00:00:00Z")
  const to = Date.parse(toIso + "T00:00:00Z")
  return Math.round((to - from) / 86400000)
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date)
}

export function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return value
  const hours = Number(match[1])
  const minutes = match[2]
  const suffix = hours >= 12 ? "pm" : "am"
  const hour12 = hours % 12 || 12
  return minutes === "00" ? `${hour12}:00 ${suffix}` : `${hour12}:${minutes} ${suffix}`
}

export function sydneyParts(now: Date): { iso: string; minutes: number; weekday: string } {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now)
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ""
  let hour = Number(get("hour"))
  if (hour === 24) hour = 0
  return {
    iso: get("year") + "-" + get("month") + "-" + get("day"),
    minutes: hour * 60 + Number(get("minute")),
    weekday: get("weekday"),
  }
}

export function instantInSydney(isoDate: string, time: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  let utc = Date.UTC(year, month - 1, day, hour, minute)
  for (let pass = 0; pass < 3; pass += 1) {
    const got = sydneyParts(new Date(utc))
    const [gotHour, gotMinute] = [Math.floor(got.minutes / 60), got.minutes % 60]
    const [gy, gm, gd] = got.iso.split("-").map(Number)
    const delta = Date.UTC(year, month - 1, day, hour, minute) - Date.UTC(gy, gm - 1, gd, gotHour, gotMinute)
    if (delta === 0) break
    utc += delta
  }
  return new Date(utc)
}

export function isMondayInSydney(now: Date): boolean {
  const weekday = new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY,
    weekday: "short",
  }).format(now)
  return weekday.startsWith("Mon")
}
