"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { checkJoinCode, sendJoinCodeAgain, sendJoinDetails } from "@/app/portal/actions"
import { TickIcon, Field, fieldClass } from "@/components/portal/ui"
import { emailError, emailProblem } from "@/lib/portal/email"
import { toE164 } from "@/lib/portal/phone"
import { ROLES } from "@/lib/portal/types"

export function JoinForm({
  initialName = "",
  initialMobile = "",
  inviteToken = "",
  expired = false,
}: {
  initialName?: string
  initialMobile?: string
  inviteToken?: string
  expired?: boolean
}) {
  const router = useRouter()
  const [step, setStep] = useState<"details" | "code">("details")
  const [error, setError] = useState("")
  const [joined, setJoined] = useState(false)
  const [pending, start] = useTransition()
  const [name, setName] = useState(initialName)
  const [mobile, setMobile] = useState(initialMobile)
  const [email, setEmail] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")
  const [suburb, setSuburb] = useState("")
  const [postcode, setPostcode] = useState("")
  const [roles, setRoles] = useState<string[]>([])
  const [experience, setExperience] = useState("")
  const [privacy, setPrivacy] = useState(false)
  const [code, setCode] = useState("")
  const [devCode, setDevCode] = useState("")
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  function already(message: string, codeName?: string) {
    if (codeName === "exists" || message.startsWith("Looks like you've already joined")) {
      setJoined(true)
      setError("")
      return true
    }
    return false
  }

  if (joined) {
    return (
      <div className="portal-panel space-y-3">
        <h2 className="text-lg font-semibold">Looks like you&apos;ve already joined. Log in instead.</h2>
        <a className="pill pill-teal w-full" href="/portal/login">
          Log in
        </a>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError("")
        if (step === "code") {
          start(async () => {
            const result = await checkJoinCode(code)
            if (!result.ok) {
              if (already(result.error, "code" in result ? String(result.code) : undefined)) return
              setError(result.error)
              return
            }
            router.push(result.next)
            router.refresh()
          })
          return
        }
        if (name.trim().length < 2 || suburb.trim().length < 2) {
          setError("Check the form and try again.")
          return
        }
        if (!/^\d{4}$/.test(postcode.trim())) {
          setError("Enter a 4-digit postcode.")
          return
        }
        if (!toE164(mobile)) {
          setError("Enter an Australian mobile, like 0400 000 000.")
          return
        }
        const emailIssue = emailError(emailProblem(email, confirmEmail))
        if (emailIssue) {
          setError(emailIssue)
          return
        }
        if (roles.length === 0) {
          setError("Choose at least one role.")
          return
        }
        if (!privacy) {
          setError("Tick the privacy box to continue.")
          return
        }
        start(async () => {
          const result = await sendJoinDetails({
            name,
            mobile,
            email: email.trim(),
            confirmEmail: confirmEmail.trim(),
            suburb,
            postcode: postcode.trim(),
            roles,
            experience,
            privacyConsent: true,
            inviteToken: inviteToken || undefined,
          })
          if (!result.ok) {
            if (already(result.error, "code" in result ? String(result.code) : undefined)) return
            setError(result.error)
            return
          }
          setDevCode(result.devCode || "")
          setWait(30)
          setStep("code")
        })
      }}
    >
      {step === "details" ? (
        <>
          {expired ? <p className="portal-banner text-sm">That link has expired. You can still apply</p> : null}
          <Field label="Full name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Field label="Mobile" name="mobile" inputMode="tel" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
          <Field label="Email (helps if texts fail)" name="email" type="text" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Field label="Confirm email" name="confirmEmail" type="text" inputMode="email" autoComplete="email" value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} />
          <Field label="Suburb" name="suburb" value={suburb} onChange={(event) => setSuburb(event.target.value)} required />
          <Field label="Postcode" name="postcode" inputMode="numeric" autoComplete="postal-code" value={postcode} onChange={(event) => setPostcode(event.target.value)} required />
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
          <label className="block text-sm font-semibold" htmlFor="experience">
            Short experience summary
            <textarea id="experience" className={fieldClass} rows={3} value={experience} onChange={(event) => setExperience(event.target.value)} />
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} required />
            I agree to the privacy notice
          </label>
          {error ? (
            <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
              {error}
            </p>
          ) : null}
          <button className="pill pill-teal w-full" disabled={pending}>
            {pending ? "Sending" : "Send code"}
          </button>
        </>
      ) : (
        <>
          <Field
            label="6-digit code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          {devCode ? <p className="portal-banner text-sm">Demo code {devCode}</p> : null}
          {error ? (
            <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
              {error}
            </p>
          ) : null}
          <button className="pill pill-teal w-full" disabled={pending || code.length !== 6}>
            {pending ? "Checking" : "Check code"}
          </button>
          <button
            type="button"
            className="pill pill-line w-full"
            disabled={pending || wait > 0}
            onClick={() => {
              setError("")
              start(async () => {
                const result = await sendJoinCodeAgain()
                if (!result.ok) {
                  if (already(result.error, "code" in result ? String(result.code) : undefined)) return
                  setError(result.error)
                  return
                }
                setDevCode(result.devCode || "")
                setWait(30)
              })
            }}
          >
            {wait > 0 ? "Send again in " + wait + "s" : "Send again"}
          </button>
        </>
      )}
    </form>
  )
}
