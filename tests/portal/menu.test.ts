import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PortalMenuPanel } from "@/components/portal/SideMenu"

const workerLabels = [
  "Tickets &amp; training",
  "Inductions",
  "Safety info",
  "Preferences",
  "Help / contact MS Workforce",
  "Log out",
]

describe("portal side menu", () => {
  it("lists the worker extras and keeps the menu closed until it is opened", () => {
    const open = renderToStaticMarkup(
      createElement(PortalMenuPanel, { name: "Sam Lee", role: "worker", pathname: "/portal/tickets", onClose: () => undefined, onLogout: () => undefined }),
    )
    expect(open).toContain("Signed in as")
    expect(open).toContain("Sam Lee")
    let at = 0
    for (const label of workerLabels) {
      const next = open.indexOf(label, at)
      expect(next).toBeGreaterThan(-1)
      at = next + label.length
    }
    expect(open).toContain('href="/portal/tickets"')
    expect(open).toContain('href="/portal/inductions"')
    expect(open).toContain('href="/portal/me#safety"')
    expect(open).toContain('href="/portal/me#preferences"')
    expect(open).toContain('href="/portal/help"')
    expect(open).not.toContain(">Home<")
    expect(open).not.toContain(">Shifts<")
    expect(open).not.toContain(">Hours<")
    expect(open).not.toContain(">Me<")
    expect(open).not.toContain('href="/portal/offers"')
    expect(open).not.toContain('href="/portal/timesheet"')
    expect(open).toContain("portal-menu-close")
    expect(open).toContain("portal-menu-overlay")
    expect(open).toContain('aria-current="page"')
    expect(open).toContain('href="/portal/tickets"')
    const admin = renderToStaticMarkup(
      createElement(PortalMenuPanel, { name: "Marek", role: "admin", pathname: "/portal/admin/offers", onClose: () => undefined, onLogout: () => undefined }),
    )
    for (const label of ["Home", "Shifts", "Hours", "Me", "Preferences", "Log out"]) expect(admin).toContain(label)
    expect(admin).not.toContain("Tickets &amp; training")
    expect(admin).not.toContain("Safety info")
    expect(admin).not.toContain("Help / contact MS Workforce")
    expect(admin).toContain('aria-current="page"')
    expect(admin).toContain('href="/portal/admin/offers"')
  })
})
