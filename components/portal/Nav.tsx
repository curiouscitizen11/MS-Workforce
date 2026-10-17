"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const workerItems = [
  { href: "/portal", label: "Home" },
  { href: "/portal/offers", label: "Offers" },
  { href: "/portal/timesheet", label: "Hours" },
  { href: "/portal/tickets", label: "Tickets" },
]

const adminItems = [
  { href: "/portal/admin", label: "Home" },
  { href: "/portal/admin/offers", label: "Offers" },
  { href: "/portal/admin/timesheets", label: "Hours" },
  { href: "/portal/account", label: "Account" },
]

export function PortalNav({ role }: { role: "worker" | "admin" }) {
  const pathname = usePathname() || ""
  const items = role === "admin" ? adminItems : workerItems
  return (
    <nav
      aria-label="Portal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map((item) => {
          const current = item.href === "/portal" || item.href === "/portal/admin" ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={
                  "flex min-h-12 items-center justify-center text-[13px] font-semibold " +
                  (current ? "text-teal-600" : "text-navy/70")
                }
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
