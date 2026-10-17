import { InductionForm } from "@/components/portal/InductionForm"
import { Heading } from "@/components/portal/ui"
import { publicQuiz } from "@/lib/portal/induction"
import { requireUser } from "@/lib/portal/session"
import Link from "next/link"

export default async function InductionPage() {
  const { worker } = await requireUser()
  if (!worker.onboardingSubmitted) {
    return (
      <div className="space-y-4">
        <Heading kicker="Induction" title="Finish onboarding first" />
        <Link href="/portal/onboarding" className="pill pill-teal w-full">
          Go to onboarding
        </Link>
      </div>
    )
  }
  if (worker.inductionPassed) {
    return (
      <div className="space-y-4">
        <Heading kicker="Induction" title="You're done" text={"Passed " + worker.inductionPassed + " · score " + worker.inductionScore + "/8 · " + worker.inductionVersion} />
        <Link href="/portal" className="pill pill-teal w-full">
          Back home
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <Heading kicker="Induction" title="Safety basics v1.0" text="Read each question and tap the answer. You can try again." />
      <InductionForm questions={publicQuiz()} name={worker.name} />
    </div>
  )
}
