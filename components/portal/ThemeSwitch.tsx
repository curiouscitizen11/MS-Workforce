"use client"

import { useState } from "react"
import { TickIcon } from "@/components/portal/ui"
import { THEME_COOKIE, type PortalTheme } from "@/lib/portal/theme"

export function ThemeSwitch({ theme }: { theme: PortalTheme }) {
  const [current, setCurrent] = useState<PortalTheme>(theme)

  function choose(next: PortalTheme) {
    document.cookie = THEME_COOKIE + "=" + next + "; Path=/; Max-Age=31536000; SameSite=Lax"
    document.querySelector(".portal-root")?.setAttribute("data-theme", next)
    setCurrent(next)
  }

  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Appearance">
      {(["dark", "light"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={current === option}
          className={"portal-theme " + (current === option ? "portal-theme-on" : "")}
          onClick={() => choose(option)}
        >
          {current === option ? <TickIcon /> : null}
          {option === "dark" ? "Dark" : "Light"}
        </button>
      ))}
    </div>
  )
}
