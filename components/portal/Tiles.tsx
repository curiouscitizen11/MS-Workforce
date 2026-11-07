import Link from "next/link"

export function Tile({
  href,
  label,
  count,
  countLabel,
  icon,
}: {
  href: string
  label: string
  count?: number
  countLabel?: string
  icon: React.ReactNode
}) {
  const show = Boolean(count && count > 0)
  return (
    <Link href={href} className="portal-tile relative" aria-label={show ? label + ". " + countLabel : label}>
      {show ? <span className="portal-badge">{count}</span> : null}
      <span aria-hidden="true">{icon}</span>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </Link>
  )
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {children}
    </svg>
  )
}

export function ShiftsIcon() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M4 9h16" />
    </Icon>
  )
}

export function HoursIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 2" />
    </Icon>
  )
}

export function PassIcon() {
  return (
    <Icon>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="10" cy="11" r="2" />
      <path d="M7.5 16c.6-1.4 1.6-2 2.5-2s1.9.6 2.5 2M15 10h2M15 13h2" />
    </Icon>
  )
}

export function TicketsIcon() {
  return (
    <Icon>
      <path d="M7 4h8l3 3v13H7z" />
      <path d="M15 4v3h3M9 12h6M9 16h4" />
    </Icon>
  )
}

export function InductionIcon() {
  return (
    <Icon>
      <path d="M12 4 5 7v5c0 4 3 6.5 7 8 4-1.5 7-4 7-8V7z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  )
}

export function DetailsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 19c.8-2.4 2.6-3.5 5.5-3.5s4.7 1.1 5.5 3.5" />
    </Icon>
  )
}

export function HelpIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.8-1.2 1.6" />
      <path d="M12 17h.01" />
    </Icon>
  )
}

export function WorkersIcon() {
  return (
    <Icon>
      <circle cx="9" cy="9" r="2.4" />
      <circle cx="16" cy="10" r="2" />
      <path d="M4.8 18c.6-2.2 2.2-3.2 4.2-3.2s3.6 1 4.2 3.2M14 15.2c1.4-.3 2.6.2 3.4 1.6" />
    </Icon>
  )
}

export function PhotoIcon() {
  return (
    <Icon>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </Icon>
  )
}
