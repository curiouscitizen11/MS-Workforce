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
        text="Need reliable hands on site? Tell us what you need and we'll call you back to confirm availability and rates. Replies within one business hour, Mon–Fri, 6am–5pm."
      />
      <BookLabourForm />
    </div>
  )
}
