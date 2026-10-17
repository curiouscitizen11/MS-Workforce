"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { lodgeTimesheet } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import { formatDate } from "@/lib/portal/dates"
import { formatHours, hoursWarnings, paidHours } from "@/lib/portal/hours"
import { SUPERVISOR_ROLES, TIMESHEET_TASKS } from "@/lib/portal/types"

export type TimesheetShift = {
  id: string
  workDate: string
  siteName: string
  suburb: string
  builder: string
  start: string
  finish: string
  breakMinutes: number
  signer: string
  signerRole: string
}

type Payload = {
  offerId: string
  workDate: string
  start: string
  finish: string
  breakMinutes: number
  breakNote?: string
  tasks: string[]
  taskNote?: string
  incident: boolean
  incidentNote?: string
  workerNote?: string
  workerConfirmed: boolean
  confirmUnusualHours?: boolean
  supervisorName: string
  supervisorRole: string
  supervisorConfirmed: boolean
  signaturePng: string
}

const QUEUE_KEY = "msw-timesheet-queue"
const DRAFT_KEY = "msw-timesheet-draft"
const BREAKS = [
  { label: "None", minutes: 0 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
]

function timeOptions() {
  const options: string[] = []
  for (let minutes = 5 * 60; minutes <= 20 * 60; minutes += 15) {
    options.push(String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0"))
  }
  return options
}

const TIMES = timeOptions()

export function TimesheetForm({ shifts, today, workerName }: { shifts: TimesheetShift[]; today: string; workerName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<"times" | "sign">("times")
  const [workDate, setWorkDate] = useState(shifts.find((shift) => shift.workDate === today)?.workDate || shifts[0]?.workDate || today)
  const dayShifts = shifts.filter((shift) => shift.workDate === workDate)
  const [offerId, setOfferId] = useState(dayShifts[0]?.id || "")
  const shift = dayShifts.find((item) => item.id === offerId) || dayShifts[0]
  const [start, setStart] = useState(shift?.start || "07:00")
  const [finish, setFinish] = useState(shift?.finish || "15:30")
  const [breakChoice, setBreakChoice] = useState(shift?.breakMinutes ?? 30)
  const [otherBreak, setOtherBreak] = useState(false)
  const [otherMinutes, setOtherMinutes] = useState("20")
  const [breakNote, setBreakNote] = useState("")
  const [tasks, setTasks] = useState<string[]>([])
  const [taskNote, setTaskNote] = useState("")
  const [incident, setIncident] = useState<boolean | null>(null)
  const [incidentNote, setIncidentNote] = useState("")
  const [workerNote, setWorkerNote] = useState("")
  const [workerConfirmed, setWorkerConfirmed] = useState(false)
  const [confirmUnusual, setConfirmUnusual] = useState(false)
  const [supervisorName, setSupervisorName] = useState(shift?.signer || "")
  const [role, setRole] = useState(shift?.signerRole || "Site supervisor")
  const [roleNote, setRoleNote] = useState("")
  const [supervisorConfirmed, setSupervisorConfirmed] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [queued, setQueued] = useState("")
  const [pending, startTransition] = useTransition()
  const breakMinutes = otherBreak ? Number(otherMinutes) : breakChoice
  const preview = useMemo(() => paidHours(start, finish, breakMinutes), [start, finish, breakMinutes])
  const warnings = preview.ok ? hoursWarnings(preview.hours) : []
  const needsConfirm = warnings.some((warning) => warning.level === "confirm")

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as { offerId?: string; start?: string; finish?: string; workDate?: string }
      if (saved.workDate) setWorkDate(saved.workDate)
      if (saved.offerId) setOfferId(saved.offerId)
      if (saved.start) setStart(saved.start)
      if (saved.finish) setFinish(saved.finish)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerId, workDate, start, finish, breakMinutes, tasks, incident, workerNote }))
  }, [offerId, workDate, start, finish, breakMinutes, tasks, incident, workerNote])

  useEffect(() => {
    const raw = window.localStorage.getItem(QUEUE_KEY)
    if (!raw) return
    const queue = JSON.parse(raw) as Payload[]
    if (!queue.length) return
    let cancelled = false
    void (async () => {
      const left: Payload[] = []
      let sentId = ""
      for (const item of queue) {
        try {
          const result = await lodgeTimesheet(item)
          if (result.ok) sentId = result.id
        } catch {
          left.push(item)
        }
      }
      if (cancelled) return
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(left))
      if (sentId && !left.length) {
        window.localStorage.removeItem(DRAFT_KEY)
        setQueued("Sent")
        router.push("/portal/timesheet/" + sentId)
        router.refresh()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  function chooseShift(nextId: string) {
    const next = shifts.find((item) => item.id === nextId)
    if (!next) return
    setOfferId(next.id)
    setWorkDate(next.workDate)
    setStart(next.start)
    setFinish(next.finish)
    setBreakChoice(next.breakMinutes)
    setOtherBreak(false)
    setSupervisorName(next.signer)
    setRole(next.signerRole || "Site supervisor")
  }

  function payload(): Payload | null {
    if (!shift || !preview.ok || incident === null || !signature) return null
    return {
      offerId: shift.id,
      workDate: shift.workDate,
      start,
      finish,
      breakMinutes,
      breakNote: otherBreak ? breakNote : undefined,
      tasks,
      taskNote: tasks.includes("Other, please explain") ? taskNote : undefined,
      incident,
      incidentNote: incident ? incidentNote : undefined,
      workerNote,
      workerConfirmed,
      confirmUnusualHours: needsConfirm ? confirmUnusual : undefined,
      supervisorName,
      supervisorRole: role,
      supervisorConfirmed,
      signaturePng: signature,
    }
  }

  return (
    <form
      className="space-y-3"
      data-screen={step}
      onSubmit={(event) => {
        event.preventDefault()
        if (step === "times") {
          if (!shift) {
            setError("No accepted shift on that day.")
            return
          }
          if (workDate > today) {
            setError("That date has not happened yet.")
            return
          }
          if (!preview.ok) {
            setError(preview.error)
            return
          }
          if (incident === null) {
            setError("Say whether there was an incident today.")
            return
          }
          if (incident && !incidentNote.trim()) {
            setError("Tell us what happened.")
            return
          }
          if (!workerConfirmed) {
            setError("Tick the box to confirm these are the hours you worked.")
            return
          }
          if (needsConfirm && !confirmUnusual) {
            setError(warnings.find((warning) => warning.level === "confirm")?.message || "Confirm the times.")
            return
          }
          setError("")
          setStep("sign")
          return
        }
        const body = payload()
        if (!body) {
          setError("The supervisor needs to sign on the screen.")
          return
        }
        startTransition(async () => {
          try {
            const result = await lodgeTimesheet(body)
            if (!result.ok) {
              setError(result.error)
              return
            }
            window.localStorage.removeItem(DRAFT_KEY)
            router.push("/portal/timesheet/" + result.id)
            router.refresh()
          } catch {
            const existing = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || "[]") as Payload[]
            existing.push(body)
            window.localStorage.setItem(QUEUE_KEY, JSON.stringify(existing))
            setQueued("Saved on this phone. It will send when you have signal.")
            setError("")
          }
        })
      }}
    >
      {step === "times" ? (
        <>
          <section className="rounded-2xl border border-navy/10 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Site</p>
            {dayShifts.length > 1 ? (
              <label className="mt-2 block text-sm font-semibold" htmlFor="shift">
                Choose the shift
                <select id="shift" className={fieldClass} value={offerId} onChange={(event) => chooseShift(event.target.value)}>
                  {dayShifts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.siteName} · {item.suburb}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <p className="mt-1 text-base font-semibold">{shift?.siteName || "No accepted shift"}</p>
                <p className="text-sm text-navy/70">
                  {shift ? shift.suburb + " · " + shift.builder : "Accept a shift first."}
                </p>
              </>
            )}
          </section>
          <label className="block text-sm font-semibold" htmlFor="work-date">
            Date worked
            <input
              id="work-date"
              type="date"
              max={today}
              className={fieldClass}
              value={workDate}
              onChange={(event) => {
                const nextDate = event.target.value
                setWorkDate(nextDate)
                const match = shifts.find((item) => item.workDate === nextDate)
                if (match) chooseShift(match.id)
                else setOfferId("")
              }}
            />
          </label>
          {!shift ? <p className="text-sm font-semibold text-[#B45309]">No accepted shift on that day.</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold" htmlFor="start">
              Start time
              <select id="start" className={fieldClass} value={start} onChange={(event) => setStart(event.target.value)}>
                {TIMES.map((time) => (
                  <option key={time}>{time}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold" htmlFor="finish">
              Finish time
              <select id="finish" className={fieldClass} value={finish} onChange={(event) => setFinish(event.target.value)}>
                {TIMES.map((time) => (
                  <option key={time}>{time}</option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Unpaid break</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {BREAKS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={chip(breakChoice === item.minutes && !otherBreak)}
                  onClick={() => {
                    setOtherBreak(false)
                    setBreakChoice(item.minutes)
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button type="button" className={chip(otherBreak)} onClick={() => setOtherBreak(true)}>
                Other, please explain
              </button>
            </div>
            {otherBreak ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block text-sm font-semibold" htmlFor="other-break">
                  Minutes
                  <input
                    id="other-break"
                    inputMode="numeric"
                    className={fieldClass}
                    value={otherMinutes}
                    onChange={(event) => setOtherMinutes(event.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold" htmlFor="break-note">
                  Note
                  <input id="break-note" className={fieldClass} value={breakNote} onChange={(event) => setBreakNote(event.target.value)} />
                </label>
              </div>
            ) : null}
          </fieldset>
          <p className="rounded-2xl bg-white px-3 py-3" data-testid="paid-hours">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Paid hours today</span>
            <span className="mt-1 block text-4xl font-semibold tracking-tight">{preview.ok ? formatHours(preview.hours) + " hours" : "Check the times"}</span>
          </p>
          {warnings.map((warning) => (
            <p key={warning.message} className="text-sm font-semibold text-[#B45309]">
              {warning.message}
            </p>
          ))}
          {needsConfirm ? (
            <label className="flex min-h-12 items-start gap-3 text-sm font-semibold">
              <input type="checkbox" className="mt-1" checked={confirmUnusual} onChange={(event) => setConfirmUnusual(event.target.checked)} />
              I have checked these times.
            </label>
          ) : null}
          <fieldset>
            <legend className="text-sm font-semibold">What did you mainly do? (optional)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIMESHEET_TASKS.map((task) => (
                <button
                  key={task}
                  type="button"
                  className={chip(tasks.includes(task))}
                  onClick={() => setTasks(tasks.includes(task) ? tasks.filter((item) => item !== task) : [...tasks, task])}
                >
                  {task}
                </button>
              ))}
            </div>
            {tasks.includes("Other, please explain") ? (
              <input className={fieldClass} aria-label="Other task" value={taskNote} onChange={(event) => setTaskNote(event.target.value)} />
            ) : null}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">Were you injured, or was there an incident or near miss today?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className={chip(incident === false)} onClick={() => setIncident(false)}>
                No
              </button>
              <button type="button" className={chip(incident === true)} onClick={() => setIncident(true)}>
                Yes
              </button>
            </div>
            {incident ? (
              <label className="mt-2 block text-sm font-semibold" htmlFor="incident-note">
                Tell us what happened
                <textarea id="incident-note" className={fieldClass} rows={3} value={incidentNote} onChange={(event) => setIncidentNote(event.target.value)} />
              </label>
            ) : null}
          </fieldset>
          <label className="block text-sm font-semibold" htmlFor="worker-note">
            Anything MS Workforce should know about today? (optional)
            <textarea
              id="worker-note"
              maxLength={300}
              rows={2}
              className={fieldClass}
              value={workerNote}
              onChange={(event) => setWorkerNote(event.target.value)}
            />
          </label>
          <label className="flex min-h-12 items-start gap-3 text-sm font-semibold">
            <input type="checkbox" className="mt-1" checked={workerConfirmed} onChange={(event) => setWorkerConfirmed(event.target.checked)} />
            I confirm these are the hours I worked today.
          </label>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight">Supervisor: please check and sign</h2>
          <section className="rounded-2xl bg-navy px-3 py-3 text-white">
            <p className="text-lg font-semibold">{workerName}</p>
            <p className="text-sm">
              {shift?.siteName} · {shift?.suburb}
            </p>
            <p className="text-sm">{shift ? formatDate(shift.workDate) : ""}</p>
            <p className="mt-2 text-base font-semibold">
              Start {start} · Finish {finish} · Break {breakMinutes} min · {preview.ok ? formatHours(preview.hours) : "0.0"} paid hours
            </p>
            {tasks.length ? <p className="mt-1 text-sm">{tasks.join(", ")}</p> : null}
            <p className="mt-1 text-sm">Incident reported: {incident ? "Yes" : "No"}</p>
          </section>
          <label className="block text-sm font-semibold" htmlFor="sup-name">
            Supervisor name
            <input id="sup-name" className={fieldClass} value={supervisorName} onChange={(event) => setSupervisorName(event.target.value)} />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Role</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUPERVISOR_ROLES.map((item) => (
                <button key={item} type="button" className={chip(role === item)} onClick={() => setRole(item)}>
                  {item}
                </button>
              ))}
            </div>
            {role === "Other, please explain" ? (
              <input className={fieldClass} aria-label="Other role" value={roleNote} onChange={(event) => setRoleNote(event.target.value)} />
            ) : null}
          </fieldset>
          <label className="flex min-h-12 items-start gap-3 text-sm font-semibold">
            <input type="checkbox" className="mt-1" checked={supervisorConfirmed} onChange={(event) => setSupervisorConfirmed(event.target.checked)} />
            I&apos;ve checked these hours and they are correct. MS Workforce can pay and invoice them.
          </label>
          <p className="text-sm font-semibold">Sign here</p>
          <SignaturePad onChange={setSignature} />
        </>
      )}
      {queued ? <p className="text-sm font-semibold text-teal-600">{queued}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        {step === "times" ? "Hand to supervisor to sign →" : pending ? "Sending" : "Sign and submit"}
      </button>
      {step === "sign" ? (
        <button
          type="button"
          className="min-h-12 w-full text-sm font-semibold text-teal-600"
          onClick={() => {
            setStep("times")
            setSignature(null)
            setSupervisorConfirmed(false)
            setError("")
          }}
        >
          Something&apos;s wrong, give the phone back
        </button>
      ) : null}
    </form>
  )
}

function chip(on: boolean) {
  return (
    "min-h-12 rounded-full border px-3 text-sm font-semibold " +
    (on ? "border-teal-600 bg-teal-600 text-white" : "border-navy/15 bg-white text-navy")
  )
}
