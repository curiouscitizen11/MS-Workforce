"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { flagTicketMismatch, markTicketChecked } from "@/app/portal/actions"
import { fieldClass } from "@/components/portal/ui"

export type TicketCheckItem = {
  key: string
  label: string
  number: string
  expiry: string
  checkedBy?: string
  checkedAtLabel?: string
  photosDeletedAt?: string
  frontUrl?: string
  backUrl?: string
  ready: boolean
}

export function TicketCheckList({ workerId, items }: { workerId: string; items: TicketCheckItem[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Check tickets and licences</h2>
      <p className="text-sm leading-relaxed text-navy/80">
        The worker typed the number and the expiry. Check them against the photos, and correct them if the card says something else. Both photos are deleted 7 days after you mark the card checked. The number, expiry, and who checked it stay on file.
      </p>
      {items.length ? items.map((item) => <TicketCheckCard key={item.key} workerId={workerId} item={item} />) : (
        <p className="rounded-2xl bg-white p-4 text-sm">This worker has not said they hold a card yet.</p>
      )}
    </section>
  )
}

function TicketCheckCard({ workerId, item }: { workerId: string; item: TicketCheckItem }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [noExpiry, setNoExpiry] = useState(!item.expiry && (Boolean(item.checkedBy) || Boolean(item.number) || item.key === "whiteCard"))
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setError("")
        setSaved("")
        start(async () => {
          const result = await markTicketChecked({
            workerId,
            licenceKey: item.key,
            number: String(data.get("number") || ""),
            expiry: noExpiry ? "" : String(data.get("expiry") || ""),
            noExpiry,
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setSaved(item.checkedBy ? "Check updated." : "Marked checked.")
          router.refresh()
        })
      }}
    >
      <h3 className="text-base font-semibold">{item.label}</h3>
      <div className="grid grid-cols-2 gap-2">
        <Photo title="Front" url={item.frontUrl} deleted={item.photosDeletedAt} label={item.label} />
        <Photo title="Back" url={item.backUrl} deleted={item.photosDeletedAt} label={item.label} />
      </div>
      {item.photosDeletedAt ? (
        <p className="text-xs leading-relaxed text-navy/70">
          Photos deleted {item.photosDeletedAt}. The number and expiry are kept.
        </p>
      ) : null}
      <label className="block text-sm font-semibold" htmlFor={"number-" + item.key}>
        Ticket or licence number
        <input
          id={"number-" + item.key}
          name="number"
          defaultValue={item.number}
          autoComplete="off"
          className={fieldClass}
          maxLength={30}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor={"expiry-" + item.key}>
        Expiry date
        <input
          id={"expiry-" + item.key}
          name="expiry"
          type="date"
          defaultValue={item.expiry}
          disabled={noExpiry}
          className={fieldClass}
        />
      </label>
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={noExpiry} onChange={(event) => setNoExpiry(event.target.checked)} />
        No expiry date on this card
      </label>
      {item.checkedBy && item.checkedAtLabel ? (
        <p className="text-sm font-semibold text-[#15803D]">
          Checked by {item.checkedBy} on {item.checkedAtLabel}.
        </p>
      ) : (
        <p className="text-sm text-navy/70">Not checked yet.</p>
      )}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm font-semibold text-[#15803D]">{saved}</p> : null}
      <div className="flex flex-col gap-2">
        <button className="pill pill-teal w-full" disabled={pending || !item.ready}>
          {pending ? "Saving" : "Matches the photo"}
        </button>
        <button
          type="button"
          className="pill pill-line-dark w-full"
          disabled={pending}
          onClick={() => {
            setError("")
            setSaved("")
            start(async () => {
              const result = await flagTicketMismatch({ workerId, licenceKey: item.key })
              if (!result.ok) {
                setError(result.error)
                return
              }
              setSaved("Marked as not matching. The photos stay until the usual delete date.")
              router.refresh()
            })
          }}
        >
          Doesn't match
        </button>
      </div>
      {item.ready ? null : (
        <p className="text-xs leading-relaxed text-navy/70">Both photos have to be here before this card can be marked checked.</p>
      )}
    </form>
  )
}

function Photo({ title, url, deleted, label }: { title: string; url?: string; deleted?: string; label: string }) {
  return (
    <figure className="space-y-1">
      {url && !deleted ? (
        // Short-lived admin links must not pass through the image optimiser.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label + " " + title.toLowerCase()} className="aspect-[3/2] w-full rounded-xl bg-navy/5 object-contain" />
      ) : (
        <div className="flex aspect-[3/2] items-center justify-center rounded-xl bg-navy/5 px-2 text-center text-xs font-semibold text-navy/70">
          {deleted ? "Photo deleted" : "Not uploaded"}
        </div>
      )}
      <figcaption className="text-center text-xs font-semibold">{title}</figcaption>
    </figure>
  )
}
