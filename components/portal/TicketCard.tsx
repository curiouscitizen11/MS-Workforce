import type { TicketType } from "@/lib/portal/types"

export function TicketCard({ type, label, children }: { type: TicketType; label: string; children: React.ReactNode }) {
  return (
    <section className="portal-ticket-card">
      <div className="portal-ticket-head">
        <TicketTypeIcon type={type} />
        <h3 className="portal-ticket-title">{label}</h3>
      </div>
      {children}
    </section>
  )
}

function TicketTypeIcon({ type }: { type: TicketType }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  }
  if (type === "whiteCard") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" />
        <path d="M7 11h6M7 14h4" />
      </svg>
    )
  }
  if (type === "heights") {
    return (
      <svg {...common}>
        <path d="M8 20V4M16 20V4M8 8h8M8 12h8M8 16h8" />
      </svg>
    )
  }
  if (type === "asbestosA" || type === "asbestosB") {
    return (
      <svg {...common}>
        <path d="M12 3 21 12 12 21 3 12z" />
        {type === "asbestosA" ? <path d="M9 16.5 12 8l3 8.5M10.2 13.2h3.6" /> : <path d="M9 8h3.2a2.2 2.2 0 0 1 0 4.2H9H12.4a2.3 2.3 0 0 1 0 4.6H9M9 8v9" />}
      </svg>
    )
  }
  if (type === "confinedSpace") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" />
        <circle cx="12" cy="10" r="2" />
        <path d="M9 16.5c.5-2 1.6-3 3-3s2.5 1 3 3" />
      </svg>
    )
  }
  if (type === "firstAid") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    )
  }
  if (type === "driverLicence") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="12" />
        <circle cx="8" cy="11" r="1.6" />
        <path d="M6 15.5c.4-1.4 1.2-2 2-2s1.6.6 2 2M13 10h5M13 13h4" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 12 12 4h7v7l-8 8z" />
      <circle cx="16" cy="8" r="1" />
    </svg>
  )
}
