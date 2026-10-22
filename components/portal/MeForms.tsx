"use client"

import { useState, useTransition } from "react"
import { saveDetails, saveSafetyInfo } from "@/app/portal/actions"
import { fieldClass } from "@/components/portal/ui"
import {
  ALLERGY_ANSWERS,
  ALLERGY_TYPES,
  ANAPHYLAXIS_ANSWERS,
  EMERGENCY_RELATIONSHIPS,
  EPIPEN_ANSWERS,
  INJURY_ANSWERS,
  MEDICAL_CONDITIONS,
  MEDICAL_SHARING,
  MEDICATION_ANSWERS,
  TASKS_AFFECTED,
  type Worker,
} from "@/lib/portal/types"

export function DetailsForm({ worker }: { worker: Worker }) {
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        setError("")
        setSaved("")
        start(async () => {
          const result = await saveDetails({
            preferredName: String(data.get("preferredName") || ""),
            suburb: String(data.get("suburb") || ""),
            postcode: String(data.get("postcode") || ""),
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setSaved("Saved. Your details are updated.")
        })
      }}
    >
      <label className="block text-sm font-semibold" htmlFor="preferredName">
        Preferred name
        <input id="preferredName" name="preferredName" defaultValue={worker.preferredName || ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="suburb">
        Suburb
        <input id="suburb" name="suburb" defaultValue={worker.suburb || ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="postcode">
        Postcode
        <input id="postcode" name="postcode" defaultValue={worker.postcode || ""} inputMode="numeric" className={fieldClass} />
      </label>
      <p className="text-sm">
        <span className="font-semibold">Mobile</span> {worker.mobile}
      </p>
      <p className="text-sm">
        <span className="font-semibold">Email</span> {worker.email || "None on file"}
      </p>
      <p className="text-xs leading-relaxed text-navy/70">To change these, contact MS Workforce.</p>
      {error ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      {saved ? <p className="text-sm font-semibold text-[#15803D]">{saved}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save details
      </button>
    </form>
  )
}

function SelectField({ label, name, value, options }: { label: string; name: string; value?: string; options: readonly string[] }) {
  return (
    <label className="block text-sm font-semibold" htmlFor={name}>
      {label}
      <select id={name} name={name} defaultValue={value || ""} className={fieldClass}>
        <option value="">Choose</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

export function SafetyForm({ worker }: { worker: Worker }) {
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [pending, start] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const picked = (prefix: string, options: readonly string[]) => options.filter((item) => data.get(prefix + item) === "on")
        setError("")
        setSaved("")
        start(async () => {
          const result = await saveSafetyInfo({
            consent: data.get("consent") === "on",
            emergencyContact: String(data.get("emergencyContact") || ""),
            emergencyRelationship: String(data.get("emergencyRelationship") || ""),
            emergencyPhone: String(data.get("emergencyPhone") || ""),
            allergies: String(data.get("allergies") || ""),
            allergyTypes: picked("allergy-", ALLERGY_TYPES),
            anaphylaxis: String(data.get("anaphylaxis") || ""),
            epipen: String(data.get("epipen") || ""),
            medicalConditions: picked("condition-", MEDICAL_CONDITIONS),
            injury: String(data.get("injury") || ""),
            tasksAffected: picked("task-", TASKS_AFFECTED),
            safetyMedication: String(data.get("safetyMedication") || ""),
            medicalSharing: String(data.get("medicalSharing") || ""),
          })
          if (!result.ok) {
            setError(result.error)
            return
          }
          setSaved("Saved. Only Mav can see this.")
        })
      }}
    >
      <p className="text-sm leading-relaxed">
        This is private. Only Mav sees it. We share it with the site supervisor or first aider only if you said yes below, or in an emergency.
      </p>
      <label className="block text-sm font-semibold" htmlFor="emergencyContact">
        Emergency contact
        <input id="emergencyContact" name="emergencyContact" defaultValue={worker.emergencyContact || ""} className={fieldClass} />
      </label>
      <SelectField label="Relationship" name="emergencyRelationship" value={worker.emergencyRelationship} options={EMERGENCY_RELATIONSHIPS} />
      <label className="block text-sm font-semibold" htmlFor="emergencyPhone">
        Emergency phone
        <input id="emergencyPhone" name="emergencyPhone" inputMode="tel" defaultValue={worker.emergencyPhone || ""} className={fieldClass} />
      </label>
      <SelectField label="Allergies" name="allergies" value={worker.allergies} options={ALLERGY_ANSWERS} />
      <fieldset>
        <legend className="text-sm font-semibold">What are you allergic to?</legend>
        <div className="mt-2 space-y-1">
          {ALLERGY_TYPES.map((item) => (
            <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
              <input type="checkbox" name={"allergy-" + item} defaultChecked={worker.allergyTypes?.includes(item)} />
              {item}
            </label>
          ))}
        </div>
      </fieldset>
      <SelectField label="Severe allergic reaction (anaphylaxis)?" name="anaphylaxis" value={worker.anaphylaxis} options={ANAPHYLAXIS_ANSWERS} />
      <SelectField label="Adrenaline auto-injector (EpiPen or Anapen)?" name="epipen" value={worker.epipen} options={EPIPEN_ANSWERS} />
      <fieldset>
        <legend className="text-sm font-semibold">A condition a first aider should know</legend>
        <div className="mt-2 space-y-1">
          {MEDICAL_CONDITIONS.map((item) => (
            <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
              <input type="checkbox" name={"condition-" + item} defaultChecked={worker.medicalConditions?.includes(item)} />
              {item}
            </label>
          ))}
        </div>
      </fieldset>
      <SelectField label="Injury that could affect the work" name="injury" value={worker.injury} options={INJURY_ANSWERS} />
      <fieldset>
        <legend className="text-sm font-semibold">Tasks it affects</legend>
        <div className="mt-2 space-y-1">
          {TASKS_AFFECTED.map((item) => (
            <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
              <input type="checkbox" name={"task-" + item} defaultChecked={worker.tasksAffected?.includes(item)} />
              {item}
            </label>
          ))}
        </div>
      </fieldset>
      <SelectField label="Medication that could affect safety" name="safetyMedication" value={worker.safetyMedication} options={MEDICATION_ANSWERS} />
      <SelectField label="Who may see this" name="medicalSharing" value={worker.medicalSharing} options={MEDICAL_SHARING} />
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="consent" defaultChecked={worker.healthConsent} />
        I agree MS Workforce can keep this to help keep me safe at work.
      </label>
      {error ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      {saved ? <p className="text-sm font-semibold text-[#15803D]">{saved}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save safety info
      </button>
    </form>
  )
}
