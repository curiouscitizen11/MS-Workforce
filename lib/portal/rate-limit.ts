export function createRateGate(minIntervalMs: number) {
  let nextAt = 0
  return async function gate(nowMs: number, sleep: (ms: number) => Promise<void>) {
    const wait = Math.max(0, nextAt - nowMs)
    nextAt = Math.max(nextAt, nowMs) + minIntervalMs
    if (wait > 0) await sleep(wait)
    return wait
  }
}

export function retryAfterMs(status: number, header: string | null, fallbackMs = 1000): number | null {
  if (status !== 429) return null
  if (!header) return fallbackMs
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000)
  const when = Date.parse(header)
  if (Number.isFinite(when)) return Math.max(0, when - Date.now())
  return fallbackMs
}
