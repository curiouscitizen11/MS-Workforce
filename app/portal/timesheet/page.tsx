import { TimesheetForm } from "@/components/portal/TimesheetForm"
import { Heading } from "@/components/portal/ui"
import { sydneyToday } from "@/lib/portal/dates"
import { requireUser } from "@/lib/portal/session"
import { getStore } from "@/lib/portal/store"
import Link from "next/link"

export default async function TimesheetPage() {
  const { worker } = await requireUser()
  const store = await getStore()
  const today = sydneyToday()
  const offers = (await store.offers.all()).filter((offer) => offer.workerId === worker.id && offer.status === "Accepted")
  const shift = offers.find((offer) => offer.shiftDate === today) || offers[0]
  if (!shift) {
    return (
      <div className="space-y-4">
        <Heading kicker="Hours" title="No shift to log yet" text="Accept a shift first. Then come back at the end of the day." />
        <Link href="/portal/offers" className="pill pill-teal w-full">
          See offers
        </Link>
      </div>
    )
  }
  const [hour] = shift.startTime.split(":")
  const finishHour = String(Math.min(23, Number(hour) + shift.expectedHours)).padStart(2, "0")
  return (
    <div className="space-y-4">
      <Heading kicker="Hours" title="Log today's hours" text={shift.roleName + " · " + shift.suburb + ". No GPS."} />
      <TimesheetForm
        offerId={shift.id}
        workDate={shift.shiftDate}
        startDefault={shift.startTime}
        finishDefault={finishHour + ":00"}
        breakDefault={30}
      />
    </div>
  )
}
