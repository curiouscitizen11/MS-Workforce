"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveHeadshot, rejectHeadshot } from "@/app/portal/actions"
import { HEADSHOT_REJECT_REASONS } from "@/lib/portal/headshot"
import { fieldClass } from "@/components/portal/ui"

export function HeadshotReview({ id, name, url }: { id: string; name: string; url: string }) {
  const router = useRouter()
  const [reason, setReason] = useState<(typeof HEADSHOT_REJECT_REASONS)[number]>(HEADSHOT_REJECT_REASONS[0])
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  return (
    <article className="space-y-3 rounded-2xl bg-white p-4">
      <h2 className="text-base font-semibold">{name}</h2>
      {/* Signed admin links must not pass through the image optimiser. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={"Headshot of " + name} className="mx-auto h-36 w-36 rounded-full object-cover" />
      <p className="text-sm">Waiting for a check</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="pill pill-teal w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await approveHeadshot(id)
              if (!result.ok) setError(result.error)
              else router.refresh()
            })
          }
        >
          Approve
        </button>
        <label className="block text-sm font-semibold" htmlFor={"reason-" + id}>
          If it is not usable
          <select id={"reason-" + id} className={fieldClass} value={reason} onChange={(event) => setReason(event.target.value as (typeof HEADSHOT_REJECT_REASONS)[number])}>
            {HEADSHOT_REJECT_REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="pill pill-line-dark w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await rejectHeadshot(id, reason)
              if (!result.ok) setError(result.error)
              else router.refresh()
            })
          }
        >
          Reject photo
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
    </article>
  )
}
