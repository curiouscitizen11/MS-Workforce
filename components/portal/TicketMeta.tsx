"use client"

import { fieldClass } from "@/components/portal/ui"

export type TicketDraft = { number: string; expiry: string; noExpiry: boolean }

export function ticketDraft(
  key: string,
  source?: { number?: string | null; expiry?: string | null } | null,
): TicketDraft {
  const expiry = source?.expiry || ""
  return {
    number: source?.number || "",
    expiry,
    noExpiry: !expiry && (key === "whiteCard" || Boolean(source?.number)),
  }
}

export function TicketMeta({
  id,
  draft,
  onChange,
}: {
  id: string
  draft: TicketDraft
  onChange: (next: TicketDraft) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold" htmlFor={id + "-number"}>
        Number on the card
        <input
          id={id + "-number"}
          name={id + "-number"}
          value={draft.number}
          autoComplete="off"
          maxLength={30}
          className={fieldClass}
          onChange={(event) => onChange({ ...draft, number: event.target.value })}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor={id + "-expiry"}>
        Expiry date
        <input
          id={id + "-expiry"}
          name={id + "-expiry"}
          type="date"
          value={draft.noExpiry ? "" : draft.expiry}
          disabled={draft.noExpiry}
          className={fieldClass}
          onChange={(event) => onChange({ ...draft, expiry: event.target.value })}
        />
      </label>
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          name={id + "-no-expiry"}
          className="h-5 w-5"
          checked={draft.noExpiry}
          onChange={(event) => onChange({ ...draft, expiry: event.target.checked ? "" : draft.expiry, noExpiry: event.target.checked })}
        />
        This card doesn&apos;t expire
      </label>
    </div>
  )
}
