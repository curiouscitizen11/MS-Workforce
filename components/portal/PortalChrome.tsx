"use client"

import { usePathname } from "next/navigation"
import { PortalNav } from "@/components/portal/Nav"
import { SideMenu } from "@/components/portal/SideMenu"
import { hidePortalChrome } from "@/lib/portal/chrome"

export function PortalHeaderSlot({ name, role }: { name: string; role: "worker" | "admin" }) {
  const pathname = usePathname() || ""
  if (hidePortalChrome(pathname)) return <span className="portal-header-side" />
  return <SideMenu name={name} role={role} />
}

export function PortalBottomNav({ role }: { role: "worker" | "admin" }) {
  const pathname = usePathname() || ""
  if (hidePortalChrome(pathname)) return null
  return <PortalNav role={role} />
}
