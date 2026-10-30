import type { Metadata } from "next"
import { WaitingForApproval } from "@/components/portal/Waiting"
import { Heading, StatusChip } from "@/components/portal/ui"
import { formatDate, formatTime } from "@/lib/portal/dates"
import { adminMobile } from "@/lib/portal/config"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import { notFound } from "next/navigation"
import Link from "next/link"

export const metadata: Metadata = { title: "Shift" }

export default async function ShiftPage({ params }: { params: { id: string } }) {
  const { worker } = await requireUser()
  if (worker.role !== "admin" && (worker.status === "Applicant" || worker.status === "Onboarding")) {
    return (
      <div className="space-y-4">
        <WaitingForApproval done={Boolean(worker.onboardingSubmitted)} inductionPassed={Boolean(worker.inductionPassed)} />
      </div>
    )
  }
  const offer = await (await getStore()).offers.get(params.id)
  if (!offer || (worker.role !== "admin" && offer.workerId !== worker.id)) notFound()
  if (offer.status !== "Accepted") notFound()
  const maps = offer.address ? "https://maps.google.com/?q=" + encodeURIComponent(offer.address) : ""
  return (
    <div className="space-y-4">
      <Heading kicker="Site" title={offer.siteName || offer.suburb} text={formatDate(offer.shiftDate) + " · " + formatTime(offer.startTime)} />
      <StatusChip level="ok">Accepted</StatusChip>
      {offer.address ? (
        <section className="rounded-2xl bg-white p-4 text-sm leading-relaxed">
          <p className="font-semibold">{offer.address}</p>
          <a className="mt-2 inline-flex min-h-12 items-center font-semibold text-teal-600 underline" href={maps}>
            Open in Maps
          </a>
        </section>
      ) : (
        <p className="rounded-2xl bg-[#FEF3C7] px-4 py-3 text-sm font-semibold text-[#B45309]">Site details to come.</p>
      )}
      {offer.siteContact ? (
        <p className="text-sm">
          {offer.siteContact}
          {offer.sitePhone ? (
            <>
              {" · "}
              <a className="font-semibold text-teal-600 underline" href={"tel:" + offer.sitePhone}>
                {offer.sitePhone}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      <dl className="space-y-2 rounded-2xl bg-white p-4 text-sm">
        {offer.inductionMethod ? <Row label="Induction" value={offer.inductionMethod} /> : null}
        {offer.inductionLink ? <Row label="Induction link" value={offer.inductionLink} href={offer.inductionLink} /> : null}
        {offer.signInMethod ? <Row label="Sign in" value={offer.signInMethod} /> : null}
        {offer.highRisk ? <Row label="Watch for" value={offer.highRisk} /> : null}
        {offer.parking ? <Row label="Parking" value={offer.parking} /> : null}
        {offer.bring ? <Row label="Bring" value={offer.bring} /> : null}
      </dl>
      <a className="pill pill-line-dark w-full" href={"tel:" + adminMobile()}>
        Running late — call MS Workforce
      </a>
      <Link href="/portal/timesheet" className="pill pill-teal w-full">
        Log hours
      </Link>
    </div>
  )
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/50">{label}</dt>
      <dd>
        {href ? (
          <a className="font-semibold text-teal-600 underline" href={href}>
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
