"use client"

import { WhiteCardCourseLinks, showCourseLink } from "@/components/portal/course-links"
import { TickIcon } from "@/components/portal/ui"
import { TICKET_ANSWERS } from "@/lib/portal/types"

const SHOWN: Record<(typeof TICKET_ANSWERS)[number], string> = {
  "Yes, I have it": "Have it",
  No: "No",
  "Booked in for the course": "Booked in",
}

export function TicketChoices({
  name,
  label,
  value,
  onChange,
  course,
  hideLegend = false,
}: {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  course?: boolean
  hideLegend?: boolean
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={hideLegend ? "sr-only" : "text-sm font-semibold"}>{label}</legend>
      <div className={hideLegend ? "portal-seg" : "portal-seg mt-2"}>
        {TICKET_ANSWERS.map((choice) => {
          const on = value === choice
          return (
            <label key={choice} className={"portal-seg-item" + (on ? " portal-seg-on" : "")}>
              <input type="radio" name={name} value={choice} checked={on} onChange={() => onChange(choice)} />
              {on ? <TickIcon /> : null}
              <span>{SHOWN[choice]}</span>
            </label>
          )
        })}
      </div>
      {course && showCourseLink(value) ? <WhiteCardCourseLinks /> : null}
    </fieldset>
  )
}
