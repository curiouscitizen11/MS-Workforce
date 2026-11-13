import { describe, expect, it } from "vitest"
import { portalHomeLoginRedirect, sessionCookieValue } from "@/lib/portal/session"
import type { Session } from "@/lib/portal/types"

const session: Session = {
  id: "ses-1",
  workerId: "w-sam",
  role: "worker",
  createdAt: "2026-11-13T00:00:00.000Z",
  expiresAt: "2026-12-13T00:00:00.000Z",
}

describe("signed-out portal home", () => {
  it("sends a signed-out visitor to login and leaves a current session on the portal", () => {
    const now = Date.parse("2026-11-13T04:00:00.000Z")
    expect(portalHomeLoginRedirect("/portal", undefined, now)).toBe("/portal/login")
    expect(portalHomeLoginRedirect("/portal/", "", now)).toBe("/portal/login")
    expect(portalHomeLoginRedirect("/portal", "not-a-session", now)).toBe("/portal/login")
    const expired = sessionCookieValue({ ...session, expiresAt: "2026-11-01T00:00:00.000Z" })
    expect(portalHomeLoginRedirect("/portal", expired, now)).toBe("/portal/login")
    expect(portalHomeLoginRedirect("/portal", sessionCookieValue(session), now)).toBeNull()
    expect(portalHomeLoginRedirect("/portal/login", undefined, now)).toBeNull()
    expect(portalHomeLoginRedirect("/portal/offers", undefined, now)).toBeNull()
  })
})
