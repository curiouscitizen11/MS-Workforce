import type { Metadata } from "next"
import { BookLabourForm } from "@/components/portal/BookLabourForm"
import { Heading } from "@/components/portal/ui"

export const metadata: Metadata = { title: "Book labour" }

export default function BookLabourPage() {
  return (
    <div className="space-y-4">
      <Heading
        kicker="Book labour"
        title="Book labour"
        text="Need reliable hands on site? Tell us what you need and we'll call you back, usually the same business day, to confirm availability and rates. We supply construction labour across Greater Sydney."
      />
      <BookLabourForm />
    </div>
  )
}
