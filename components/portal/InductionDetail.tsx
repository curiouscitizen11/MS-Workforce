"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { saveInduction } from "@/app/portal/actions"

export function InductionDetail({
  name,
  status,
  done,
  link,
}: {
  name: string
  status: string
  done: boolean
  link?: string
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [pending, start] = useTransition()

  function markDone() {
    setError("")
    start(async () => {
      const result = await saveInduction({ name, done: true })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">{status}</p>
      {link ? (
        <a className={done ? "pill pill-teal w-full" : "pill pill-line w-full"} href={link} target="_blank" rel="noreferrer">
          Open
        </a>
      ) : null}
      {done ? null : (
        <button type="button" className="pill pill-teal w-full" disabled={pending} onClick={markDone}>
          {pending ? "Saving" : "Mark done"}
        </button>
      )}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#ff6b6b]">
          {error}
        </p>
      ) : null}
      <Link href="/portal/inductions" className="inline-flex min-h-12 items-center text-sm font-semibold text-[#2ec4b6]">
        Back to inductions
      </Link>
    </div>
  )
}
