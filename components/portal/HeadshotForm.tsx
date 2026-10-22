"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { uploadHeadshot } from "@/app/portal/actions"
import { prepareHeadshot } from "@/components/portal/prepare-headshot"
import { HEADSHOT_CONSENT, HEADSHOT_GUIDANCE } from "@/lib/portal/headshot"

export function HeadshotForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  function onPick(list: FileList | null, input: HTMLInputElement) {
    const next = list?.[0]
    input.value = ""
    if (!next) return
    setError("")
    setConsent(false)
    start(async () => {
      const prepared = await prepareHeadshot(next)
      if (!prepared.ok) {
        setFile(null)
        setPreview("")
        setError(prepared.error)
        return
      }
      setFile(prepared.file)
      setPreview(URL.createObjectURL(prepared.file))
    })
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!file) {
          setError("Choose a photo first.")
          return
        }
        if (!consent) {
          setError("Tick the box to let MS Workforce show this photo on your ID card.")
          return
        }
        const body = new FormData()
        body.set("file", file)
        body.set("consent", "yes")
        start(async () => {
          const result = await uploadHeadshot(body)
          if (!result.ok) {
            setError(result.error)
            return
          }
          setError("")
          setFile(null)
          router.refresh()
          onDone?.()
        })
      }}
    >
      <p className="text-sm leading-relaxed">{HEADSHOT_GUIDANCE}</p>
      {preview ? (
        // The preview is a local crop, not a stored photo.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Cropped headshot preview" className="mx-auto h-36 w-36 rounded-full object-cover" />
      ) : (
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-white text-sm font-semibold">Preview</div>
      )}
      <div className="flex flex-col gap-2">
        <label className="pill pill-teal w-full">
          Take a photo
          <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(event) => onPick(event.target.files, event.target)} />
        </label>
        <label className="pill pill-line-dark w-full">
          Choose a photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"
            className="sr-only"
            onChange={(event) => onPick(event.target.files, event.target)}
          />
        </label>
      </div>
      <label className="flex min-h-12 items-start gap-3 py-2 text-sm font-semibold leading-snug">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        {HEADSHOT_CONSENT}
      </label>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending || !file || !consent}>
        {pending ? "Saving" : "Save photo"}
      </button>
      {onDone ? (
        <button type="button" className="pill pill-line-dark w-full" onClick={onDone}>
          I'll add a photo later
        </button>
      ) : null}
    </form>
  )
}
