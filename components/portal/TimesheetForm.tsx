"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { lodgeTimesheet } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import { emailError, emailProblem } from "@/lib/portal/email"
import { formatDate, formatTime } from "@/lib/portal/dates"
import { STANDARD_BREAK_MINUTES, breakChoiceProblem, formatBreak, formatHours, hoursSignStamp, hoursWarnings, paidHours, parseTime } from "@/lib/portal/hours"
import { workerCanEditTimesheet } from "@/lib/portal/timesheet-lock"
import { SUPERVISOR_ROLES } from "@/lib/portal/types"
import { WORK_DONE_MAX, workDoneProblem, workDoneText } from "@/lib/portal/work-done"

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
  tasks: string | string[]
  taskNote?: string
  incident: boolean
  incidentNote?: string
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
  tasks: string
  incident: boolean
  incidentNote?: string
  workerConfirmed: boolean
  confirmUnusualHours?: boolean
  supervisorName: string
  supervisorEmail: string
  supervisorRole: string
  supervisorConfirmed: boolean
  signaturePng: string
  signedHours: string
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

function snapBreak(minutes: number) {
  const snapped = Math.round(minutes / 5) * 5
  return Math.min(120, Math.max(0, snapped))
}

const TIMES = timeOptions()
const BREAK_MINUTES = Array.from({ length: 25 }, (_, index) => index * 5)

export type TimesheetGate = {
  hoursConfirmed: boolean
  signatureConfirmed: boolean
  signature: string | null
}

export function applyTimesheetGate(state: TimesheetGate, action: "confirm-hours" | "confirm-signature" | "edit-hours"): TimesheetGate {
  if (action === "confirm-hours") return { ...state, hoursConfirmed: true }
  if (action === "confirm-signature") {
    if (!state.hoursConfirmed || !state.signature) return state
    return { ...state, signatureConfirmed: true }
  }
  return { hoursConfirmed: false, signatureConfirmed: false, signature: null }
}

