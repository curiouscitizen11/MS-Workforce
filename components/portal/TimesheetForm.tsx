"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { lodgeTimesheet } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import { emailError, emailProblem } from "@/lib/portal/email"
import { formatDate } from "@/lib/portal/dates"
import { STANDARD_BREAK_MINUTES, breakChoiceProblem, formatBreak, formatHours, hoursWarnings, paidHours, parseTime } from "@/lib/portal/hours"
import { SUPERVISOR_ROLES, TIMESHEET_TASKS } from "@/lib/portal/types"

export type TimesheetShift = {
  id: string
  workDate: string
  siteName: string
  suburb: string
  builder: string
  start: string
  finish: string
  signer: string
  signerRole: string
}

export type SavedTimesheet = {
  offerId: string
  workDate: string
  start: string
  finish: string
  breakMinutes: number
  breakStart?: string
  tasks: string[]
  taskNote?: string
  incident: boolean
  incidentNote?: string
  workerNote?: string
  supervisorName?: string
  supervisorEmail?: string
  supervisorRole?: string
  signaturePng?: string
  status: string
}

function findSaved(savedSheets: SavedTimesheet[], offerId?: string) {
  return savedSheets.find((sheet) => sheet.offerId === offerId)
}

type Payload = {
  offerId: string
  workDate: string
  start: string
  finish: string
  breakMinutes: number
  breakStart?: string
  tasks: string[]
  taskNote?: string
  incident: boolean
  incidentNote?: string
  workerNote?: string
  workerConfirmed: boolean
  confirmUnusualHours?: boolean
  supervisorName: string
  supervisorEmail: string
  supervisorRole: string
  supervisorConfirmed: boolean
  signaturePng: string
}

const QUEUE_KEY = "msw-timesheet-queue"
const DRAFT_KEY = "msw-timesheet-draft"
function timeOptions() {
  const options: string[] = []
  for (let minutes = 5 * 60; minutes <= 20 * 60; minutes += 15) {
    options.push(String(Math.floor(minutes / 60)).padStart(2, "0") + ":" + String(minutes % 60).padStart(2, "0"))
  }
  return options
}

const TIMES = timeOptions()

