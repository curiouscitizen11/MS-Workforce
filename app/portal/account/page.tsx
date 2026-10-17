"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { logOut } from "@/app/portal/actions"
import { Heading } from "@/components/portal/ui"

export default function AccountPage() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <div className="space-y-4">
      <Heading kicker="Account" title="Your login" text="Pay is fortnightly, on Thursday. Tax, bank and super details are collected later in Xero, not here." />
      <button
        className="pill pill-dark w-full"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await logOut()
            router.push("/portal/login")
            router.refresh()
          })
        }
      >
        Log out
      </button>
    </div>
  )
}
