import type { Metadata } from "next"
import Link from "next/link"
import { DemoBanner, Heading, StatusChip, badgeLevel } from "@/components/portal/ui"
import { HoursIcon, PhotoIcon, ShiftsIcon, TicketsIcon, Tile, WorkersIcon } from "@/components/portal/Tiles"
import { isMock } from "@/lib/portal/config"
import { complianceFor } from "@/lib/portal/services"
import { sydneyToday } from "@/lib/portal/dates"
import { cardsAwaitingCheck, photosAwaitingApproval, waitingForApproval } from "@/lib/portal/home"
import { requireAdmin } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"

export const metadata: Metadata = { title: "Admin desk" }

export default async function AdminHomePage() {
  await requireAdmin()
  const store = await getStore()
  const today = sydneyToday()
  const workers = (await store.workers.all()).filter((worker) => worker.role === "worker")
  const offers = await store.offers.all()
  const sheets = (await store.timesheets.all()).filter((sheet) => sheet.status === "Approved")
  const docs = await store.documents.all()
  const accepted = offers.filter((offer) => offer.status === "Accepted").length
  const waiting = offers.filter((offer) => offer.status === "Offered").length
  const toCheck = cardsAwaitingCheck(workers)
  const photos = photosAwaitingApproval(docs)
  const waitingPeople = waitingForApproval(workers)
  return (
    <div className="space-y-4">
      <DemoBanner mock={isMock()} />
      <Heading kicker="Admin" title="Admin desk" text="Check tickets, send offers, and read signed hours." />
      {waitingPeople.length ? (
        <section className="portal-panel space-y-2">
          <p className="text-sm font-semibold">
            <StatusChip level="pending">{waitingPeople.length} waiting for approval</StatusChip>
          </p>
          <ul className="space-y-1">
            {waitingPeople.slice(0, 5).map((person) => (
              <li key={person.id}>
                <Link href={"/portal/admin/workers/" + person.id} className="block min-h-12 py-2 text-sm font-semibold">
                  {person.name}
                </Link>
              </li>
            ))}
          </ul>
          {waitingPeople.length > 5 ? (
            <a className="text-sm font-semibold text-teal-600 underline" href="#people">
              See all
            </a>
          ) : null}
        </section>
      ) : null}
      <div className="portal-grid">
        <Tile href="/portal/admin/offers" label="Offers" count={waiting} countLabel={waiting + " offers waiting"} icon={<ShiftsIcon />} />
        <Tile href="/portal/admin/timesheets" label="Hours" count={sheets.length} countLabel={sheets.length + " signed"} icon={<HoursIcon />} />
        <Tile href="#people" label="Tickets to check" count={toCheck} countLabel={toCheck + " to check"} icon={<TicketsIcon />} />
        <Tile href="/portal/admin/photos" label="Photos to approve" count={photos} countLabel={photos + " photos to approve"} icon={<PhotoIcon />} />
        <Tile href="#people" label="Workers" count={workers.length} countLabel={workers.length + " workers"} icon={<WorkersIcon />} />
      </div>
      <section id="people" className="space-y-2">
        {workers.map((worker) => {
          const check = complianceFor(worker, today)
          return (
            <Link key={worker.id} href={"/portal/admin/workers/" + worker.id} className="flex min-h-12 items-center justify-between gap-2 rounded-2xl border border-navy/10 bg-white px-3 py-2">
              <span>
                <span className="block text-sm font-semibold">{worker.name}</span>
                <span className="block text-xs text-navy/70">{worker.status}</span>
              </span>
              <StatusChip level={badgeLevel(check.badge)}>{check.label}</StatusChip>
            </Link>
          )
        })}
      </section>
      <p className="text-sm text-navy/70">
        {accepted} accepted · {waiting} still open
      </p>
    </div>
  )
}
