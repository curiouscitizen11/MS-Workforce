"use client"

import { fieldClass } from "@/components/portal/ui"
import { asksForExpiry } from "@/lib/portal/ticket-entry"

export type TicketDraft = { number: string; cardNumber: string; expiry: string; issued: string; noExpiry: boolean }

export function ticketDraft(
  key: string,
  source?: { number?: string | null; cardNumber?: string | null; expiry?: string | null; issued?: string | null } | null,
): TicketDraft {
  const expiry = source?.expiry || ""
  return {
    number: source?.number || "",
    cardNumber: source?.cardNumber || "",
    issued: source?.issued || "",
    expiry,
    noExpiry: !asksForExpiry(key) || (!expiry && (key === "whiteCard" || Boolean(source?.number))),
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
  const key = id.replace(/^other-/, "")
  const driver = key === "driverLicence"
  const showExpiry = asksForExpiry(key)
  return (
    <div className="min-w-0 max-w-full space-y-2">
      <label className="block text-sm font-semibold" htmlFor={id + "-number"}>
        {driver ? "Licence number" : "Licence or card number"}
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
      {driver ? (
        <label className="block text-sm font-semibold" htmlFor={id + "-card"}>
          Card number
          <input
            id={id + "-card"}
            name={id + "-card"}
            value={draft.cardNumber}
            autoComplete="off"
            maxLength={30}
            className={fieldClass}
            onChange={(event) => onChange({ ...draft, cardNumber: event.target.value })}
          />
        </label>
      ) : null}
      <DateField id={id + "-issued"} label="Issue date" value={draft.issued} onChange={(issued) => onChange({ ...draft, issued })} />
      {showExpiry && !draft.noExpiry ? (
        <DateField id={id + "-expiry"} label="Expiry date" value={draft.expiry} onChange={(expiry) => onChange({ ...draft, expiry })} />
      ) : null}
      {showExpiry ? (
        <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            name={id + "-no-expiry"}
            className="portal-check"
            checked={draft.noExpiry}
            onChange={(event) => onChange({ ...draft, expiry: event.target.checked ? "" : draft.expiry, noExpiry: event.target.checked })}
          />
          No expiry date on this card
        </label>
      ) : null}
    </div>
  )
}

function DateField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0 max-w-full text-sm font-semibold" htmlFor={id}>
      {label}
      <span className="mt-1 block min-w-0 max-w-full overflow-hidden">
        <input
          id={id}
          name={id}
          type="date"
          value={value}
          className={fieldClass + " box-border block w-full min-w-0 max-w-full"}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  )
}
