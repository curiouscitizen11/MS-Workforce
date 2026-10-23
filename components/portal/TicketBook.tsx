"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveHeldLicences, updateTicket } from "@/app/portal/actions"
import { AddPicker } from "@/components/portal/AddPicker"
import { TicketChoices } from "@/components/portal/TicketChoices"
import { TicketMeta, ticketDraft, type TicketDraft } from "@/components/portal/TicketMeta"
import { TicketPhotoPair } from "@/components/portal/TicketPhotos"
import {
  customTicketNameProblem,
  normalTicketName,
  ticketCatalogue,
  ticketRows,
} from "@/lib/portal/ticket-catalogue"
import type { PhotoRef } from "@/lib/portal/ticket-photos"
import { TICKET_ANSWERS, TICKET_LABELS, type PhotoSide, type TicketType } from "@/lib/portal/types"

type Saved = {
  status?: string
  number?: string | null
  cardNumber?: string | null
  expiry?: string | null
  issued?: string | null
}

type Edit = { kind: "ticket"; key: TicketType } | { kind: "other"; key: string }

export function TicketBook({
  today,
  tickets: initialTickets,
  otherHeld: initialHeld,
  otherDetails: initialDetails,
  photos: initialPhotos,
  onContinue,
  initialEditing = null,
}: {
  today: string
  tickets: Partial<Record<TicketType, Saved>>
  otherHeld: string[]
  otherDetails: Record<string, Saved>
  photos: PhotoRef[]
  onContinue?: () => void
  initialEditing?: Edit | null
}) {
  const router = useRouter()
  const [tickets, setTickets] = useState(initialTickets)
  const [held, setHeld] = useState(initialHeld)
  const [details, setDetails] = useState(initialDetails)
  const [photos, setPhotos] = useState(initialPhotos)
  const [editing, setEditing] = useState<Edit | null>(initialEditing)
  const [picking, setPicking] = useState(false)
  const rows = ticketRows({ today, tickets, otherHeld: held, otherDetails: details })

  function onPhoto(key: string, side: PhotoSide) {
    setPhotos((current) => (current.some((photo) => photo.key === key && photo.side === side) ? current : [...current, { key, side }]))
    router.refresh()
  }

  function openId(id: string) {
    if (id.startsWith("ticket:")) setEditing({ kind: "ticket", key: id.slice("ticket:".length) as TicketType })
    else setEditing({ kind: "other", key: id.slice("other:".length) })
    setPicking(false)
  }

  if (editing) {
    const saved = editing.kind === "ticket" ? tickets[editing.key] : details[editing.key]
    const already = rows.some((row) => row.kind === editing.kind && row.key === editing.key)
    return (
      <TicketEditorPanel
        key={editing.kind + ":" + editing.key}
        edit={editing}
        saved={saved}
        already={already}
        held={held}
        photos={photos}
        onPhoto={onPhoto}
        onClose={() => setEditing(null)}
        onRemoved={() => {
          if (editing.kind === "ticket") setTickets({ ...tickets, [editing.key]: { status: "No" } })
          else {
            setHeld(held.filter((label) => label !== editing.key))
            const next = { ...details }
            delete next[editing.key]
            setDetails(next)
          }
          setEditing(null)
          router.refresh()
        }}
        onStored={(status, draft) => {
          if (editing.kind === "ticket") {
            setTickets({
              ...tickets,
              [editing.key]: {
                status,
                number: draft.number.trim(),
                cardNumber: draft.cardNumber.trim(),
                expiry: draft.noExpiry ? null : draft.expiry,
                issued: draft.issued.trim(),
              },
            })
          } else {
            const nextHeld = held.includes(editing.key) ? held.filter((label) => label !== "None of these") : [...held.filter((label) => label !== "None of these"), editing.key]
            setHeld(nextHeld)
            setDetails({
              ...details,
              [editing.key]: {
                number: draft.number.trim(),
                expiry: draft.noExpiry ? null : draft.expiry,
                issued: draft.issued.trim(),
              },
            })
          }
          setEditing(null)
          router.refresh()
        }}
      />
    )
  }

  if (picking) {
    return (
      <AddPicker
        title="Add ticket or training"
        groups={ticketCatalogue()}
        addedIds={rows.map((row) => row.id)}
        onClose={() => setPicking(false)}
        onChoose={openId}
        other={{
          onAdd: (name) => {
            const problem = customTicketNameProblem(name, rows.map((row) => row.label))
            if (problem) return problem
            setEditing({ kind: "other", key: normalTicketName(name) })
            setPicking(false)
            return null
          },
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="portal-list" data-testid="ticket-list">
        {rows.map((row) => (
          <button key={row.id} type="button" className="portal-list-row" data-testid="ticket-row" onClick={() => openId(row.id)}>
            <span className="portal-list-label">{row.label}</span>
            <span className="portal-list-status">{row.status}</span>
            <span className="portal-list-chev" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
      <button type="button" className="pill pill-line-dark w-full" data-testid="add-ticket" onClick={() => setPicking(true)}>
        + Add ticket or training
      </button>
      {onContinue ? (
        <button type="button" className="pill pill-teal w-full" onClick={onContinue}>
          Continue
        </button>
      ) : null}
    </div>
  )
}

function TicketEditorPanel({
  edit,
  saved,
  already,
  held,
  photos,
  onPhoto,
  onClose,
  onRemoved,
  onStored,
}: {
  edit: Edit
  saved?: Saved
  already: boolean
  held: string[]
  photos: PhotoRef[]
  onPhoto: (key: string, side: PhotoSide) => void
  onClose: () => void
  onRemoved: () => void
  onStored: (status: string, draft: TicketDraft) => void
}) {
  const [status, setStatus] = useState<(typeof TICKET_ANSWERS)[number]>(
    edit.kind === "other" ? "Yes, I have it" : knownStatus(saved?.status),
  )
  const [draft, setDraft] = useState<TicketDraft>(() => ticketDraft(edit.key, saved))
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  const needsPhotos = edit.kind === "other" || status === "Yes, I have it"
  const front = photos.some((photo) => photo.key === edit.key && photo.side === "front")
  const back = photos.some((photo) => photo.key === edit.key && photo.side === "back")
  const ready = !needsPhotos || (front && back)
  const label = edit.kind === "ticket" ? TICKET_LABELS[edit.key] : edit.key

  function save(nextStatus: string) {
    if (nextStatus === "Yes, I have it" && (!front || !back)) {
      setError("Add a photo of the front and the back before you continue.")
      return
    }
    start(async () => {
      if (edit.kind === "ticket") {
        const result = await updateTicket(edit.key, {
          status: nextStatus,
          number: draft.number,
          cardNumber: draft.cardNumber,
          expiry: draft.expiry,
          issued: draft.issued,
          noExpiry: draft.noExpiry,
        })
        if (!result.ok) setError(result.error)
        else onStored(nextStatus, draft)
        return
      }
      const kept = held.filter((label) => label !== "None of these")
      const nextHeld = kept.includes(edit.key) ? kept : [...kept, edit.key]
      const result = await saveHeldLicences(nextHeld, {
        [edit.key]: {
          number: draft.number,
          cardNumber: draft.cardNumber,
          expiry: draft.expiry,
          issued: draft.issued,
          noExpiry: draft.noExpiry,
        },
      })
      if (!result.ok) setError(result.error)
      else onStored("Yes, I have it", draft)
    })
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        save(edit.kind === "other" ? "Yes, I have it" : status)
      }}
    >
      <button type="button" className="min-h-11 text-sm font-semibold" onClick={onClose}>
        Back to the list
      </button>
      <h2 className="text-base font-semibold">{label}</h2>
      {edit.kind === "ticket" ? (
        <TicketChoices
          name="ticket-status"
          label="Status"
          value={status}
          course={edit.key === "whiteCard"}
          onChange={(choice) => {
            setStatus(choice as (typeof TICKET_ANSWERS)[number])
            setError("")
          }}
        />
      ) : null}
      {needsPhotos ? (
        <>
          <TicketMeta id={edit.kind === "other" ? "other-" + edit.key : edit.key} draft={draft} onChange={setDraft} />
          <TicketPhotoPair licenceKey={edit.key} label={label} front={front} back={back} onSaved={(side) => onPhoto(edit.key, side)} />
        </>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending || !ready}>
        Save ticket or certificate
      </button>
      {already && edit.key !== "whiteCard" ? (
        <button
          type="button"
          className="min-h-12 w-full text-sm font-semibold"
          disabled={pending}
          onClick={() => {
            start(async () => {
              if (edit.kind === "ticket") {
                const result = await updateTicket(edit.key, { status: "No", number: "", expiry: "", issued: "", noExpiry: true })
                if (!result.ok) setError(result.error)
                else onRemoved()
                return
              }
              const result = await saveHeldLicences(held.filter((label) => label !== edit.key), {})
              if (!result.ok) setError(result.error)
              else onRemoved()
            })
          }}
        >
          Remove this ticket
        </button>
      ) : null}
    </form>
  )
}

function knownStatus(status: string | undefined): (typeof TICKET_ANSWERS)[number] {
  return TICKET_ANSWERS.includes(status as (typeof TICKET_ANSWERS)[number]) ? (status as (typeof TICKET_ANSWERS)[number]) : "Yes, I have it"
}

