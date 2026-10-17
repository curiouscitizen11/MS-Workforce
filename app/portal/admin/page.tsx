import Link from "next/link"
import { DemoBanner, Heading, StatusChip, badgeLevel } from "@/components/portal/ui"
import { isMock } from "@/lib/portal/config"
import { complianceFor } from "@/lib/portal/services"
import { sydneyToday } from "@/lib/portal/dates"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export default async function AdminHomePage() {
  await requireAdmin()
  const store = await getStore()
  const today = sydneyToday()
  const workers = (await store.workers.all()).filter((worker) => worker.role === "worker")
  const offers = await store.offers.all()
  const sheets = (await store.timesheets.all()).filter((sheet) => sheet.status === "Approved")
  const accepted = offers.filter((offer) => offer.status === "Accepted").length
  const waiting = offers.filter((offer) => offer.status === "Offered").length
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <Heading kicker="Admin" title="Mav's desk" text="Check tickets, send offers, and read signed hours." />
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="People" value={String(workers.length)} />
        <Stat label="Waiting" value={String(waiting)} />
        <Stat label="Signed" value={String(sheets.length)} />
      </div>
      <section className="space-y-2">
        {workers.map((worker) => {
          const check = complianceFor(worker, today)
          return (
            <Link key={worker.id} href={"/portal/admin/workers/" + worker.id} className="flex min-h-12 items-center justify-between gap-2 rounded-2xl border border-navy/10 bg-white px-3 py-2">
              <span>
                <span className="block text-sm font-semibold">{worker.name}</span>
                <span className="block text-xs text-navy/60">{worker.status}</span>
              </span>
              <StatusChip level={badgeLevel(check.badge)}>{check.label}</StatusChip>
            </Link>
          )
        })}
      </section>
      <p className="text-sm text-navy/70">
        {accepted} accepted · {waiting} still open
      </p>
      <Link href="/portal/admin/offers" className="pill pill-teal w-full">
        New shift offer
      </Link>
      <Link href="/portal/admin/timesheets" className="pill pill-line-dark w-full">
        Signed timesheets
      </Link>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-2 py-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/60">{label}</p>
    </div>
  )
}
