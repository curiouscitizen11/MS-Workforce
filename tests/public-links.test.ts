import { afterEach, describe, expect, it, vi } from "vitest"
import { portalIsLive, portalReachable } from "@/lib/portal/access"
import { applyForWorkHref, bookLabourHref } from "@/lib/public-links"
import { REQUEST_LABOUR_HREF, WORK_ENQUIRY_HREF } from "@/components/site"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("public links while the portal is closed", () => {
  it("sends builders and workers to the existing email addresses", () => {
    vi.stubEnv("PORTAL_MODE", "")
    expect(portalIsLive()).toBe(false)
    expect(bookLabourHref()).toBe(REQUEST_LABOUR_HREF)
    expect(bookLabourHref()).toContain("mailto:hello@msworkforce.au")
    expect(applyForWorkHref()).toBe(WORK_ENQUIRY_HREF)
    expect(applyForWorkHref()).toContain("mailto:jobs@msworkforce.au")
    expect(applyForWorkHref()).not.toContain("/portal")
    expect(applyForWorkHref()).not.toContain("notion")
  })

  it("uses the portal pages only when PORTAL_MODE is live", () => {
    vi.stubEnv("PORTAL_MODE", "live")
    expect(bookLabourHref()).toBe("/portal/book-labour")
    expect(applyForWorkHref()).toBe("/portal/join")
  })

  it("keeps the demo off production and on for local dev and preview", () => {
    vi.stubEnv("PORTAL_MODE", "")
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_ENV", "")
    expect(portalReachable()).toBe(false)

    vi.stubEnv("NODE_ENV", "development")
    expect(portalReachable()).toBe(true)

    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("VERCEL_ENV", "preview")
    expect(portalReachable()).toBe(true)

    vi.stubEnv("PORTAL_MODE", "live")
    vi.stubEnv("VERCEL_ENV", "production")
    expect(portalReachable()).toBe(true)
  })
})