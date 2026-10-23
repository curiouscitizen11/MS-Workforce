"use client"

import { useState } from "react"
import { fieldClass } from "@/components/portal/ui"
import { matchesSearch, type PickerGroup } from "@/lib/portal/ticket-catalogue"

export function AddPicker({
  title,
  groups,
  addedIds,
  onChoose,
  onClose,
  other,
}: {
  title: string
  groups: PickerGroup[]
  addedIds: string[]
  onChoose: (id: string) => void
  onClose: () => void
  other?: { onAdd: (name: string) => string | null }
}) {
  const [query, setQuery] = useState("")
  const [otherName, setOtherName] = useState("")
  const [otherError, setOtherError] = useState("")
  return (
    <div className="space-y-3" role="dialog" aria-modal="true" aria-label={title} data-testid="add-picker">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <button type="button" className="min-h-11 px-2 text-sm font-semibold" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="portal-picker">
        <div className="portal-picker-search">
          <label className="block text-sm font-semibold" htmlFor="add-picker-search">
            Search
            <input
              id="add-picker-search"
              value={query}
              autoComplete="off"
              className={fieldClass}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {groups.map((group) => {
          const items = group.items.filter((item) => matchesSearch(item.label, query))
          if (!items.length) return null
          return (
            <div key={group.name}>
              <h3 className="px-[22px] pb-1 pt-3 text-xs font-semibold uppercase tracking-[0.14em]">{group.name}</h3>
              <div className="portal-list">
                {items.map((item) => {
                  const added = addedIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="portal-list-row"
                      disabled={added}
                      onClick={() => onChoose(item.id)}
                    >
                      <span className="portal-list-label">{item.label}</span>
                      {added ? <span className="portal-list-status">Already added</span> : <span className="portal-list-chev" aria-hidden="true">›</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {other ? (
          <form
            className="space-y-2 px-[22px] py-4"
            onSubmit={(event) => {
              event.preventDefault()
              const problem = other.onAdd(otherName)
              if (problem) setOtherError(problem)
            }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">Other</h3>
            <label className="block text-sm font-semibold" htmlFor="add-picker-other">
              Type the name
              <input
                id="add-picker-other"
                value={otherName}
                autoComplete="off"
                maxLength={60}
                className={fieldClass}
                onChange={(event) => {
                  setOtherName(event.target.value)
                  setOtherError("")
                }}
              />
            </label>
            {otherError ? (
              <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
                {otherError}
              </p>
            ) : null}
            <button type="submit" className="pill pill-line-dark w-full">
              Add this name
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
