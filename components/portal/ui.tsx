import type { Badge } from "@/lib/portal/compliance"

const chipClass = {
  ok: "portal-chip portal-chip-ok",
  warning: "portal-chip portal-chip-warning",
  restricted: "portal-chip portal-chip-restricted",
  "do-not-book": "portal-chip portal-chip-do-not-book",
  pending: "portal-chip portal-chip-pending",
  neutral: "portal-chip portal-chip-neutral",
} as const

export type ChipLevel = keyof typeof chipClass

export function StatusChip({ level, children }: { level: ChipLevel; children: React.ReactNode }) {
  return (
    <span className={chipClass[level]}>
      <ChipIcon level={level} />
      {children}
    </span>
  )
}

export function badgeLevel(badge: Badge): ChipLevel {
  return badge
}

function ChipIcon({ level }: { level: ChipLevel }) {
  const path =
    level === "ok"
      ? "M5 12.5 9 16.5 19 7.5"
      : level === "do-not-book"
        ? "M6 6l12 12M18 6 6 18"
        : "M12 8v5M12 16.5h.01"
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      {level === "warning" || level === "restricted" || level === "pending" ? (
        <path strokeLinecap="round" d="M12 8v5M12 17h.01" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      )}
    </svg>
  )
}

export function Heading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <header>
      <p className="kicker text-teal-600">{kicker}</p>
      <h1 className="mt-1 text-[1.65rem] font-semibold leading-tight tracking-tight">{title}</h1>
      {text ? <p className="mt-2 text-sm leading-relaxed text-navy/80">{text}</p> : null}
    </header>
  )
}

export function TickIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 9.5 17 19 7.5" />
    </svg>
  )
}

export function Card({ children }: { children: React.ReactNode }) {
  return <section className="portal-panel">{children}</section>
}

export function DemoBanner({ mock }: { mock: boolean }) {
  if (!mock) return null
  return (
    <p className="portal-banner">
      Demo mode. Texts, emails and Notion stay on this phone.
    </p>
  )
}

export const fieldClass =
  "mt-1 w-full min-h-12 rounded-xl border border-navy/20 bg-white px-3 text-base text-navy outline-none ring-teal-300 focus:border-teal-600 focus:ring-2"

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id || props.name
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm font-semibold">{label}</span>
      <input id={id} className={fieldClass} {...props} />
    </label>
  )
}