export function TimesheetForm({
  shifts,
  today,
  workerName,
  savedSheets = [],
}: {
  shifts: TimesheetShift[]
  today: string
  workerName: string
  savedSheets?: SavedTimesheet[]
}) {
  const router = useRouter()
  const opening = shifts.find((shift) => shift.workDate === today) || shifts[0]
  const openingSaved = findSaved(savedSheets, opening?.id)
  const [step, setStep] = useState<"times" | "review">("times")
  const [workDate, setWorkDate] = useState(opening?.workDate || today)
  const dayShifts = shifts.filter((shift) => shift.workDate === workDate)
  const [offerId, setOfferId] = useState(opening?.id || "")
  const shift = dayShifts.find((item) => item.id === offerId) || dayShifts[0]
  const saved = findSaved(savedSheets, shift?.id)
  const [start, setStart] = useState(openingSaved?.start || opening?.start || "07:00")
  const [finish, setFinish] = useState(openingSaved?.finish || opening?.finish || "15:30")
  const [breakChoice, setBreakChoice] = useState<0 | 30>(openingSaved?.breakMinutes === 0 ? 0 : STANDARD_BREAK_MINUTES)
  const [breakStart, setBreakStart] = useState(openingSaved?.breakStart || "")
  const [tasks, setTasks] = useState<string[]>(openingSaved?.tasks || [])
  const [taskNote, setTaskNote] = useState(openingSaved?.taskNote || "")
  const [incident, setIncident] = useState<boolean | null>(openingSaved ? openingSaved.incident : null)
  const [incidentNote, setIncidentNote] = useState(openingSaved?.incidentNote || "")
  const [workerNote, setWorkerNote] = useState(openingSaved?.workerNote || "")
  const [confirmUnusual, setConfirmUnusual] = useState(false)
  const [supervisorName, setSupervisorName] = useState(openingSaved?.supervisorName || opening?.signer || "")
  const [supervisorEmail, setSupervisorEmail] = useState(openingSaved?.supervisorEmail || "")
  const [role, setRole] = useState(openingSaved?.supervisorRole || opening?.signerRole || "Site supervisor")
  const [roleNote, setRoleNote] = useState("")
  const [supervisorConfirmed, setSupervisorConfirmed] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [queued, setQueued] = useState("")
  const [pending, startTransition] = useTransition()
  const savedSheetsRef = useRef(savedSheets)
  const signedHours = useRef<string | null>(
    openingSaved?.signaturePng
      ? [openingSaved.start, openingSaved.finish, String(openingSaved.breakMinutes), openingSaved.breakStart || ""].join("|")
      : null,
  )
  const span = useMemo(() => {
    const startMin = parseTime(start)
    const finishMin = parseTime(finish)
    if (startMin === null || finishMin === null) return null
    return finishMin - startMin
  }, [start, finish])
  const shortShift = span !== null && span > 0 && span < 4 * 60
  const breakMinutes = shortShift ? breakChoice : STANDARD_BREAK_MINUTES
  const recordedBreak = breakMinutes === 0 ? "" : breakStart
  const hoursKey = [start, finish, String(breakMinutes), recordedBreak].join("|")
  const hoursDirty =
    !saved ||
    saved.start !== start ||
    saved.finish !== finish ||
    saved.breakMinutes !== breakMinutes ||
    (saved.breakStart || "") !== recordedBreak
  const locked = saved?.status === "Approved"
  const preview = useMemo(() => paidHours(start, finish, breakMinutes), [start, finish, breakMinutes])
  const breakProblem = breakChoiceProblem({ start, finish, breakMinutes, breakStart })
  const breakSlots = useMemo(() => {
    const startMin = parseTime(start)
    const finishMin = parseTime(finish)
    if (startMin === null || finishMin === null) return TIMES
    return TIMES.filter((time) => {
      const minutes = parseTime(time)
      return minutes !== null && minutes >= startMin && minutes + STANDARD_BREAK_MINUTES <= finishMin
    })
  }, [start, finish])
  const warnings = preview.ok ? hoursWarnings(preview.hours) : []
  const needsConfirm = warnings.some((warning) => warning.level === "confirm")

  useEffect(() => {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as { offerId?: string; start?: string; finish?: string; workDate?: string; breakMinutes?: number; breakStart?: string }
      if (findSaved(savedSheetsRef.current, draft.offerId)) return
      if (draft.workDate) setWorkDate(draft.workDate)
      if (draft.offerId) setOfferId(draft.offerId)
      if (draft.start) setStart(draft.start)
      if (draft.finish) setFinish(draft.finish)
      if (draft.breakMinutes === 0) setBreakChoice(0)
      if (draft.breakStart) setBreakStart(draft.breakStart)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (signedHours.current === null || signedHours.current === hoursKey) return
    signedHours.current = null
    setSupervisorName("")
    setSupervisorEmail("")
    setSupervisorConfirmed(false)
    setSignature(null)
  }, [hoursKey])

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerId, workDate, start, finish, breakMinutes, breakStart, tasks, incident, workerNote }))
  }, [offerId, workDate, start, finish, breakMinutes, breakStart, tasks, incident, workerNote])

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
    const prior = findSaved(savedSheets, next.id)
    setOfferId(next.id)
    setWorkDate(next.workDate)
    setStart(prior?.start || next.start)
    setFinish(prior?.finish || next.finish)
    setBreakChoice(prior?.breakMinutes === 0 ? 0 : STANDARD_BREAK_MINUTES)
    setBreakStart(prior?.breakStart || "")
    setTasks(prior?.tasks || [])
    setTaskNote(prior?.taskNote || "")
    setIncident(prior ? prior.incident : null)
    setIncidentNote(prior?.incidentNote || "")
    setWorkerNote(prior?.workerNote || "")
    setSupervisorName(prior?.supervisorName || next.signer)
    setSupervisorEmail(prior?.supervisorEmail || "")
    setRole(prior?.supervisorRole || next.signerRole || "Site supervisor")
    setSupervisorConfirmed(false)
    setSignature(null)
    signedHours.current = prior?.signaturePng
      ? [prior.start, prior.finish, String(prior.breakMinutes), prior.breakStart || ""].join("|")
      : null
    setStep("times")
  }

  function onSign(value: string | null) {
    setSignature(value)
    signedHours.current = value ? hoursKey : signedHours.current
  }

  function payload(): Payload | null {
    const signaturePng = signature || (signedHours.current === hoursKey ? saved?.signaturePng || "" : "")
    if (!shift || !preview.ok || incident === null || !signaturePng) return null
    return {
      offerId: shift.id,
      workDate: shift.workDate,
      start,
      finish,
      breakMinutes,
      breakStart: breakMinutes === 0 ? undefined : breakStart,
      tasks,
      taskNote: tasks.includes("Other, please explain") ? taskNote : undefined,
      incident,
      incidentNote: incident ? incidentNote : undefined,
      workerNote,
      workerConfirmed: true,
      supervisorEmail,
      confirmUnusualHours: needsConfirm ? confirmUnusual : undefined,
      supervisorName,
      supervisorRole: role,
      supervisorConfirmed,
      signaturePng,
    }
  }

  return (
    <form
      className="space-y-3"
      data-screen={step}
      onSubmit={(event) => {
        event.preventDefault()
        if (locked) {
          setError("These hours are approved for pay.")
          return
        }
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
          if (breakProblem) {
            setError(breakProblem)
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
          if (needsConfirm && !confirmUnusual) {
            setError(warnings.find((warning) => warning.level === "confirm")?.message || "Confirm the times.")
            return
          }
          setError("")
          setStep("review")
          return
        }
        const emailIssue = emailProblem(supervisorEmail, supervisorEmail, true)
        if (emailIssue) {
          setError(emailError(emailIssue))
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">Site</p>
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
            {shortShift ? (
              <label className="mt-2 flex min-h-12 items-center gap-3 text-sm font-semibold">
                <input type="radio" name="break" value="0" checked={breakMinutes === 0} onChange={() => setBreakChoice(0)} />
                No break
              </label>
            ) : null}
            <label className="mt-2 flex min-h-12 items-center gap-3 text-sm font-semibold">
              <input
                type="radio"
                name="break"
                value="30"
                checked={breakMinutes === STANDARD_BREAK_MINUTES}
                onChange={() => setBreakChoice(STANDARD_BREAK_MINUTES)}
              />
              30-minute break
            </label>
            {breakMinutes === STANDARD_BREAK_MINUTES ? (
              <label className="mt-2 block text-sm font-semibold" htmlFor="break-start">
                Break start time
                <select id="break-start" className={fieldClass} value={breakStart} onChange={(event) => setBreakStart(event.target.value)}>
                  <option value="">Choose a time</option>
                  {breakSlots.map((time) => (
                    <option key={time}>{time}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </fieldset>
          <p className="rounded-2xl bg-white px-3 py-3" data-testid="paid-hours">
            <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">Paid hours today</span>
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
          {locked ? (
            <p className="text-sm font-semibold">These hours are approved for pay. Call MS Workforce if something is wrong.</p>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight">Check these hours</h2>
          <p className="text-sm text-navy/70">
            {workerName} · {shift?.siteName} · {shift?.suburb}
          </p>
          <dl className="space-y-2 rounded-2xl bg-white px-3 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt>Date</dt>
              <dd className="text-right font-semibold">{shift ? formatDate(shift.workDate) : ""}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>Start</dt>
              <dd className="font-semibold">{start}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>Finish</dt>
              <dd className="font-semibold">{finish}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>Break</dt>
              <dd className="text-right font-semibold">{formatBreak(breakMinutes, breakStart)}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt>Total paid hours</dt>
              <dd className="font-semibold">{preview.ok ? formatHours(preview.hours) : "Check the times"}</dd>
            </div>
          </dl>
          {tasks.length ? <p className="text-sm">{tasks.join(", ")}</p> : null}
          <p className="text-sm">Incident reported: {incident ? "Yes" : "No"}</p>
          {hoursDirty && saved?.signaturePng ? (
            <p className="text-sm font-semibold">Changing the hours or the break clears the supervisor signature. They need to sign again.</p>
          ) : null}
          <h2 className="text-2xl font-semibold leading-tight tracking-tight">Site supervisor</h2>
          <p className="text-sm">Only the supervisor signs. Hand them the phone. No email is sent.</p>
          <label className="block text-sm font-semibold" htmlFor="sup-name">
            Supervisor name
            <input id="sup-name" className={fieldClass} value={supervisorName} onChange={(event) => setSupervisorName(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold" htmlFor="sup-email">
            Supervisor email
            <input id="sup-email" type="email" autoComplete="email" inputMode="email" className={fieldClass} value={supervisorEmail} onChange={(event) => setSupervisorEmail(event.target.value)} />
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
          <SignaturePad onChange={onSign} />
        </>
      )}
      {queued ? <p role="status" className="text-sm font-semibold text-teal-600">{queued}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {locked ? null : (
        <button className="pill pill-teal w-full" disabled={pending}>
          {step === "times" ? "Review hours" : pending ? "Sending" : "Sign and submit"}
        </button>
      )}
      {step === "review" ? (
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
