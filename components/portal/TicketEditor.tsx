"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveHeldLicences, updateTicket } from "@/app/portal/actions"
import { TicketChoices } from "@/components/portal/TicketChoices"
import { TicketMeta, ticketDraft, type TicketDraft } from "@/components/portal/TicketMeta"
import { TicketPhotoPair } from "@/components/portal/TicketPhotos"
import { fieldClass } from "@/components/portal/ui"
import { OTHER_TICKETS, TICKET_ANSWERS, TICKET_LABELS, TICKET_TYPES, type PhotoSide, type TicketType } from "@/lib/portal/types"
import type { PhotoRef } from "@/lib/portal/ticket-photos"

type SavedTicket = { number?: string | null; expiry?: string | null }

export function TicketEditor({
  photos,
  otherHeld,
  tickets,
  otherDetails,
}: {
  photos: PhotoRef[]
  otherHeld: string[]
  tickets: Partial<Record<TicketType, SavedTicket>>
  otherDetails: Record<string, SavedTicket>
}) {
  const router = useRouter()
  const [type, setType] = useState<TicketType>("whiteCard")
  const [status, setStatus] = useState<(typeof TICKET_ANSWERS)[number]>("Yes, I have it")
  const [draft, setDraft] = useState<TicketDraft>(() => ticketDraft("whiteCard", tickets.whiteCard))
  const [savedPhotos, setSavedPhotos] = useState<PhotoRef[]>(photos)
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  const front = savedPhotos.some((photo) => photo.key === type && photo.side === "front")
  const back = savedPhotos.some((photo) => photo.key === type && photo.side === "back")
  const needsPhotos = status === "Yes, I have it"
  const ready = !needsPhotos || (front && back)

  function onSaved(key: string, side: PhotoSide) {
    setSavedPhotos((current) => (current.some((photo) => photo.key === key && photo.side === side) ? current : [...current, { key, side }]))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-3 rounded-2xl bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (!ready) {
            setError("Add a photo of the front and the back before you continue.")
            return
          }
          start(async () => {
            const result = await updateTicket(type, {
              status,
              number: draft.number,
              expiry: draft.expiry,
              noExpiry: draft.noExpiry,
            })
            if (!result.ok) setError(result.error)
            else {
              setError("")
              router.refresh()
            }
          })
        }}
      >
        <label className="block text-sm font-semibold" htmlFor="ticket-type">
          Update a ticket
          <select
            id="ticket-type"
            className={fieldClass}
            value={type}
            onChange={(event) => {
              const next = event.target.value as TicketType
              setType(next)
              setStatus("Yes, I have it")
              setDraft(ticketDraft(next, tickets[next]))
              setError("")
            }}
          >
            {TICKET_TYPES.map((item) => (
              <option key={item} value={item}>
                {TICKET_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <TicketChoices
          name="ticket-status"
          label="Status"
          value={status}
          course={type === "whiteCard"}
          onChange={(choice) => {
            setStatus(choice as (typeof TICKET_ANSWERS)[number])
            setError("")
          }}
        />
        {needsPhotos ? (
          <>
            <TicketMeta id={type} draft={draft} onChange={setDraft} />
            <TicketPhotoPair
              licenceKey={type}
              label={TICKET_LABELS[type]}
              front={front}
              back={back}
              onSaved={(side) => onSaved(type, side)}
            />
          </>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
            {error}
          </p>
        ) : null}
        <button className="pill pill-teal w-full" disabled={pending || !ready}>
          Save ticket
        </button>
      </form>
      <OtherLicences initial={otherHeld} details={otherDetails} photos={savedPhotos} onSaved={onSaved} />
    </div>
  )
}

function OtherLicences({
  initial,
  details,
  photos,
  onSaved,
}: {
  initial: string[]
  details: Record<string, SavedTicket>
  photos: PhotoRef[]
  onSaved: (key: string, side: PhotoSide) => void
}) {
  const router = useRouter()
  const [held, setHeld] = useState<string[]>(initial)
  const [drafts, setDrafts] = useState<Record<string, TicketDraft>>(() => {
    const next: Record<string, TicketDraft> = {}
    for (const label of initial) {
      if (label === "None of these") continue
      next[label] = ticketDraft(label, details[label])
    }
    return next
  })
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  return (
    <OtherLicenceFields
      held={held}
      setHeld={setHeld}
      drafts={drafts}
      setDraft={(label, draft) => setDrafts({ ...drafts, [label]: draft })}
      photos={photos}
      onSaved={onSaved}
      error={error}
      pending={pending}
      onSubmit={(selected) => {
        const needed = selected.filter((item) => item !== "None of these")
        const missing = needed.filter((item) => !photos.some((photo) => photo.key === item && photo.side === "front") || !photos.some((photo) => photo.key === item && photo.side === "back"))
        if (missing.length) {
          setError(missing.length === 1 ? "Add a photo of the front and the back of the " + missing[0] + " before you continue." : "Add a front and back photo for: " + missing.join(", ") + ".")
          return
        }
        const payload: Record<string, TicketDraft> = {}
        for (const label of needed) payload[label] = drafts[label] || ticketDraft(label, details[label])
        start(async () => {
          const result = await saveHeldLicences(selected, payload)
          if (!result.ok) setError(result.error)
          else {
            setError("")
            router.refresh()
          }
        })
      }}
    />
  )
}

function OtherLicenceFields({
  held,
  setHeld,
  drafts,
  setDraft,
  photos,
  onSaved,
  error,
  pending,
  onSubmit,
}: {
  held: string[]
  setHeld: (next: string[]) => void
  drafts: Record<string, TicketDraft>
  setDraft: (label: string, draft: TicketDraft) => void
  photos: PhotoRef[]
  onSaved: (key: string, side: PhotoSide) => void
  error: string
  pending: boolean
  onSubmit: (selected: string[]) => void
}) {
  const selected = held
  const ready = selected
    .filter((item) => item !== "None of these")
    .every((item) => photos.some((photo) => photo.key === item && photo.side === "front") && photos.some((photo) => photo.key === item && photo.side === "back"))
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(selected)
      }}
    >
      <fieldset>
        <legend className="text-sm font-semibold">Other tickets you hold</legend>
        <div className="mt-2 space-y-1">
          {OTHER_TICKETS.map((item) => {
            const on = selected.includes(item)
            return (
              <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  name={"other-" + item}
                  className="h-5 w-5"
                  checked={on}
                  onChange={(event) => setHeld(event.target.checked ? [...selected, item] : selected.filter((value) => value !== item))}
                />
                {item}
              </label>
            )
          })}
        </div>
      </fieldset>
      {selected.filter((item) => item !== "None of these").map((item) => (
        <div key={item} className="space-y-3">
          <TicketMeta
            id={"other-" + item}
            draft={drafts[item] || ticketDraft(item)}
            onChange={(draft) => setDraft(item, draft)}
          />
          <TicketPhotoPair
            licenceKey={item}
            label={item}
            front={photos.some((photo) => photo.key === item && photo.side === "front")}
            back={photos.some((photo) => photo.key === item && photo.side === "back")}
            onSaved={(side) => onSaved(item, side)}
          />
        </div>
      ))}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending || !ready}>
        Save other tickets
      </button>
    </form>
  )
}
