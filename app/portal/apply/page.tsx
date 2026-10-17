import { ApplyForm } from "@/components/portal/ApplyForm"
import { Heading } from "@/components/portal/ui"

export default function ApplyPage() {
  return (
    <div className="space-y-4">
      <Heading kicker="Apply" title="Tell us about you" text="One short form. No tax, bank or super details." />
      <ApplyForm />
    </div>
  )
}
