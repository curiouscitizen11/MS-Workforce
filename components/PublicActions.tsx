import Link from "next/link"
import { applyForWorkHref, bookLabourHref } from "@/lib/public-links"

function portalLink(href: string, newTab: boolean) {
  return newTab && href.startsWith("/")
}

export function BookLabourLink({ className }: { className: string }) {
  const href = bookLabourHref()
  const blank = portalLink(href, true)
  return (
    <a href={href} className={className} target={blank ? "_blank" : undefined} rel={blank ? "noopener noreferrer" : undefined}>
      Book labour
      {blank ? <span className="sr-only"> (form opens in a new tab)</span> : null}
    </a>
  )
}

export function ApplyForWorkLink({
  className,
  children = "Apply for work",
  newTab = false,
}: {
  className: string
  children?: React.ReactNode
  newTab?: boolean
}) {
  const href = applyForWorkHref()
  const blank = portalLink(href, newTab)
  if (href.startsWith("/") && !blank) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className} target={blank ? "_blank" : undefined} rel={blank ? "noopener noreferrer" : undefined}>
      {children}
      {blank ? <span className="sr-only"> (employee portal opens in a new tab)</span> : null}
    </a>
  )
}
