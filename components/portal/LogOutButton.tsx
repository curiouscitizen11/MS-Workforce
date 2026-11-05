"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { logOut } from "@/app/portal/actions"

export function LogOutButton() {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
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
  )
}
