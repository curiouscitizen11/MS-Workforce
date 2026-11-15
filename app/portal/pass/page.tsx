import type { Metadata } from "next"
import Link from "next/link"
import { Heading } from "@/components/portal/ui"
import { requireUser } from "@/lib/portal/session"

export const metadata: Metadata = { title: "Site pass" }

export default async function PassPlaceholder() {
  await requireUser()
  return (
    <div className="space-y-4">
      <Heading kicker="Site pass" title="Your worker ID card" />
      <div className="flex flex-col items-center px-4 pt-12 text-center">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#5d728c]" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <circle cx="10" cy="11" r="2" />
          <path d="M7.5 16c.6-1.4 1.6-2 2.5-2s1.9.6 2.5 2M15 10h2M15 13h2" />
        </svg>
        <p className="mt-4 text-base">Your card will show here.</p>
        <p className="mt-2 text-[13px] text-[#8fa1b6]">Builders scan it to check your tickets and training.</p>
        <Link href="/portal/me/photo" className="mt-4 inline-flex min-h-12 items-center text-sm font-semibold text-[#2ec4b6]">
          Add your photo
        </Link>
      </div>
    </div>
  )
}
