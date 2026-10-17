"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { checkAdminCode, checkLoginCode, sendLoginCode, sendMagicLink } from "@/app/portal/actions"
import { Field, fieldClass } from "@/components/portal/ui"

export function LoginForm({
  mock,
  demos,
}: {
  mock: boolean
  demos: { name: string; mobile: string; hint: string }[]
}) {
  const router = useRouter()
  const [mobile, setMobile] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [devCode, setDevCode] = useState("")
  const [devLink, setDevLink] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<"mobile" | "code" | "email">("mobile")
  const [pending, start] = useTransition()

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError("")
        start(async () => {
          if (step === "email") {
            const result = await sendMagicLink(email)
            if (!result.ok) {
              setError(result.error)
              return
            }
            setDevLink(result.devLink || "")
            setError("")
            return
          }
          if (step === "mobile") {
            const result = await sendLoginCode(mobile)
            if (!result.ok) {
              setError(result.error)
              return
            }
            setDevCode(result.devCode || "")
            setStep("code")
            return
          }
          const result = await checkLoginCode(mobile, code)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push(result.next)
          router.refresh()
        })
      }}
    >
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
            <span className="mt-2 block rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-navy">
              Demo code {devCode}
            </span>
          ) : (
            <span className="mt-2 block text-sm text-navy/70">We sent a code by text. It lasts 10 minutes.</span>
          )}
        </label>
      ) : null}
      {step === "email" ? (
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      ) : null}
      {devLink ? (
        <a className="block text-sm font-semibold text-teal-600 underline" href={devLink}>
          Open the demo login link
        </a>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" type="submit" disabled={pending}>
        {pending ? "Please wait" : step === "code" ? "Log in" : step === "email" ? "Email me a link" : "Send code"}
      </button>
      {step === "mobile" ? (
        <button type="button" className="min-h-12 w-full text-sm font-semibold text-teal-600" onClick={() => setStep("email")}>
          Email me a link instead
        </button>
      ) : (
        <button
          type="button"
          className="min-h-12 w-full text-sm font-semibold text-teal-600"
          onClick={() => {
            setStep("mobile")
            setDevLink("")
            setError("")
          }}
        >
          Use my mobile instead
        </button>
      )}
      {mock && step === "mobile" ? (
        <div className="rounded-2xl bg-white p-3 text-sm">
          <p className="font-semibold">Demo logins</p>
          <ul className="mt-2 space-y-1 text-navy/80">
            {demos.map((demo) => (
              <li key={demo.mobile}>
                <button type="button" className="min-h-12 text-left font-semibold text-navy" onClick={() => setMobile(demo.mobile)}>
                  {demo.name} · {demo.mobile}
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
      {devCode ? <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold">Demo code {devCode}</p> : null}
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
