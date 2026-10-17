"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { lodgeTimesheet } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import { hoursWarnings, paidHours } from "@/lib/portal/hours"

export function TimesheetForm({
  offerId,
  workDate,
  startDefault,
  finishDefault,
  breakDefault,
}: {
  offerId: string
  workDate: string
  startDefault: string
  finishDefault: string
  breakDefault: number
}) {
  const router = useRouter()
  const [start, setStart] = useState(startDefault)
  const [finish, setFinish] = useState(finishDefault)
  const [breakMinutes, setBreakMinutes] = useState(String(breakDefault))
  const [step, setStep] = useState<"times" | "sign">("times")
  const [name, setName] = useState("")
  const [role, setRole] = useState("Site supervisor")
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()
  const preview = useMemo(() => paidHours(start, finish, Number(breakMinutes)), [start, finish, breakMinutes])

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (step === "times") {
          if (!preview.ok) {
            setError(preview.error)
            return
          }
          setError("")
          setStep("sign")
          return
        }
        startTransition(async () => {
          const result = await lodgeTimesheet({
            offerId,
            workDate,
            start,
            finish,
            breakMinutes: Number(breakMinutes),
            supervisorName: name,
            supervisorRole: role,
            signaturePng: signature || undefined,
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push("/portal/timesheet/" + result.id)
          router.refresh()
        })
      }}
    >
      {step === "times" ? (
        <>
          <label className="block text-sm font-semibold" htmlFor="start">
            Start
            <input id="start" type="time" className={fieldClass} value={start} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold" htmlFor="finish">
            Finish
            <input id="finish" type="time" className={fieldClass} value={finish} onChange={(event) => setFinish(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold" htmlFor="break">
            Unpaid break (minutes)
            <input
              id="break"
              inputMode="numeric"
              className={fieldClass}
              value={breakMinutes}
              onChange={(event) => setBreakMinutes(event.target.value)}
            />
          </label>
          <p className="text-3xl font-semibold tracking-tight">{preview.ok ? preview.hours + " hours" : "Check the times"}</p>
          {preview.ok
            ? hoursWarnings(preview.hours).map((warning) => (
                <p key={warning} className="text-sm font-semibold text-[#B45309]">
                  {warning}
                </p>
              ))
            : null}
        </>
      ) : (
        <>
          <p className="rounded-2xl bg-navy px-4 py-3 text-sm font-semibold leading-relaxed text-white">
            Hand your phone to the site supervisor. Their signature is the approval.
          </p>
          <label className="block text-sm font-semibold" htmlFor="sup-name">
            Supervisor name
            <input id="sup-name" className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="block text-sm font-semibold" htmlFor="sup-role">
            Role
            <input id="sup-role" className={fieldClass} value={role} onChange={(event) => setRole(event.target.value)} />
          </label>
          <SignaturePad onChange={setSignature} />
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        {step === "times" ? "Hand phone to supervisor" : pending ? "Sending" : "Submit signed hours"}
      </button>
    </form>
  )
}
