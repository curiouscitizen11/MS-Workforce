"use client"

import { useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { logOut } from "@/app/portal/actions"

type Item = { href: string; label: string; icon: "home" | "shifts" | "hours" | "me" | "tickets" | "inductions" | "preferences" }

const workerItems: Item[] = [
  { href: "/portal", label: "Home", icon: "home" },
  { href: "/portal/offers", label: "Shifts", icon: "shifts" },
  { href: "/portal/timesheet", label: "Hours", icon: "hours" },
  { href: "/portal/me", label: "Me", icon: "me" },
  { href: "/portal/tickets", label: "Tickets & training", icon: "tickets" },
  { href: "/portal/inductions", label: "Inductions", icon: "inductions" },
  { href: "/portal/me#preferences", label: "Preferences", icon: "preferences" },
]

const adminItems: Item[] = [
  { href: "/portal/admin", label: "Home", icon: "home" },
  { href: "/portal/admin/offers", label: "Shifts", icon: "shifts" },
  { href: "/portal/admin/timesheets", label: "Hours", icon: "hours" },
  { href: "/portal/me", label: "Me", icon: "me" },
  { href: "/portal/me#preferences", label: "Preferences", icon: "preferences" },
]

function isCurrent(href: string, pathname: string) {
  if (href.includes("#")) return false
  if (href === "/portal" || href === "/portal/admin") return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

export function PortalMenuPanel({
  name,
  role,
  pathname,
  onClose,
  onLogout,
}: {
  name: string
  role: "worker" | "admin"
  pathname: string
  onClose: () => void
  onLogout: () => void
}) {
  const titleId = useId()
  const items = role === "admin" ? adminItems : workerItems
  return (
    <div className="portal-menu-overlay" onClick={onClose}>
      <div
        id="portal-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="portal-menu-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="portal-menu-who">
          <div>
            <p className="portal-menu-kicker">Signed in as</p>
            <p id={titleId} className="portal-menu-name">
              {name}
            </p>
          </div>
          <button type="button" className="portal-menu-close" onClick={onClose}>
            Close
          </button>
        </div>
        <nav aria-label="Main">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href, pathname) ? "page" : undefined}
              className="portal-menu-row"
              onClick={onClose}
            >
              <RowIcon name={item.icon} />
              <span>{item.label}</span>
              <span className="portal-menu-chev" aria-hidden="true">
                ›
              </span>
            </Link>
          ))}
          <button type="button" className="portal-menu-row" onClick={onLogout}>
            <RowIcon name="logout" />
            <span>Log out</span>
            <span className="portal-menu-chev" aria-hidden="true">
              ›
            </span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export function SideMenu({ name, role, initialOpen = false }: { name: string; role: "worker" | "admin"; initialOpen?: boolean }) {
  const pathname = usePathname() || ""
  const router = useRouter()
  const [open, setOpen] = useState(initialOpen)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const menuButton = buttonRef.current
    const panel = panelRef.current
    const previous = document.activeElement
    const focusable = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>("a, button")).filter((node) => !node.hasAttribute("disabled")) : []
    focusable()[0]?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        return
      }
      if (event.key !== "Tab") return
      const nodes = focusable()
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
      if (previous instanceof HTMLElement && previous !== menuButton) previous.focus()
      else menuButton?.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="portal-menu-button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="portal-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <MenuIcon />
      </button>
      {open ? (
        <div ref={panelRef}>
          <PortalMenuPanel
            name={name}
            role={role}
            pathname={pathname}
            onClose={() => setOpen(false)}
            onLogout={() => {
              void logOut().then(() => {
                router.push("/portal/login")
                router.refresh()
              })
            }}
          />
        </div>
      ) : null}
    </>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function RowIcon({ name }: { name: Item["icon"] | "logout" }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  }
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 11.5 12 5l8 6.5V20H4z" />
        <path d="M10 20v-6h4v6" />
      </svg>
    )
  }
  if (name === "shifts") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" />
        <path d="M8 3.5v3M16 3.5v3M4 9h16" />
      </svg>
    )
  }
  if (name === "hours") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5l3 2" />
      </svg>
    )
  }
  if (name === "me") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.2-3 3.4-4.5 7-4.5S17.8 16 19 19" />
      </svg>
    )
  }
  if (name === "tickets") {
    return (
      <svg {...common}>
        <path d="M7 4h8l3 3v13H7z" />
        <path d="M15 4v3h3M9 12h6M9 16h4" />
      </svg>
    )
  }
  if (name === "inductions") {
    return (
      <svg {...common}>
        <path d="M12 4 5 7v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V7z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  }
  if (name === "preferences") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.5 6.5l1.5 1.5M16 16l1.5 1.5M17.5 6.5 16 8M8 16l-1.5 1.5" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M9 7V5H5v14h4v-2" />
      <path d="M10 12h9M16 9l3 3-3 3" />
    </svg>
  )
}
