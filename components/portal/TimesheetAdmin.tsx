"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adjustTimesheet, markTimesheetQueried } from "@/app/portal/actions"
import { STANDARD_BREAK_MINUTES } from "@/lib/portal/hours"
import { fieldClass } from "@/components/portal/ui"

export function TimesheetAdmin({
  sheetId,
  start,
  finish,
}: {
  sheetId: string
  start: string
  finish: string
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3 rounded-2xl border border-navy/10 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        startTransition(async () => {
          const result =
            data.get("mode") === "query"
              ? await markTimesheetQueried(sheetId, String(data.get("note") || ""))
              : await adjustTimesheet(sheetId, {
                  start: String(data.get("start") || start),
                  finish: String(data.get("finish") || finish),
                  breakMinutes: STANDARD_BREAK_MINUTES,
                  note: String(data.get("note") || ""),
                })
          if (!result.ok) setError(result.error)
          else router.refresh()
        })
      }}
    >
      <p className="text-sm font-semibold">Admin correction</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="start" aria-label="Corrected start" defaultValue={start} className={fieldClass} />
        <input name="finish" aria-label="Corrected finish" defaultValue={finish} className={fieldClass} />
      </div>
      <p className="text-sm font-semibold">30-minute break</p>
      <input name="note" aria-label="Correction note" placeholder="What changed" className={fieldClass} />
      {error ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      <button name="mode" value="correct" className="pill pill-teal w-full" disabled={pending}>
        Save correction
      </button>
      <button name="mode" value="query" className="pill pill-line-dark w-full" disabled={pending}>
        Mark queried
      </button>
    </form>
  )
}
