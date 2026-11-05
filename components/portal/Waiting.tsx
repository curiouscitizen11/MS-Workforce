import Link from "next/link"
import { Card } from "@/components/portal/ui"

export function WaitingForApproval({ home = false, done = false, inductionPassed = false }: { home?: boolean; done?: boolean; inductionPassed?: boolean }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Waiting for approval</h2>
      {!done ? (
        <>
          <p className="mt-2 text-sm leading-relaxed">Finish your details before MS Workforce can check them.</p>
          <Link href="/portal/onboarding" className="pill pill-teal mt-3 w-full">
            Finish onboarding
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed">
            MS Workforce is checking your details and tickets and will call within 2 business days.
          </p>
          {inductionPassed ? null : (
            <Link href="/portal/induction" className="pill pill-teal mt-3 w-full">
              Do the safety induction
            </Link>
          )}
          {home ? null : (
            <Link href="/portal" className={"pill mt-3 w-full " + (inductionPassed ? "pill-teal" : "pill-line")}>
              Back to Home
            </Link>
          )}
        </>
      )}
    </Card>
  )
}
