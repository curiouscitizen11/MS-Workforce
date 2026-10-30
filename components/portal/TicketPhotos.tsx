"use client"

import { useState, useTransition } from "react"
import { uploadTicketPhoto } from "@/app/portal/actions"
import { prepareTicketPhoto } from "@/components/portal/prepare-photo"
import type { PhotoSide } from "@/lib/portal/types"

const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif"

export function TicketPhotoPair({
  licenceKey,
  label,
  front,
  back,
  onSaved,
}: {
  licenceKey: string
  label: string
  front: boolean
  back: boolean
  onSaved: (side: PhotoSide) => void
}) {
  const [error, setError] = useState("")
  const [pendingSide, setPendingSide] = useState<PhotoSide | null>(null)
  const [, start] = useTransition()

  function onPick(side: PhotoSide, list: FileList | null, input: HTMLInputElement) {
    const file = list?.[0]
    input.value = ""
    if (!file) return
    setError("")
    setPendingSide(side)
    start(async () => {
      const prepared = await prepareTicketPhoto(file)
      if (!prepared.ok) {
        setPendingSide(null)
        setError(prepared.error)
        return
      }
      const body = new FormData()
      body.set("file", prepared.file)
      body.set("licenceKey", licenceKey)
      body.set("side", side)
      const result = await uploadTicketPhoto(body)
      setPendingSide(null)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onSaved(side)
    })
  }

  return (
    <div className="space-y-2 rounded-2xl bg-white p-3">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs leading-relaxed text-navy/70">
        Take a photo with your camera, or choose one from your gallery. JPG, PNG or HEIC. The photo is reduced in size before it is sent. You cannot open it again after it is saved.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <PhotoSlot
          side="front"
          saved={front}
          pending={pendingSide === "front"}
          label={label}
          onPick={onPick}
        />
        <PhotoSlot
          side="back"
          saved={back}
          pending={pendingSide === "back"}
          label={label}
          onPick={onPick}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function PhotoSlot({
  side,
  saved,
  pending,
  label,
  onPick,
}: {
  side: PhotoSide
  saved: boolean
  pending: boolean
  label: string
  onPick: (side: PhotoSide, list: FileList | null, input: HTMLInputElement) => void
}) {
  const title = side === "front" ? "Front" : "Back"
  const inputId = "photo-" + side + "-" + label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()
  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-navy/20 bg-navy/5 px-2 text-center text-sm font-semibold"
      >
        {pending ? "Sending…" : saved ? "Replace " + title.toLowerCase() : title + " of the card"}
      </label>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={ACCEPT}
        onChange={(event) => onPick(side, event.target.files, event.currentTarget)}
      />
      <p className={"text-center text-xs font-semibold " + (saved ? "text-[#15803D]" : "text-[#B45309]")}>
        {saved ? title + " saved" : title + " needed"}
      </p>
    </div>
  )
}
