"use client"

import { WhiteCardCourseLinks, showCourseLink } from "@/components/portal/course-links"
import { TICKET_ANSWERS } from "@/lib/portal/types"

export function TicketChoices({
  name,
  label,
  value,
  onChange,
  course,
}: {
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  course?: boolean
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 space-y-1">
        {TICKET_ANSWERS.map((choice) => (
          <label key={choice} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="radio" name={name} value={choice} checked={value === choice} onChange={() => onChange(choice)} />
            {choice}
          </label>
        ))}
      </div>
      {course && showCourseLink(value) ? <WhiteCardCourseLinks /> : null}
    </fieldset>
  )
}
