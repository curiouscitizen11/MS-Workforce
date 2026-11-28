import { businessPhone, CONTACT_LINE, JOBS_MAILTO, telHref } from "@/lib/portal/business-phone"

/** Shown where a worker used to see a phone number. A call link only when BUSINESS_PHONE is set. */
export function ContactLine({ lead }: { lead?: string }) {
  const phone = businessPhone()
  return (
    <p className="text-sm leading-relaxed">
      {lead ? lead + " " : null}
      {phone ? (
        <>
          Call MS Workforce on{" "}
          <a className="inline-flex min-h-11 items-center font-semibold text-teal-600 underline" href={telHref(phone)}>
            {phone}
          </a>
          .
        </>
      ) : (
        <a className="inline-flex min-h-11 items-center font-semibold text-teal-600 underline" href={JOBS_MAILTO}>
          {CONTACT_LINE}
        </a>
      )}
    </p>
  )
}

export function RunningLate() {
  const phone = businessPhone()
  if (!phone) return <ContactLine />
  return (
    <a className="pill pill-line-dark w-full" href={telHref(phone)}>
      Running late — call MS Workforce
    </a>
  )
}
