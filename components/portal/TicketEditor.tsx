"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateTicket, uploadDocument } from "@/app/portal/actions"
import { fieldClass } from "@/components/portal/ui"
import { DRIVER_CLASSES, HELD_CHOICES, TICKET_LABELS, TICKET_TYPES, type TicketType } from "@/lib/portal/types"

export function TicketEditor() {
  const router = useRouter()
  const [type, setType] = useState<TicketType>("whiteCard")
  const [status, setStatus] = useState("Held")
  const [number, setNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  const options = type === "driverLicence" ? DRIVER_CLASSES : HELD_CHOICES
  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()
        start(async () => {
          const result = await updateTicket(type, { status, number, expiry: expiry || null })
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
        <select id="ticket-type" className={fieldClass} value={type} onChange={(event) => setType(event.target.value as TicketType)}>
          {TICKET_TYPES.map((item) => (
            <option key={item} value={item}>
              {TICKET_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold" htmlFor="ticket-status">
        Status
        <select id="ticket-status" className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold" htmlFor="ticket-number">
        Number
        <input id="ticket-number" className={fieldClass} value={number} onChange={(event) => setNumber(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="ticket-expiry">
        Expiry, if the card has one
        <input id="ticket-expiry" type="date" className={fieldClass} value={expiry} onChange={(event) => setExpiry(event.target.value)} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="ticket-photo">
        Photo
        <input
          id="ticket-photo"
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="mt-1 block w-full text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const body = new FormData()
            body.set("file", file)
            body.set("kind", "ticket")
            body.set("ticketType", type)
            start(async () => {
              const result = await uploadDocument(body)
              if (!result.ok) setError(result.error)
              else router.refresh()
            })
          }}
        />
      </label>
      {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save ticket
      </button>
    </form>
  )
}
