"use client"

import { useEffect, useId, useState } from "react"
import { fieldClass } from "@/components/portal/ui"
import {
  CURRENT_INJURY,
  PAST_INJURY,
  TELL_BY_PHONE,
  conditionOptions,
  healthSummary,
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
        summary={summaryLine("Allergies", value.allergies, value.allergyTypes, value.allergyNote)}
        onChoose={(choice) => choose("allergies", choice)}
        onEdit={() => open("allergies", value)}
      />
      <Question
        legend="A condition a first aider should know"
        choice={value.condition}
        summary={summaryLine("Condition", value.condition, value.conditions, value.conditionNote)}
        onChoose={(choice) => choose("condition", choice)}
        onEdit={() => open("condition", value)}
      />
      <Question
        legend="Injury that could affect the work"
        choice={value.injury}
        summary={summaryLine("Injury", value.injury, value.tasks, value.injuryNote)}
        onChoose={(choice) => choose("injury", choice)}
        onEdit={() => open("injury", value)}
      />
      {sheet ? (
        <Sheet title={sheet === "allergies" ? "Allergies" : sheet === "condition" ? "A condition a first aider should know" : "Injury that could affect the work"} onClose={() => setSheet(null)}>
          {sheet === "allergies" ? (
            <>
              <Checks legend="What are you allergic to?" options={ALLERGY_TYPES} selected={draft.allergyTypes} onChange={(allergyTypes) => setDraft({ ...draft, allergyTypes })} />
              <Describe value={draft.allergyNote} onChange={(allergyNote) => setDraft({ ...draft, allergyNote })} />
              <Choice label="Severe allergic reaction (anaphylaxis)?" value={draft.anaphylaxis} options={ANAPHYLAXIS_ANSWERS} onChange={(anaphylaxis) => setDraft({ ...draft, anaphylaxis })} />
              <Choice label="Adrenaline auto-injector (EpiPen or Anapen)?" value={draft.epipen} options={EPIPEN_ANSWERS} onChange={(epipen) => setDraft({ ...draft, epipen })} />
            </>
          ) : null}
          {sheet === "condition" ? (
            <>
              <Checks legend="Which condition?" options={conditionOptions()} selected={draft.conditions} onChange={(conditions) => setDraft({ ...draft, conditions })} />
              <Describe value={draft.conditionNote} onChange={(conditionNote) => setDraft({ ...draft, conditionNote })} />
            </>
          ) : null}
          {sheet === "injury" ? (
            <>
              <fieldset>
                <legend className="text-sm font-semibold">Which injury?</legend>
                <div className="mt-2 space-y-1">
                  {([CURRENT_INJURY, PAST_INJURY] as const).map((item) => (
                    <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                      <input type="radio" name="injury-kind" className="portal-check" checked={draft.injuryKind === item} onChange={() => setDraft({ ...draft, injuryKind: item })} />
                      {item === CURRENT_INJURY ? "A current injury" : "A past injury that still affects me"}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Checks legend="Tasks it affects" options={TASKS_AFFECTED} selected={draft.tasks} onChange={(tasks) => setDraft({ ...draft, tasks })} />
              <Describe value={draft.injuryNote} onChange={(injuryNote) => setDraft({ ...draft, injuryNote })} />
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
              {error}
            </p>
          ) : null}
          <button type="button" className="pill pill-teal w-full" onClick={saveSheet}>
            Save
          </button>
        </Sheet>
      ) : null}
    </div>
  )
}

function summaryLine(label: string, choice: HealthChoice, options: string[], note: string) {
  if (choice !== "Yes") return ""
  const summary = healthSummary(options, note)
  return summary ? label + ": " + summary : ""
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
        <p className="mt-2 flex items-center justify-between gap-3 text-sm">
          <span>{summary}</span>
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

function Checks({
  legend,
  options,
  selected,
  onChange,
}: {
  legend: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 space-y-1">
        {options.map((item) => (
          <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              className="portal-check"
              checked={selected.includes(item)}
              onChange={(event) => onChange(event.target.checked ? [...selected, item] : selected.filter((value) => value !== item))}
            />
            {item}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Describe({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold" htmlFor="health-describe">
      Describe
      <textarea id="health-describe" maxLength={200} rows={2} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
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

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId()
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])
  return (
    <div className="portal-sheet-backdrop" onClick={onClose}>
      <div
        className="portal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" className="min-h-12 min-w-11 font-semibold" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  )
}
