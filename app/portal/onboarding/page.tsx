import type { Metadata } from "next"
import { OnboardingForm } from "@/components/portal/OnboardingForm"
import { Heading } from "@/components/portal/ui"
import { sydneyToday } from "@/lib/portal/dates"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Your details" }

export default async function OnboardingPage() {
  const { worker } = await requireUser()
  if (worker.role === "admin") redirect("/portal/admin")
  const store = await getStore()
  const photos = (await store.documents.all())
    .filter((doc) => doc.workerId === worker.id && doc.kind === "ticket" && !doc.deletedAt && doc.licenceKey && doc.side)
    .map((doc) => ({ key: doc.licenceKey as string, side: doc.side as "front" | "back" }))
  return (
    <div className="space-y-4">
      <Heading kicker="Onboarding" title="Your details" text="You can stop and come back. We save each step." />
      <OnboardingForm worker={worker} photos={photos} today={sydneyToday()} />
    </div>
  )
}