export function timesheetReadyToSubmit(state: TimesheetGate) {
  return state.hoursConfirmed && state.signatureConfirmed && Boolean(state.signature)
}

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
  const [hoursConfirmed, setHoursConfirmed] = useState(false)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)
  const [workDate, setWorkDate] = useState(opening?.workDate || today)
  const dayShifts = shifts.filter((shift) => shift.workDate === workDate)
  const [offerId, setOfferId] = useState(opening?.id || "")
  const shift = dayShifts.find((item) => item.id === offerId) || dayShifts[0]
  const saved = findSaved(savedSheets, shift?.id)
  const [start, setStart] = useState(openingSaved?.start || opening?.start || "07:00")
  const [finish, setFinish] = useState(openingSaved?.finish || opening?.finish || "15:30")
  const [breakMinutes, setBreakMinutes] = useState(snapBreak(openingSaved?.breakMinutes ?? STANDARD_BREAK_MINUTES))
  const [breakStart, setBreakStart] = useState(openingSaved?.breakStart || "12:00")
  const [workDone, setWorkDone] = useState(workDoneText(openingSaved?.tasks, openingSaved?.taskNote))
  const [incident, setIncident] = useState<boolean | null>(openingSaved ? openingSaved.incident : null)
  const [incidentNote, setIncidentNote] = useState(openingSaved?.incidentNote || "")
  const [confirmUnusual, setConfirmUnusual] = useState(false)
  const [supervisorName, setSupervisorName] = useState(openingSaved?.supervisorName || opening?.signer || "")
  const [supervisorEmail, setSupervisorEmail] = useState(openingSaved?.supervisorEmail || "")
  const [role, setRole] = useState(openingSaved?.supervisorRole || opening?.signerRole || "Site supervisor")
  const [roleNote, setRoleNote] = useState("")
  const [supervisorConfirmed, setSupervisorConfirmed] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [padKey, setPadKey] = useState(0)
  const [picker, setPicker] = useState<"start" | "finish" | "break" | "break-start" | null>(null)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [queued, setQueued] = useState("")
  const [pending, startTransition] = useTransition()
  const savedSheetsRef = useRef(savedSheets)
  const signedHours = useRef<string | null>(
    openingSaved?.signaturePng
      ? [openingSaved.start, openingSaved.finish, String(openingSaved.breakMinutes), openingSaved.breakStart || ""].join("|")
      : null,
  )
  const recordedBreak = breakMinutes === 0 ? "" : breakStart
  const hoursKey = [start, finish, String(breakMinutes), recordedBreak].join("|")
  const hoursDirty =
    !saved ||
    saved.start !== start ||
    saved.finish !== finish ||
    saved.breakMinutes !== breakMinutes ||
    (saved.breakStart || "") !== recordedBreak
  const locked = !workerCanEditTimesheet(saved?.status) && Boolean(saved)
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
      const draft = JSON.parse(raw) as {
        offerId?: string
        start?: string
        finish?: string
        workDate?: string
        breakMinutes?: number
        breakStart?: string
        workDone?: string
        tasks?: string | string[]
      }
      if (findSaved(savedSheetsRef.current, draft.offerId)) return
      if (draft.workDate) setWorkDate(draft.workDate)
      if (draft.offerId) setOfferId(draft.offerId)
      if (draft.start) setStart(draft.start)
      if (draft.finish) setFinish(draft.finish)
      if (typeof draft.breakMinutes === "number") setBreakMinutes(snapBreak(draft.breakMinutes))
      if (draft.breakStart) setBreakStart(draft.breakStart)
      if (typeof draft.workDone === "string") setWorkDone(draft.workDone)
      else if (draft.tasks) setWorkDone(workDoneText(draft.tasks))
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
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ offerId, workDate, start, finish, breakMinutes, breakStart, workDone, incident }))
  }, [offerId, workDate, start, finish, breakMinutes, breakStart, workDone, incident])

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
    setBreakMinutes(snapBreak(prior?.breakMinutes ?? STANDARD_BREAK_MINUTES))
    setBreakStart(prior?.breakStart || "12:00")
    setHoursConfirmed(false)
    setSignatureConfirmed(false)
    setWorkDone(workDoneText(prior?.tasks, prior?.taskNote))
    setIncident(prior ? prior.incident : null)
    setIncidentNote(prior?.incidentNote || "")
    setSupervisorName(prior?.supervisorName || next.signer)
    setSupervisorEmail(prior?.supervisorEmail || "")
    setRole(prior?.supervisorRole || next.signerRole || "Site supervisor")
    setSupervisorConfirmed(false)
    setSignature(null)
    signedHours.current = prior?.signaturePng
      ? [prior.start, prior.finish, String(prior.breakMinutes), prior.breakStart || ""].join("|")
      : null
  }

  function onSign(value: string | null) {
    setSignature(value)
    signedHours.current = value ? hoursKey : signedHours.current
  }

  function hoursProblem() {
    if (!shift) return "No accepted shift on that day."
    if (workDate > today) return "That date has not happened yet."
    if (!preview.ok) return preview.error
    if (breakProblem) return breakProblem
    if (incident === null) return "Say whether there was an incident today."
    if (incident && !incidentNote.trim()) return "Tell us what happened."
    const doneProblem = workDoneProblem(workDone)
    if (doneProblem) return doneProblem
    if (needsConfirm && !confirmUnusual) return warnings.find((warning) => warning.level === "confirm")?.message || "Confirm the times."
    return ""
  }

  function confirmHours() {
    const problem = hoursProblem()
    if (problem) {
      setError(problem)
      return
    }
    setError("")
    setHoursConfirmed(true)
  }

  function confirmSignature() {
    if (signatureConfirmed) return
    const emailIssue = emailProblem(supervisorEmail, supervisorEmail, true)
    if (emailIssue) {
      setError(emailError(emailIssue))
      return
    }
    if (!supervisorName.trim()) {
      setError("The supervisor needs to type their name.")
      return
    }
    if (!signature) {
      setError("The supervisor needs to sign on the screen.")
      return
    }
    if (!supervisorConfirmed) {
      setError("The supervisor needs to tick the hours as correct.")
      return
    }
    setError("")
    setSignatureConfirmed(true)
  }

  const closePicker = useCallback(() => setPicker(null), [])

  function openPicker(next: "start" | "finish" | "break" | "break-start", value: string) {
    setDraft(value)
    setPicker(next)
  }

  function applyPicker() {
    if (picker === "start") setStart(draft)
    if (picker === "finish") setFinish(draft)
    if (picker === "break") {
      const minutes = Number(draft)
      setBreakMinutes(minutes)
      if (minutes === 0) setBreakStart("")
      else if (!breakStart) setBreakStart("12:00")
    }
    if (picker === "break-start") setBreakStart(draft)
    setPicker(null)
  }

  function editHours() {
    setHoursConfirmed(false)
    setSignatureConfirmed(false)
    setSupervisorConfirmed(false)
    setSignature(null)
    setPadKey((key) => key + 1)
    signedHours.current = null
    setError("")
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
      tasks: workDone.trim(),
      incident,
      incidentNote: incident ? incidentNote : undefined,
      workerConfirmed: true,
      supervisorEmail,
      confirmUnusualHours: needsConfirm ? confirmUnusual : undefined,
      supervisorName,
      supervisorRole: role,
      supervisorConfirmed,
      signaturePng,
      signedHours: hoursSignStamp({ start, finish, breakMinutes, breakStart: breakMinutes === 0 ? "" : breakStart }),
    }
  }

  const ready = timesheetReadyToSubmit({ hoursConfirmed, signatureConfirmed, signature })

  return (
    <form
      className="space-y-4"
      data-screen={hoursConfirmed ? (signatureConfirmed ? "ready" : "sign") : "hours"}
      onSubmit={(event) => {
        event.preventDefault()
        if (locked) {
          setError("These hours are approved for pay.")
          return
        }
        if (!ready) {
          setError("Confirm the hours and the signature before you submit.")
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
      <section className="rounded-2xl border border-navy/10 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">Site</p>
        {dayShifts.length > 1 && !hoursConfirmed ? (
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
            <p className="text-sm text-navy/70">{shift ? shift.suburb + " · " + shift.builder : "Accept a shift first."}</p>
          </>
        )}
      </section>
      {locked ? (
        <p className="text-sm font-semibold" data-testid="timesheet-locked">
          These hours are approved for pay. You can&apos;t change them.
        </p>
      ) : hoursConfirmed ? (
        <HoursSummary
          date={shift ? formatDate(shift.workDate) : ""}
          start={start}
          finish={finish}
          breakLabel={formatBreak(breakMinutes, recordedBreak)}
          paid={preview.ok ? formatHours(preview.hours) + " hours" : "Check the times"}
          workDone={workDone.trim()}
          incident={incident}
        />
      ) : (
        <>
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
          <div className="flex gap-2" data-testid="hours-line">
            <PickChip id="start" label="Start" value={formatTime(start)} onClick={() => openPicker("start", start)} />
            <PickChip id="finish" label="Finish" value={formatTime(finish)} onClick={() => openPicker("finish", finish)} />
            <PickChip
              id="break-minutes"
              label="Break"
              value={breakMinutes === 0 ? "None" : breakMinutes + " min"}
              onClick={() => openPicker("break", String(breakMinutes))}
            />
          </div>
          {breakMinutes > 0 ? (
            <PickChip
              id="break-start"
              label="Break starts"
              value={breakStart ? formatTime(breakStart) : "Choose"}
              wide
              onClick={() => openPicker("break-start", breakStart)}
            />
          ) : null}
          {picker ? (
            <PickerSheet
              title={picker === "start" ? "Start" : picker === "finish" ? "Finish" : picker === "break" ? "Break" : "Break starts"}
              onClose={closePicker}
              onDone={applyPicker}
            >
              <Wheel
                value={draft}
                options={
                  picker === "break"
                    ? BREAK_MINUTES.map((minutes) => ({ value: String(minutes), label: minutes === 0 ? "None" : minutes + " min" }))
                    : (picker === "break-start" ? breakSlots : TIMES).map((time) => ({ value: time, label: formatTime(time) }))
                }
                onChange={setDraft}
              />
            </PickerSheet>
          ) : null}
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
          <label className="block text-sm font-semibold" htmlFor="work-done">
            What did you do today?
            <textarea
              id="work-done"
              maxLength={WORK_DONE_MAX}
              rows={3}
              required
              placeholder="e.g. Stripped ceiling sheets in unit 4"
              className={fieldClass}
              value={workDone}
              onChange={(event) => setWorkDone(event.target.value)}
            />
            <span className="mt-1 block text-xs font-normal text-navy/70">
              {workDone.length}/{WORK_DONE_MAX}
            </span>
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Were you injured, or was there an incident or near miss today?</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
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
          <button type="button" className="pill pill-teal w-full" onClick={confirmHours}>
            Confirm hours
          </button>
        </>
      )}
      {hoursConfirmed && !locked ? (
        <section className="space-y-3" data-testid="signature-section">
          <div className="flex justify-end">
            <button type="button" className="min-h-12 px-3 text-sm font-semibold text-teal-600" onClick={editHours}>
              Edit hours
            </button>
          </div>
          <p className="text-sm">Hand the phone to your site supervisor to sign.</p>
          {signatureConfirmed ? (
            <p className="rounded-2xl bg-white px-3 py-3 text-sm font-semibold" data-testid="signature-locked">
              Signature confirmed for {supervisorName || "the supervisor"}.
            </p>
          ) : (
            <>
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
                <div className="mt-2 flex flex-wrap gap-3">
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
              <SignaturePad key={padKey} onChange={onSign} />
              <button type="button" className="pill pill-line-dark w-full" onClick={confirmSignature}>
                Confirm signature
              </button>
            </>
          )}
        </section>
      ) : null}
      {queued ? <p role="status" className="text-sm font-semibold text-teal-600">{queued}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {hoursDirty && saved?.signaturePng && !signatureConfirmed ? (
        <p className="text-sm font-semibold">Changing the hours clears the supervisor signature. They need to sign again.</p>
      ) : null}
      {locked ? null : (
        <button className="pill pill-teal w-full" data-testid="submit-timesheet" disabled={!ready || pending}>
          {pending ? "Sending" : "Submit timesheet"}
        </button>
      )}
    </form>
  )
}

function HoursSummary({
  date,
  start,
  finish,
  breakLabel,
  paid,
  workDone,
  incident,
}: {
  date: string
  start: string
  finish: string
  breakLabel: string
  paid: string
  workDone: string
  incident: boolean | null
}) {
  return (
    <dl className="space-y-2 rounded-2xl border border-navy/10 bg-white px-3 py-3 text-sm" data-testid="hours-summary">
      <div className="flex items-start justify-between gap-3">
        <dt>Date</dt>
        <dd className="text-right font-semibold">{date}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>Start</dt>
        <dd className="font-semibold">{formatTime(start)}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>Finish</dt>
        <dd className="font-semibold">{formatTime(finish)}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>Break</dt>
        <dd className="text-right font-semibold">{breakLabel}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>Paid hours</dt>
        <dd className="font-semibold">{paid}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>What they did</dt>
        <dd className="text-right font-semibold">{workDone}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>Incident</dt>
        <dd className="font-semibold">{incident ? "Yes" : "No"}</dd>
      </div>
    </dl>
  )
}

function PickChip({
  id,
  label,
  value,
  onClick,
  wide = false,
}: {
  id: string
  label: string
  value: string
  onClick: () => void
  wide?: boolean
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={(wide ? "w-full" : "min-w-0 flex-1") + " flex min-h-12 flex-col items-center justify-center rounded-2xl border border-navy/15 bg-white px-1 py-1 text-navy"}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/60">{label}</span>
      <span className="text-sm font-semibold leading-tight">{value}</span>
    </button>
  )
}

function PickerSheet({
  title,
  onClose,
  onDone,
  children,
}: {
  title: string
  onClose: () => void
  onDone: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])
  return (
    <div className="portal-sheet-backdrop" onClick={onClose}>
      <div
        className="portal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid="time-picker"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="portal-sheet-bar">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" className="portal-sheet-close" onClick={onClose}>
            Cancel
          </button>
        </div>
        <div className="portal-sheet-body">{children}</div>
        <div className="portal-sheet-foot">
          <button type="button" className="pill pill-teal w-full" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Wheel({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const list = useRef<HTMLDivElement>(null)
  const ready = useRef(false)
  useEffect(() => {
    const root = list.current
    if (!root) return
    const align = () => {
      const selected = root.querySelector("[aria-selected='true']") as HTMLElement | null
      if (!selected) return
      root.scrollTop = Math.max(0, selected.offsetTop - root.clientHeight / 2 + selected.clientHeight / 2)
    }
    align()
    const frame = window.requestAnimationFrame(() => {
      align()
      ready.current = true
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-2 top-1/2 h-12 -translate-y-1/2 rounded-xl border border-teal-600 bg-teal-600/20" aria-hidden="true" />
      <div
        role="listbox"
        aria-label="Choose"
        ref={list}
        className="h-36 overflow-y-auto"
        style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
        onScroll={(event) => {
          if (!ready.current) return
          const root = event.currentTarget
          const mid = root.scrollTop + root.clientHeight / 2
          let nearest = ""
          let best = Number.POSITIVE_INFINITY
          for (const node of root.querySelectorAll<HTMLButtonElement>("[data-value]")) {
            const center = node.offsetTop + node.clientHeight / 2
            const distance = Math.abs(center - mid)
            if (distance < best) {
              best = distance
              nearest = node.dataset.value || ""
            }
          }
          if (nearest && nearest !== value) onChange(nearest)
        }}
      >
        <div aria-hidden="true" className="h-12" />
        {options.map((option) => {
          const on = option.value === value
          return (
            <button
              key={option.value || "empty"}
              type="button"
              role="option"
              data-value={option.value}
              aria-selected={on}
              className={"relative z-10 flex min-h-12 w-full snap-center items-center justify-center text-base font-semibold " + (on ? "text-navy" : "text-navy/45")}
              style={{ scrollSnapAlign: "center" }}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
        <div aria-hidden="true" className="h-12" />
      </div>
    </div>
  )
}

function chip(on: boolean) {
  return (
    "min-h-12 rounded-full border px-3 text-sm font-semibold " +
    (on ? "border-teal-600 bg-teal-600 text-navy" : "border-navy/15 bg-white text-navy")
  )
}
