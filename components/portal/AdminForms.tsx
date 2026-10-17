"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { removeImages, saveVerification, sendShiftOffers, showPassport, signOutWorker } from "@/app/portal/actions"
import { fieldClass } from "@/components/portal/ui"
import { TICKET_LABELS, TICKET_TYPES, VEVO_RESULTS, VERIFICATION_METHODS, WORKER_STATUSES } from "@/lib/portal/types"

export function OfferComposer({
  workers,
}: {
  workers: { id: string; name: string; label: string }[]
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [note, setNote] = useState("")
  const [all, setAll] = useState(true)
  const [picked, setPicked] = useState<string[]>([])
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const required = TICKET_TYPES.filter((type) => data.get("req-" + type) === "on")
        start(async () => {
          const result = await sendShiftOffers({
            placementRef: String(data.get("placementRef") || ""),
            suburb: String(data.get("suburb") || ""),
            address: String(data.get("address") || ""),
            siteName: String(data.get("siteName") || ""),
            siteContact: String(data.get("siteContact") || ""),
            sitePhone: String(data.get("sitePhone") || ""),
            shiftDate: String(data.get("shiftDate") || ""),
            startTime: String(data.get("startTime") || "07:00"),
            expectedHours: Number(data.get("expectedHours") || 8),
            roleName: String(data.get("roleName") || "Labourer"),
            rateToWorker: String(data.get("rateToWorker") || ""),
            requiredTickets: required,
            expiresHours: Number(data.get("expiresHours") || 2),
            workerIds: all ? "all" : picked,
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setNote("Offered to " + result.created.join(", ") + (result.skipped.length ? ". Skipped: " + result.skipped.join(", ") : ""))
          setError("")
          router.refresh()
        })
      }}
    >
      <Text name="placementRef" label="Placement reference" placeholder="P-2026-020" />
      <Text name="roleName" label="Role" defaultValue="Labourer" />
      <Text name="suburb" label="Suburb" />
      <Text name="address" label="Full address (shown after they accept)" />
      <Text name="shiftDate" label="Date" type="date" />
      <Text name="startTime" label="Start" type="time" defaultValue="07:00" />
      <Text name="expectedHours" label="Expected hours" inputMode="decimal" defaultValue="8" />
      <Text name="rateToWorker" label="Rate to worker" placeholder="$42 an hour" />
      <Text name="siteName" label="Site name" />
      <Text name="siteContact" label="Site contact" />
      <Text name="sitePhone" label="Site mobile" inputMode="tel" />
      <Text name="expiresHours" label="Offer expires (hours)" defaultValue="2" inputMode="numeric" />
      <fieldset>
        <legend className="text-sm font-semibold">Tickets required</legend>
        <div className="mt-2 space-y-1">
          {TICKET_TYPES.filter((type) => type !== "other").map((type) => (
            <label key={type} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
              <input type="checkbox" name={"req-" + type} defaultChecked={type === "whiteCard"} />
              {TICKET_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={all} onChange={(event) => setAll(event.target.checked)} />
        Offer to every ready worker
      </label>
      {all ? null : (
        <div className="space-y-1">
          {workers.map((worker) => (
            <label key={worker.id} className="flex min-h-12 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={picked.includes(worker.id)}
                onChange={(event) =>
                  setPicked(event.target.checked ? [...picked, worker.id] : picked.filter((id) => id !== worker.id))
                }
              />
              <span>
                <span className="font-semibold">{worker.name}</span>
                <span className="block text-xs text-navy/70">{worker.label}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      {note ? <p className="text-sm font-semibold text-[#15803D]">{note}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Send offers
      </button>
    </form>
  )
}

export function VerifyPanel({
  workerId,
  visa,
}: {
  workerId: string
  visa: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [passport, setPassport] = useState("")
  const [pending, start] = useTransition()
  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          start(async () => {
            const result = await saveVerification(workerId, {
              verificationMethod: String(data.get("method") || ""),
              verifiedOn: String(data.get("verifiedOn") || ""),
              verifiedBy: String(data.get("verifiedBy") || "MS Workforce"),
              ticketsVerified: data.get("ticketsVerified") === "on",
              vevoResult: String(data.get("vevoResult") || "") || undefined,
              vevoCheckedOn: String(data.get("vevoCheckedOn") || "") || undefined,
              status: (String(data.get("status") || "") || undefined) as "Ready" | undefined,
            })
            if (!result.ok) setError(result.error)
            else router.refresh()
          })
        }}
      >
        <Select name="method" label="Verification method" options={VERIFICATION_METHODS} />
        <Text name="verifiedOn" label="Verified on" type="date" />
        <Text name="verifiedBy" label="Verified by" defaultValue="MS Workforce" />
        <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="ticketsVerified" />
          Tickets verified
        </label>
        <Select name="status" label="Status" options={WORKER_STATUSES} />
        {visa ? (
          <>
            <Select name="vevoResult" label="VEVO result" options={VEVO_RESULTS} />
            <Text name="vevoCheckedOn" label="VEVO checked on" type="date" />
            <p className="text-xs text-navy/70">Saving a VEVO result deletes the passport number.</p>
          </>
        ) : null}
        {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
        <button className="pill pill-teal w-full" disabled={pending}>
          Save check
        </button>
      </form>
      {visa ? (
        <button
          type="button"
          className="pill pill-line-dark w-full"
          onClick={() =>
            start(async () => {
              const result = await showPassport(workerId)
              if (!result.ok) setError(result.error)
              else setPassport(result.country + " · " + result.number)
            })
          }
        >
          Show passport once
        </button>
      ) : null}
      {passport ? <p className="rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white">{passport}</p> : null}
      <button type="button" className="pill pill-line-dark w-full" onClick={() => start(async () => { await removeImages(workerId); router.refresh() })}>
        Delete images now
      </button>
      <button type="button" className="min-h-12 w-full text-sm font-semibold text-teal-600" onClick={() => start(async () => { await signOutWorker(workerId) })}>
        Log this worker out of every phone
      </button>
    </div>
  )
}

function Text(props: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const { label, ...input } = props
  return (
    <label className="block text-sm font-semibold" htmlFor={input.name}>
      {label}
      <input id={input.name} className={fieldClass} {...input} />
    </label>
  )
}

function Select({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <label className="block text-sm font-semibold" htmlFor={name}>
      {label}
      <select id={name} name={name} className={fieldClass} defaultValue="">
        <option value="">Choose</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
