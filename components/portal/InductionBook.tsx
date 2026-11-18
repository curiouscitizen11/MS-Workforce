"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { saveInduction } from "@/app/portal/actions"
import { AddPicker } from "@/components/portal/AddPicker"
import type { InductionRow } from "@/lib/portal/inductions"

export function InductionBook({ rows, sites }: { rows: InductionRow[]; sites: { id: string; label: string }[] }) {
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState("")
  const [, start] = useTransition()

  function add(name: string, done = false) {
    setError("")
    start(async () => {
      const result = await saveInduction({ name, done })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPicking(false)
    })
  }

  if (picking) {
    return (
      <div>
        {error ? (
          <p role="alert" className="px-[22px] pb-2 text-sm font-semibold text-[#ff6b6b]">
            {error}
          </p>
        ) : null}
      <AddPicker
        title="Add induction"
        groups={[{ name: "Sites", items: sites }]}
        addedIds={rows.filter((row) => row.kind === "site").map((row) => row.name)}
        onClose={() => setPicking(false)}
        onChoose={(id) => add(id)}
        other={{
          onAdd: (name) => {
            add(name)
            return null
          },
        }}
      />
      </div>
    )
  }

  return (
    <div>
      <div className="portal-list">
        {rows.map((row) => (
          <Link key={row.id} href={row.href || "/portal/inductions"} className="portal-list-row">
            <span className="portal-list-label">{row.name}</span>
            <span className={"portal-list-status" + (row.done ? "" : " portal-home-attention")}>{row.status}</span>
            <span className="portal-list-chev" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>
      {error ? (
        <p role="alert" className="px-[22px] pt-2 text-sm font-semibold text-[#ff6b6b]">
          {error}
        </p>
      ) : null}
      <button type="button" className="portal-add" onClick={() => setPicking(true)}>
        + Add induction
      </button>
    </div>
  )
}
