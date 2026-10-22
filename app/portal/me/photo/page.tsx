import type { Metadata } from "next"
import { Heading } from "@/components/portal/ui"
import { requireUser } from "@/lib/portal/session"

export const metadata: Metadata = { title: "My photo" }

export default async function PhotoPlaceholder() {
  const { worker } = await requireUser()
  if (worker.role === "admin") return <Heading kicker="Photo" title="Workers add their own photo" />
  return (
    <div className="space-y-4">
      <Heading kicker="My photo" title="Your headshot" text="A clear photo of your face, looking at the camera. No sunglasses, hat or hard hat. Plain background if you can." />
    </div>
  )
}
