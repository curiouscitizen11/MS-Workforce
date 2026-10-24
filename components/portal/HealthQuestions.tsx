"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { fieldClass } from "@/components/portal/ui"
import {
  CURRENT_INJURY,
  PAST_INJURY,
  TELL_BY_PHONE,
  answerSummary,
  conditionOptions,
  injuryKindWord,
  sheetFrame,
  yesDetailProblem,
  type HealthChoice,
  type HealthDraft,
} from "@/lib/portal/health"
import { ALLERGY_TYPES, ANAPHYLAXIS_ANSWERS, EPIPEN_ANSWERS, TASKS_AFFECTED } from "@/lib/portal/types"

type SheetId = "allergies" | "condition" | "injury"

export function HealthQuestions({
  value,
  onChange,
  initialSheet = null,
}: {
  value: HealthDraft
  onChange: (next: HealthDraft) => void
  initialSheet?: SheetId | null
}) {
  const [sheet, setSheet] = useState<SheetId | null>(initialSheet)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState("")

  function open(id: SheetId, next: HealthDraft) {
    setDraft(next)
    setError("")
    setSheet(id)
  }

  function choose(id: SheetId, choice: HealthChoice) {
    if (choice === "Yes") {
      const next = { ...value, [id === "allergies" ? "allergies" : id === "condition" ? "condition" : "injury"]: "Yes" }
      open(id, next)
      return
    }
    if (id === "allergies") {
      onChange({ ...value, allergies: choice, allergyTypes: [], allergyNote: "", anaphylaxis: "", epipen: "" })
    } else if (id === "condition") {
      onChange({ ...value, condition: choice, conditions: [], conditionNote: "" })
    } else {
      onChange({ ...value, injury: choice, tasks: [], injuryNote: "" })
    }
    setSheet(null)
  }

  function saveSheet() {
    const problem =
      sheet === "allergies"
        ? yesDetailProblem(draft.allergyTypes, draft.allergyNote)
        : sheet === "condition"
          ? yesDetailProblem(draft.conditions, draft.conditionNote)
          : yesDetailProblem(draft.tasks, draft.injuryNote)
    if (problem) {
      setError(problem)
      return
    }
    onChange(draft)
    setSheet(null)
  }

  return (
    <div className="space-y-4">
      <Question
        legend="Allergies"
        choice={value.allergies}
        summary={answerSummary("Allergies", value.allergies, value.allergyTypes, value.allergyNote)}
        onChoose={(choice) => choose("allergies", choice)}
        onEdit={() => open("allergies", value)}
      />
      <Question
        legend="A condition a first aider should know"
        choice={value.condition}
        summary={answerSummary("Condition", value.condition, value.conditions, value.conditionNote)}
        onChoose={(choice) => choose("condition", choice)}
        onEdit={() => open("condition", value)}
      />
      <Question
        legend="Injury that could affect the work"
        choice={value.injury}
        summary={answerSummary("Injury", value.injury, value.tasks, value.injuryNote, injuryKindWord(value.injuryKind))}
        onChoose={(choice) => choose("injury", choice)}
        onEdit={() => open("injury", value)}
      />
      {sheet ? (
        <Sheet
          title={sheet === "allergies" ? "Allergies" : sheet === "condition" ? "A condition a first aider should know" : "Injury that could affect the work"}
          error={error}
          onSave={saveSheet}
          onClose={() => setSheet(null)}
        >
          {sheet === "allergies" ? (
            <>
              <Checks legend="What are you allergic to?" options={ALLERGY_TYPES} selected={draft.allergyTypes} onChange={(item) => setDraft((current) => ({ ...current, allergyTypes: toggleList(current.allergyTypes, item) }))} />
              <Describe value={draft.allergyNote} onChange={(allergyNote) => setDraft((current) => ({ ...current, allergyNote }))} />
              <Choice label="Severe allergic reaction (anaphylaxis)?" value={draft.anaphylaxis} options={ANAPHYLAXIS_ANSWERS} onChange={(anaphylaxis) => setDraft((current) => ({ ...current, anaphylaxis }))} />
              <Choice label="Adrenaline auto-injector (EpiPen or Anapen)?" value={draft.epipen} options={EPIPEN_ANSWERS} onChange={(epipen) => setDraft((current) => ({ ...current, epipen }))} />
            </>
          ) : null}
          {sheet === "condition" ? (
            <>
              <Checks legend="Which condition?" options={conditionOptions()} selected={draft.conditions} onChange={(item) => setDraft((current) => ({ ...current, conditions: toggleList(current.conditions, item) }))} />
              <Describe value={draft.conditionNote} onChange={(conditionNote) => setDraft((current) => ({ ...current, conditionNote }))} />
            </>
          ) : null}
          {sheet === "injury" ? (
            <>
              <Checks
                legend="Which injury?"
                options={[CURRENT_INJURY, PAST_INJURY]}
                selected={[draft.injuryKind]}
                labels={{ [CURRENT_INJURY]: "A current injury", [PAST_INJURY]: "A past injury that still affects me" }}
                onChange={(item) => setDraft((current) => ({ ...current, injuryKind: item === PAST_INJURY ? PAST_INJURY : CURRENT_INJURY }))}
              />
              <Checks legend="Tasks it affects" options={TASKS_AFFECTED} selected={draft.tasks} onChange={(item) => setDraft((current) => ({ ...current, tasks: toggleList(current.tasks, item) }))} />
              <Describe value={draft.injuryNote} onChange={(injuryNote) => setDraft((current) => ({ ...current, injuryNote }))} />
            </>
          ) : null}
        </Sheet>
      ) : null}
    </div>
  )
}

