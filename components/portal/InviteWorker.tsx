"use client"

import { useState, useTransition } from "react"
import { makeInviteLink } from "@/app/portal/actions"
import { Card, Field } from "@/components/portal/ui"

export function InviteWorker() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [mobile, setMobile] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [pending, start] = useTransition()

  if (!open) {
    return (
      <button type="button" className="pill pill-teal w-full" onClick={() => setOpen(true)}>
        Invite worker
      </button>
    )
  }

  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          setError("")
          setCopied(false)
          start(async () => {
            const result = await makeInviteLink({ name, mobile })
            if (!result.ok) {
              setError(result.error)
              return
            }
            setUrl(result.url)
          })
        }}
      >
        <h2 className="text-sm font-semibold">Invite worker</h2>
        <Field label="Name" name="invite-name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Field label="Mobile" name="invite-mobile" inputMode="tel" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} required />
        {error ? (
          <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
            {error}
          </p>
        ) : null}
        <button className="pill pill-teal w-full" disabled={pending}>
          {pending ? "Making link" : "Make link"}
        </button>
      </form>
      {url ? (
        <div className="mt-3 space-y-3">
          <p className="portal-banner break-all text-sm">{url}</p>
          <button
            type="button"
            className="pill pill-line w-full"
            onClick={() => {
              const done = () => setCopied(true)
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(url).then(done).catch(done)
                return
              }
              done()
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <a className="pill pill-line w-full" href={"sms:?body=" + encodeURIComponent("Join MS Workforce: " + url)}>
            Text it
          </a>
        </div>
      ) : null}
    </Card>
  )
}
