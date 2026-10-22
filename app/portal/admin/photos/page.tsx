import type { Metadata } from "next"
import { Heading } from "@/components/portal/ui"
import { requireAdmin } from "@/lib/portal/session"

export const metadata: Metadata = { title: "Photos to approve" }

export default async function PhotosPlaceholder() {
  await requireAdmin()
  return (
    <div className="space-y-4">
      <Heading kicker="Photos" title="Photos to approve" text="Headshots waiting for a check will show here." />
    </div>
  )
}
