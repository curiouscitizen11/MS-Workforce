"use client"

import { useState, useTransition } from "react"
import { applyForWork } from "@/app/portal/actions"
import { Field, fieldClass } from "@/components/portal/ui"
import { DRIVER_CLASSES, HELD_CHOICES, ROLES } from "@/lib/portal/types"

const ticketFields = [
  ["whiteCard", "White card"],
  ["heights", "Work at heights"],
  ["asbestosA", "Asbestos Class A"],
  ["asbestosB", "Asbestos Class B"],
  ["confinedSpace", "Confined space"],
  ["firstAid", "First aid"],
] as const

export function ApplyForm() {
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()
  const [name, setName] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")
  const [suburb, setSuburb] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [experience, setExperience] = useState("")
  const [whatsappOk, setWhatsappOk] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [tickets, setTickets] = useState<Record<string, string>>({
    whiteCard: "Not held",
    heights: "Not held",
    asbestosA: "Not held",
    asbestosB: "Not held",
    confinedSpace: "Not held",
    firstAid: "Not held",
    driverLicence: "Not held",
  })

  if (done) {
    return (
      <div className="rounded-2xl bg-white p-4">
        <h2 className="text-2xl font-semibold">Thanks</h2>
        <p className="mt-2 text-sm leading-relaxed">Mav will call you within 2 business days.</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (step < 3) {
          setStep(step + 1)
          return
        }
        start(async () => {
          const result = await applyForWork({
            name,
            mobile,
            email,
            suburb,
            roles,
            experience,
            whatsappOk,
            privacyConsent: privacy,
            tickets,
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setDone(true)
        })
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Step {step + 1} of 4</p>
      {step === 0 ? (
        <>
          <Field label="Full name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Field label="Mobile" name="mobile" inputMode="tel" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
          <Field label="Email (helps if texts fail)" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Field label="Suburb" name="suburb" value={suburb} onChange={(event) => setSuburb(event.target.value)} required />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <fieldset>
            <legend className="text-sm font-semibold">Roles you want</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const on = roles.includes(role)
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={on}
                    className={"min-h-12 rounded-full border px-4 text-sm font-semibold " + (on ? "border-navy bg-navy text-white" : "border-navy/20 bg-white")}
                    onClick={() => setRoles(on ? roles.filter((item) => item !== role) : [...roles, role])}
                  >
                    {role}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold" htmlFor="experience">
            Short experience summary
            <textarea id="experience" className={fieldClass} rows={3} value={experience} onChange={(event) => setExperience(event.target.value)} />
          </label>
        </>
      ) : null}
      {step === 2 ? (
        <div className="space-y-3">
          {ticketFields.map(([key, label]) => (
            <label key={key} className="block text-sm font-semibold" htmlFor={key}>
              {label}
              <select
                id={key}
                className={fieldClass}
                value={tickets[key]}
                onChange={(event) => setTickets({ ...tickets, [key]: event.target.value })}
              >
                {HELD_CHOICES.map((choice) => (
                  <option key={choice}>{choice}</option>
                ))}
              </select>
            </label>
          ))}
          <label className="block text-sm font-semibold" htmlFor="driverLicence">
            Driver licence
            <select
              id="driverLicence"
              className={fieldClass}
              value={tickets.driverLicence}
              onChange={(event) => setTickets({ ...tickets, driverLicence: event.target.value })}
            >
              {DRIVER_CLASSES.map((choice) => (
                <option key={choice}>{choice}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="space-y-3 rounded-2xl bg-white p-4 text-sm leading-relaxed">
          <p>
            MS Workforce collects your name, mobile, tickets and right-to-work details to find you shifts. Read the{" "}
            <a className="font-semibold text-teal-600 underline" href="/privacy">
              privacy notice
            </a>
            .
          </p>
          <label className="flex min-h-12 items-center gap-3 font-semibold">
            <input type="checkbox" checked={whatsappOk} onChange={(event) => setWhatsappOk(event.target.checked)} />
            WhatsApp is OK
          </label>
          <label className="flex min-h-12 items-center gap-3 font-semibold">
            <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} required />
            I agree to the privacy notice
          </label>
          <p>Tax, bank and super details are not collected here. Pay is fortnightly, on Thursday, through Xero later.</p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        {step === 3 ? (pending ? "Sending" : "Submit application") : "Next"}
      </button>
      {step > 0 ? (
        <button type="button" className="min-h-12 w-full text-sm font-semibold text-teal-600" onClick={() => setStep(step - 1)}>
          Back
        </button>
      ) : null}
    </form>
  )
}
