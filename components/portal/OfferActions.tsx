"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { answerOffer } from "@/app/portal/actions"
import { CONTACT_LINE, JOBS_MAILTO } from "@/lib/portal/business-phone"

export function OfferActions({ offerId, blocked }: { offerId: string; blocked?: string }) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [declining, setDeclining] = useState(false)
  const [pending, start] = useTransition()

  function send(accept: boolean) {
    setError("")
    start(async () => {
      const result = await answerOffer(offerId, accept, reason)
      if (!result.ok) {
        setError("error" in result ? result.error : result.message)
        return
      }
      router.push(accept ? "/portal/offers" : "/portal")
      router.refresh()
    })
  }

  if (blocked) {
    const linked = blocked.startsWith(CONTACT_LINE)
    return (
      <p role="alert" className="rounded-2xl bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
        {linked ? (
          <>
            <a className="underline" href={JOBS_MAILTO}>
              {CONTACT_LINE}
            </a>
            {blocked.slice(CONTACT_LINE.length)}
          </>
        ) : (
          blocked
        )}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" type="button" disabled={pending} onClick={() => send(true)}>
        Accept shift
      </button>
      {declining ? (
        <>
          <label className="block text-sm font-semibold" htmlFor="reason">
            Reason, if you want to add one
            <input id="reason" className="portal-field mt-1 w-full min-h-12 rounded-2xl border border-navy/20 px-3 text-base" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <button className="pill pill-line-dark w-full" type="button" disabled={pending} onClick={() => send(false)}>
            Confirm decline
          </button>
        </>
      ) : (
        <button className="pill pill-line-dark w-full" type="button" onClick={() => setDeclining(true)}>
          Decline
        </button>
      )}
    </div>
  )
}
