"use client"

import { useEffect, useState } from "react"
import { HOME_HINT_KEY, shouldShowAddHomeHint } from "@/lib/portal/home-hint"

export function AddHomeHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = window.localStorage.getItem(HOME_HINT_KEY) === "1"
    } catch {
      dismissed = true
    }
    const nav = window.navigator as Navigator & { standalone?: boolean }
    const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
    setShow(shouldShowAddHomeHint(window.navigator.userAgent, { dismissed, standalone }))
  }, [])

  if (!show) return null

  return (
    <div className="portal-home-hint" role="note">
      <p>Tap Share, then Add to Home Screen</p>
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.setItem(HOME_HINT_KEY, "1")
          } catch {
            /* the hint still closes for this visit */
          }
          setShow(false)
        }}
      >
        Close
      </button>
    </div>
  )
}
