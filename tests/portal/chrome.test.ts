import { describe, expect, it } from "vitest"
import { hidePortalChrome } from "@/lib/portal/chrome"

describe("portal chrome", () => {
  it("hides the menu and bottom bar on apply and both login screens", () => {
    expect(hidePortalChrome("/portal/apply")).toBe(true)
    expect(hidePortalChrome("/portal/join")).toBe(true)
    expect(hidePortalChrome("/portal/login")).toBe(true)
    expect(hidePortalChrome("/portal/login/admin")).toBe(true)
    expect(hidePortalChrome("/portal")).toBe(false)
    expect(hidePortalChrome("/portal/tickets")).toBe(false)
    expect(hidePortalChrome("/portal/me")).toBe(false)
    expect(hidePortalChrome("/portal/admin")).toBe(false)
  })
})
