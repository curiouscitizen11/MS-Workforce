"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { checkAdminCode, checkEmailLoginCode, checkLoginCode, sendEmailLoginCode, sendLoginCode, sendMagicLink } from "@/app/portal/actions"
import { Field, fieldClass } from "@/components/portal/ui"
import { emailError, emailProblem } from "@/lib/portal/email"

type Step = "email" | "code" | "link" | "mobile"

export function LoginForm({
  mock,
  sms,
  demos,
  initialEmail = "",
  initialMobile = "",
}: {
  mock: boolean
  sms: boolean
  demos: { name: string; email: string; mobile: string; hint: string }[]
  initialEmail?: string
  initialMobile?: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [mobile, setMobile] = useState(initialMobile)
  const [code, setCode] = useState("")
  const [channel, setChannel] = useState<"email" | "sms">("email")
  const [devCode, setDevCode] = useState("")
  const [devLink, setDevLink] = useState("")
  const [linkSent, setLinkSent] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState<Step>("email")
  const [pending, start] = useTransition()
  const tried = useRef("")
  const busy = useRef(false)

  function submitCode(nextCode: string) {
    if (busy.current || !/^\d{6}$/.test(nextCode)) return
    busy.current = true
    setError("")
    start(async () => {
      const result = channel === "sms" ? await checkLoginCode(mobile, nextCode) : await checkEmailLoginCode(email, nextCode)
      if (!result.ok) {
        busy.current = false
        tried.current = ""
        setError(result.error)
        return
      }
      router.push(result.next)
      router.refresh()
    })
  }

  useEffect(() => {
    if (step !== "code" || !/^\d{6}$/.test(code) || tried.current === code) return
    tried.current = code
    submitCode(code)
    // submitCode closes over the latest email, mobile and router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step])

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError("")
        if (step === "code") {
          submitCode(code)
          return
        }
        start(async () => {
          if (step === "link") {
            const emailIssue = emailError(emailProblem(email, confirmEmail, true))
            if (emailIssue) {
              setError(emailIssue)
              return
            }
            const result = await sendMagicLink(email.trim(), confirmEmail.trim())
            if (!result.ok) {
              setError(result.error)
              return
            }
            setDevLink(result.devLink || "")
            setLinkSent(true)
            return
          }
          if (step === "mobile") {
            const result = await sendLoginCode(mobile)
            if (!result.ok) {
              setError(result.error)
              return
            }
            setChannel("sms")
            setDevCode(result.devCode || "")
            setCode("")
            tried.current = ""
            setStep("code")
            return
          }
          const emailIssue = emailError(emailProblem(email, email, true))
          if (emailIssue) {
            setError(emailIssue)
            return
          }
          const result = await sendEmailLoginCode(email.trim())
          if (!result.ok) {
            setError(result.error)
            return
          }
          setChannel("email")
          setDevCode(result.devCode || "")
          setCode("")
          tried.current = ""
          setStep("code")
        })
      }}
    >
      {step === "email" || step === "link" ? (
        <Field
          label="Email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      ) : null}
      {step === "link" ? (
        <Field
          label="Confirm email"
          name="confirmEmail"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={confirmEmail}
          onChange={(event) => setConfirmEmail(event.target.value)}
        />
      ) : null}
      {step === "mobile" ? (
        <Field
          label="Mobile"
          name="mobile"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0400 000 000"
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
        />
      ) : null}
      {step === "code" ? (
        <label className="block" htmlFor="code">
          <span className="text-sm font-semibold">6-digit code</span>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            className={fieldClass}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          {devCode ? (
            <span className="portal-banner mt-2 block text-sm">Demo code {devCode}</span>
          ) : (
            <span className="mt-2 block text-sm text-navy/70">
              {channel === "sms"
                ? "We sent a code by text. It lasts 10 minutes."
                : "We sent a code to your email. It lasts 10 minutes."}
            </span>
          )}
        </label>
      ) : null}
      {devLink ? (
        <a className="block text-sm font-semibold text-teal-600 underline" href={devLink}>
          Open the demo login link
        </a>
      ) : null}
      {linkSent && !devLink ? <p className="text-sm">Check your email for a login link. It lasts 30 minutes.</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" type="submit" disabled={pending}>
        {pending ? "Please wait" : step === "code" ? "Log in" : step === "link" ? "Email me a link" : "Send code"}
      </button>
      {step === "email" ? (
        <button type="button" className="min-h-12 w-full text-sm font-semibold text-teal-600" onClick={() => setStep("link")}>
          Email me a link instead
        </button>
      ) : null}
      {step === "email" && sms ? (
        <button
          type="button"
          className="min-h-12 w-full text-sm font-semibold text-teal-600"
          onClick={() => {
            setStep("mobile")
            setError("")
          }}
        >
          Text me a code instead
        </button>
      ) : null}
      {step !== "email" ? (
        <button
          type="button"
          className="min-h-12 w-full text-sm font-semibold text-teal-600"
          onClick={() => {
            setStep("email")
            setChannel("email")
            setDevLink("")
            setLinkSent(false)
            setError("")
            setCode("")
            tried.current = ""
          }}
        >
          Use my email instead
        </button>
      ) : null}
      {mock && step === "email" ? (
        <div className="rounded-2xl bg-white p-3 text-sm">
          <p className="font-semibold">Demo logins</p>
          <ul className="mt-2 space-y-1 text-navy/80">
            {demos.map((demo) => (
              <li key={demo.email || demo.mobile}>
                <button type="button" className="min-h-12 text-left font-semibold text-navy" onClick={() => setEmail(demo.email)}>
                  {demo.name} · {demo.email}
                </button>
                <span className="block text-xs">{demo.hint}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  )
}

export function AdminCodeForm({ devCode }: { devCode?: string }) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        start(async () => {
          const result = await checkAdminCode(code)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push(result.next)
          router.refresh()
        })
      }}
    >
      <label className="block" htmlFor="admin-code">
        <span className="text-sm font-semibold">Authenticator code</span>
        <input
          id="admin-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className={fieldClass}
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </label>
      {devCode ? <p className="portal-banner text-sm">Demo code {devCode}</p> : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Continue
      </button>
    </form>
  )
}
