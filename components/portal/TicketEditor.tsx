"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateTicket, uploadDocument } from "@/app/portal/actions"
import { TicketChoices } from "@/components/portal/TicketChoices"
import { fieldClass } from "@/components/portal/ui"
import { TICKET_ANSWERS, TICKET_LABELS, TICKET_TYPES, type TicketType } from "@/lib/portal/types"

export function TicketEditor() {
  const router = useRouter()
  const [type, setType] = useState<TicketType>("whiteCard")
  const [status, setStatus] = useState<(typeof TICKET_ANSWERS)[number]>("Yes, I have it")
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()
        start(async () => {
          const result = await updateTicket(type, { status })
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
            setType(event.target.value as TicketType)
            setStatus("Yes, I have it")
          }}
        >
          {TICKET_TYPES.map((item) => (
            <option key={item} value={item}>
              {TICKET_LABELS[item]}
            </option>
          ))}
        </select>
      </label>
      <TicketChoices name="ticket-status" label="Status" value={status} course={type === "whiteCard"} onChange={(choice) => setStatus(choice as (typeof TICKET_ANSWERS)[number])} />
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
      {error ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save ticket
      </button>
    </form>
  )
}
