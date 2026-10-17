import type { Metadata } from "next"
import { OnboardingForm } from "@/components/portal/OnboardingForm"
import { Heading } from "@/components/portal/ui"
import { requireUser } from "@/lib/portal/session"
import { redirect } from "next/navigation"

export const metadata: Metadata = { title: "Your details" }

export default async function OnboardingPage() {
  const { worker } = await requireUser()
  if (worker.role === "admin") redirect("/portal/admin")
  return (
    <div className="space-y-4">
      <Heading kicker="Onboarding" title="Your details" text="You can stop and come back. We save each step." />
      <OnboardingForm worker={worker} />
    </div>
  )
}
