"use client"

import { usePathname } from "next/navigation"
import Reveal from "@/components/Reveal"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  if (pathname.startsWith("/portal")) return children
  return (
    <div className="page-enter">
      {children}
      <Reveal />
    </div>
  )
}
