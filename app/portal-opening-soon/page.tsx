import type { Metadata } from "next"
import PortalOpeningSoon from "@/components/PortalOpeningSoon"

export const metadata: Metadata = {
  title: "Portal opening soon",
  robots: { index: false, follow: false },
}

export default function PortalOpeningSoonPage() {
  return <PortalOpeningSoon />
}
