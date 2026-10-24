"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { adjustTimesheet, approveTimesheet, markTimesheetQueried } from "@/app/portal/actions"
import { fieldClass } from "@/components/portal/ui"
import { STANDARD_BREAK_MINUTES, parseTime } from "@/lib/portal/hours"

export function TimesheetAdmin({
  sheetId,
  start,
  finish,
  breakMinutes,
  breakStart,
  status,
  signed,
}: {
  sheetId: string
  start: string
  finish: string
  breakMinutes: number
  breakStart?: string
  status: string
  signed: boolean
}) {
  const router = useRouter()
  const [startValue, setStartValue] = useState(start)
  const [finishValue, setFinishValue] = useState(finish)
  const [choice, setChoice] = useState<0 | 30>(breakMinutes === 0 ? 0 : STANDARD_BREAK_MINUTES)
  const [breakAt, setBreakAt] = useState(breakStart || "")
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const short = useMemo(() => {
    const startMin = parseTime(startValue)
    const finishMin = parseTime(finishValue)
    if (startMin === null || finishMin === null) return false
    const span = finishMin - startMin
    return span > 0 && span < 4 * 60
  }, [startValue, finishValue])
  const minutes = short && choice === 0 ? 0 : STANDARD_BREAK_MINUTES

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
                  start: startValue,
                  finish: finishValue,
                  breakMinutes: minutes,
                  breakStart: minutes === 0 ? undefined : breakAt,
                  note: String(data.get("note") || ""),
                })
          if (!result.ok) setError(result.error)
          else router.refresh()
        })
      }}
    >
      <p className="text-sm font-semibold">Admin correction</p>
      <div className="grid grid-cols-2 gap-2">
        <input name="start" aria-label="Corrected start" value={startValue} onChange={(event) => setStartValue(event.target.value)} className={fieldClass} />
        <input name="finish" aria-label="Corrected finish" value={finishValue} onChange={(event) => setFinishValue(event.target.value)} className={fieldClass} />
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Unpaid break</legend>
        {short ? (
          <label className="mt-2 flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="radio" name="admin-break" value="0" checked={minutes === 0} onChange={() => setChoice(0)} />
            No break
          </label>
        ) : null}
        <label className="mt-2 flex min-h-12 items-center gap-3 text-sm font-semibold">
          <input type="radio" name="admin-break" value="30" checked={minutes === STANDARD_BREAK_MINUTES} onChange={() => setChoice(STANDARD_BREAK_MINUTES)} />
          30-minute break
        </label>
        {minutes === STANDARD_BREAK_MINUTES ? (
          <label className="mt-2 block text-sm font-semibold" htmlFor="admin-break-start">
            Break start time
            <input
              id="admin-break-start"
              aria-label="Break start"
              value={breakAt}
              placeholder="12:00"
              onChange={(event) => setBreakAt(event.target.value)}
              className={fieldClass}
            />
          </label>
        ) : null}
      </fieldset>
      <input name="note" aria-label="Correction note" placeholder="What changed" className={fieldClass} />
      {error ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      <button name="mode" value="correct" className="pill pill-teal w-full" disabled={pending}>
        Save correction
      </button>
      <button name="mode" value="query" className="pill pill-line-dark w-full" disabled={pending}>
        Mark queried
      </button>
      {status === "Approved" ? (
        <p className="text-sm font-semibold">Approved for pay. The worker can&apos;t change these hours.</p>
      ) : (
        <button
          type="button"
          className="pill pill-dark w-full"
          disabled={pending || !signed}
          onClick={() => {
            startTransition(async () => {
              const result = await approveTimesheet(sheetId)
              if (!result.ok) setError(result.error)
              else router.refresh()
            })
          }}
        >
          {signed ? "Approve for pay" : "Needs a supervisor signature"}
        </button>
      )}
    </form>
  )
}
