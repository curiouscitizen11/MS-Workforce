import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PortalMenuPanel } from "@/components/portal/SideMenu"

describe("portal side menu", () => {
  it("lists the worker pages and keeps the menu closed until it is opened", () => {
    const open = renderToStaticMarkup(
      createElement(PortalMenuPanel, { name: "Sam Lee", role: "worker", pathname: "/portal", onClose: () => undefined, onLogout: () => undefined }),
    )
    expect(open).toContain("Signed in as")
    expect(open).toContain("Sam Lee")
    for (const label of ["Home", "Shifts", "Hours", "Me", "Tickets &amp; training", "Inductions", "Preferences", "Log out", "Close"]) {
      expect(open).toContain(label)
    }
    expect(open).toContain('href="/portal/offers"')
    expect(open).toContain('href="/portal/timesheet"')
    expect(open).toContain('href="/portal/inductions"')
    expect(open).toContain("portal-menu-close")
    expect(open).toContain("portal-menu-overlay")
    expect(open).toContain('aria-current="page" class="portal-menu-row" href="/portal"')
    const admin = renderToStaticMarkup(
      createElement(PortalMenuPanel, { name: "Mav", role: "admin", pathname: "/portal/admin/offers", onClose: () => undefined, onLogout: () => undefined }),
    )
    expect(admin).not.toContain("Tickets &amp; training")
    expect(admin).toContain('aria-current="page" class="portal-menu-row" href="/portal/admin/offers"')
  })
})
