export const WHITE_CARD_TAFE =
  "https://www.tafensw.edu.au/course-areas/building-and-construction-trades/courses/statement-of-attainment-in-prepare-to-work-safely-in-the-construction-industry-white-card--900-82974"

export const WHITE_CARD_SAFEWORK = "https://www.safework.nsw.gov.au/licences-and-registrations/white-cards"

export function showCourseLink(status: string) {
  return status === "No" || status === "Booked in for the course"
}

export function WhiteCardCourseLinks() {
  return (
    <p className="mt-2 text-sm font-normal leading-relaxed">
      <a className="font-semibold text-teal-600 underline" href={WHITE_CARD_TAFE}>
        TAFE NSW White Card course
      </a>
      {" · "}
      <a className="font-semibold text-teal-600 underline" href={WHITE_CARD_SAFEWORK}>
        SafeWork NSW: White cards
      </a>
    </p>
  )
}