function Question({
  legend,
  choice,
  summary,
  onChoose,
  onEdit,
}: {
  legend: string
  choice: HealthChoice
  summary: string
  onChoose: (choice: HealthChoice) => void
  onEdit: () => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Yn pressed={choice === "No"} onClick={() => onChoose("No")}>
          No
        </Yn>
        <Yn pressed={choice === "Yes"} onClick={() => onChoose("Yes")}>
          Yes
        </Yn>
      </div>
      <button type="button" className={"portal-yn mt-2 w-full " + (choice === TELL_BY_PHONE ? "portal-yn-on" : "")} aria-pressed={choice === TELL_BY_PHONE} onClick={() => onChoose(TELL_BY_PHONE)}>
        {TELL_BY_PHONE}
      </button>
      {summary ? (
        <p className="mt-2 flex items-start justify-between gap-3 text-sm">
          <span className="min-w-0 flex-1">{summary}</span>
          <button type="button" className="min-h-12 shrink-0 font-semibold text-[#2ec4b6]" onClick={onEdit}>
            Edit
          </button>
        </p>
      ) : null}
    </fieldset>
  )
}

function Yn({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" className={"portal-yn " + (pressed ? "portal-yn-on" : "")} aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  )
}

function toggleList(selected: string[], item: string) {
  return selected.includes(item) ? selected.filter((value) => value !== item) : [...selected, item]
}

function Checks({
  legend,
  options,
  selected,
  labels,
  onChange,
}: {
  legend: string
  options: readonly string[]
  selected: string[]
  labels?: Record<string, string>
  onChange: (item: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="portal-opt-grid">
        {options.map((item) => {
          const on = selected.includes(item)
          const label = labels?.[item] || item
          return (
            <button
              key={item}
              type="button"
              aria-pressed={on}
              className={"portal-yn portal-opt" + (on ? " portal-yn-on" : "") + (label.length > 32 ? " portal-opt-wide" : "")}
              onClick={() => onChange(item)}
            >
              {label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Describe({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold" htmlFor="health-describe">
      Describe
      <textarea
        id="health-describe"
        maxLength={200}
        rows={2}
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => revealSheetField(event.currentTarget)}
      />
    </label>
  )
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function revealSheetField(node: HTMLElement) {
  const run = () => {
    const scroller = node.closest(".portal-sheet-body")
    if (!(scroller instanceof HTMLElement)) return
    const field = node.closest("label")
    const target = field instanceof HTMLElement ? field : node
    const fieldRect = target.getBoundingClientRect()
    const box = scroller.getBoundingClientRect()
    if (fieldRect.bottom > box.bottom - 8) scroller.scrollTop += fieldRect.bottom - box.bottom + 12
    else if (fieldRect.top < box.top + 8) scroller.scrollTop -= box.top - fieldRect.top + 12
  }
  requestAnimationFrame(run)
  window.setTimeout(run, 300)
}

function Sheet({
  title,
  error,
  onSave,
  onClose,
  children,
}: {
  title: string
  error: string
  onSave: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<{ bottom: number; maxHeight: number } | null>(null)
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    const viewport = window.visualViewport
    function place() {
      const height = viewport?.height ?? window.innerHeight
      const offset = viewport?.offsetTop ?? 0
      setFrame(sheetFrame(window.innerHeight, height, offset))
      const active = document.activeElement
      if (active instanceof HTMLElement && bodyRef.current?.contains(active)) revealSheetField(active)
    }
    place()
    viewport?.addEventListener("resize", place)
    viewport?.addEventListener("scroll", place)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
      viewport?.removeEventListener("resize", place)
      viewport?.removeEventListener("scroll", place)
    }
  }, [onClose])
  const node = (
    <div className="portal-sheet-backdrop" onClick={onClose}>
      <div
        className="portal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={frame ? { bottom: frame.bottom, maxHeight: frame.maxHeight } : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="portal-sheet-bar">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button type="button" className="portal-sheet-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="portal-sheet-body space-y-2" ref={bodyRef}>
          {children}
        </div>
        <div className="portal-sheet-foot">
          {error ? (
            <p role="alert" className="mb-2 text-sm font-semibold text-[#B91C1C]">
              {error}
            </p>
          ) : null}
          <button type="button" className="pill pill-teal w-full" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
  if (typeof document === "undefined") return node
  return createPortal(node, document.body)
}
