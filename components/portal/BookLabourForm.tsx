"use client"

import { useState, useTransition } from "react"
import { sendBookLabour } from "@/app/portal/actions"
import { BOOK_ROLES, HEARD_OPTIONS } from "@/lib/portal/book-labour"
import { TickIcon, Field, fieldClass } from "@/components/portal/ui"

const PRIVACY =
  "We use these details to reply to your request, quote and organise workers. They're stored in our private Notion workspace (USA). We won't share them or add you to a mailing list. Questions or deletion requests: hello@msworkforce.au."

export function BookLabourForm() {
  const [startedAt] = useState(() => Date.now())
  const [company, setCompany] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [suburb, setSuburb] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [otherRole, setOtherRole] = useState("")
  const [workers, setWorkers] = useState("")
  const [start, setStart] = useState("")
  const [ongoing, setOngoing] = useState(false)
  const [end, setEnd] = useState("")
  const [shift, setShift] = useState("")
  const [notes, setNotes] = useState("")
  const [heard, setHeard] = useState("")
  const [website, setWebsite] = useState("")
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)
  const [pending, startSend] = useTransition()

  if (sent) {
    return (
      <div className="portal-panel space-y-3">
        <p className="text-sm leading-relaxed">
          Thanks, {name.trim()}, we&apos;ve got your request. We&apos;ll call you on {phone.trim()} to confirm the details, availability and rates, usually the same business day.
        </p>
        <p className="text-sm leading-relaxed">Want to book again or track requests? A client login is coming.</p>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError("")
        startSend(async () => {
          const result = await sendBookLabour({
            company,
            name,
            phone,
            email,
            address,
            suburb,
            roles,
            otherRole,
            workers: Number(workers),
            start,
            ongoing,
            end: ongoing ? "" : end,
            shift,
            notes,
            heard,
            companyWebsite: website,
            startedAt,
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setSent(true)
        })
      }}
    >
      <Field label="Company name" name="company" value={company} onChange={(event) => setCompany(event.target.value)} required />
      <Field label="Your name" name="contact-name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Field label="Phone" name="phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
      <Field label="Email" name="email" type="text" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <Field label="Site address" name="address" placeholder="Street address" autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} required />
      <Field label="Suburb" name="suburb" value={suburb} onChange={(event) => setSuburb(event.target.value)} required />
      <fieldset>
        <legend className="text-sm font-semibold">What roles do you need?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BOOK_ROLES.map((role) => {
            const on = roles.includes(role)
            return (
              <button
                key={role}
                type="button"
                aria-pressed={on}
                className={"portal-role" + (on ? " portal-role-on" : "")}
                onClick={() => setRoles(on ? roles.filter((item) => item !== role) : [...roles, role])}
              >
                {on ? <TickIcon /> : null}
                {role}
              </button>
            )
          })}
        </div>
      </fieldset>
      {roles.includes("Other") ? (
        <Field label="Other role: tell us a bit more" name="other-role" value={otherRole} onChange={(event) => setOtherRole(event.target.value)} required />
      ) : null}
      <Field label="How many workers?" name="workers" inputMode="numeric" value={workers} onChange={(event) => setWorkers(event.target.value.replace(/\D/g, "").slice(0, 2))} required />
      <label className="block text-sm font-semibold" htmlFor="start-date">
        Start date
        <input id="start-date" className={fieldClass} type="date" value={start} onChange={(event) => setStart(event.target.value)} required />
      </label>
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={ongoing}
          onChange={(event) => {
            setOngoing(event.target.checked)
            if (event.target.checked) setEnd("")
          }}
        />
        Ongoing / no fixed end date
      </label>
      {ongoing ? null : (
        <label className="block text-sm font-semibold" htmlFor="end-date">
          End date
          <input id="end-date" className={fieldClass} type="date" value={end} onChange={(event) => setEnd(event.target.value)} required />
        </label>
      )}
      <Field
        label="Shift and start time"
        name="shift"
        placeholder="e.g. Mon–Fri, 7:00 am start, 8-hour days"
        value={shift}
        onChange={(event) => setShift(event.target.value)}
        required
      />
      <label className="block text-sm font-semibold" htmlFor="notes">
        Anything else we should know?
        <textarea
          id="notes"
          className={fieldClass}
          rows={3}
          placeholder="Tasks, site conditions, access and parking, or anything specific you need"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="heard">
        How did you hear about us?
        <select id="heard" className={fieldClass} value={heard} onChange={(event) => setHeard(event.target.value)}>
          <option value="">Choose one</option>
          {HEARD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this blank
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
        </label>
      </div>
      <p className="text-sm leading-relaxed">{PRIVACY}</p>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        {pending ? "Sending" : "Send request"}
      </button>
    </form>
  )
}
