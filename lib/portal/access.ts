/** The real portal is on only when this is exactly "live". */
export function portalIsLive(): boolean {
  return process.env.PORTAL_MODE === "live"
}

/**
 * The demo is reachable in local development and on Vercel preview.
 * Production stays closed until PORTAL_MODE is live, so the public site
 * never shows demo mobiles, codes or sample workers.
 */
export function portalReachable(): boolean {
  if (portalIsLive()) return true
  if (process.env.NODE_ENV === "development") return true
  if (process.env.VERCEL_ENV === "preview") return true
  return false
}
