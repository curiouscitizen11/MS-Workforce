"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveProfile, saveTicketStep } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { HeadshotForm } from "@/components/portal/HeadshotForm"
import { TicketChoices } from "@/components/portal/TicketChoices"
import { TicketMeta, ticketDraft, type TicketDraft } from "@/components/portal/TicketMeta"
import { TicketPhotoPair } from "@/components/portal/TicketPhotos"
import { fieldClass } from "@/components/portal/ui"
import { FITNESS_DECLARATION } from "@/lib/portal/fitness"
import {
  ALLERGY_ANSWERS,
  ALLERGY_TYPES,
  ANAPHYLAXIS_ANSWERS,
  EMERGENCY_RELATIONSHIPS,
  EPIPEN_ANSWERS,
  EXPERIENCE_LEVELS,
  FITNESS_OPTIONS,
  INJURY_ANSWERS,
  MEDICAL_CONDITIONS,
  MEDICAL_SHARING,
  MEDICATION_ANSWERS,
  OTHER_TICKETS,
  RTW_OPTIONS,
  TASKS_AFFECTED,
  TICKET_ANSWERS,
  TICKET_LABELS,
  TICKET_TYPES,
  TRANSPORT_OPTIONS,
  VEVO_METHODS,
  WEEKDAYS,
  WORK_AREAS,
  type PhotoSide,
  type TicketType,
  type Worker,
} from "@/lib/portal/types"
import type { PhotoRef } from "@/lib/portal/ticket-photos"

export function OnboardingForm({ worker, photos }: { worker: Worker; photos: PhotoRef[] }) {
  const router = useRouter()
  const [step, setStep] = useState(worker.onboardingSubmitted ? 6 : 0)
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  const [signature, setSignature] = useState<string | null>(worker.signaturePng || null)
  const [typedName, setTypedName] = useState(worker.name)

  async function save(patch: Record<string, unknown>, next: number) {
    setError("")
    const result = await saveProfile(patch)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (patch.finish) {
      router.push("/portal/induction")
      router.refresh()
      return
    }
    setStep(next)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/70">Step {Math.min(step + 1, 7)} of 7</p>
      {step === 0 ? (
        <Form
          pending={pending}
          onSubmit={(data) => start(() => save(data, 1))}
          fields={
            <>
              <Text label="Preferred name" name="preferredName" defaultValue={worker.preferredName} />
              <Text label="Date of birth" name="dob" type="date" defaultValue={worker.dob} />
              <Text label="Address" name="address" defaultValue={worker.address} />
              <Text label="Postcode" name="postcode" defaultValue={worker.postcode} />
              <Text label="Emergency contact" name="emergencyContact" defaultValue={worker.emergencyContact} />
              <Select label="Relationship" name="emergencyRelationship" defaultValue={worker.emergencyRelationship} options={EMERGENCY_RELATIONSHIPS} />
              <Text label="Emergency phone" name="emergencyPhone" inputMode="tel" defaultValue={worker.emergencyPhone} />
            </>
          }
        />
      ) : null}
      {step === 1 ? (
        <Form
          pending={pending}
          onSubmit={(data) => start(() => save({ ...data, vevoConsent: data.vevoConsent === "on" }, 2))}
          fields={
            <>
              <Select label="Right to work" name="rtw" defaultValue={worker.rtw} options={RTW_OPTIONS} />
              <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                <input type="checkbox" name="vevoConsent" defaultChecked={worker.vevoConsent} />
                I agree to a VEVO check if I am on a visa
              </label>
              <Text label="Visa subclass" name="visaSubclass" defaultValue={worker.visaSubclass} />
              <Text label="Visa expiry" name="visaExpiry" type="date" defaultValue={worker.visaExpiry} />
              <Select label="How will you show work rights?" name="vevoMethod" defaultValue={worker.vevoMethod} options={VEVO_METHODS} />
              <p className="text-xs leading-relaxed text-navy/70">
                Do not type a passport number. MS Workforce checks work rights with VEVO. Work limits come from that check.
              </p>
            </>
          }
        />
      ) : null}
      {step === 2 ? <TicketStep worker={worker} photos={photos} onDone={() => setStep(3)} /> : null}
      {step === 3 ? (
        <Form
          pending={pending}
          onSubmit={(data) => {
            const workDays = WEEKDAYS.filter((item) => data["day-" + item] === "on")
            const workAreas = WORK_AREAS.filter((item) => data["area-" + item] === "on")
            start(() =>
              save(
                {
                  experienceLevel: data.experienceLevel,
                  workHistory: data.workHistory,
                  availableFrom: data.availableFrom,
                  transport: data.transport,
                  workDays,
                  workAreas,
                },
                4,
              ),
            )
          }}
          fields={
            <>
              <Select label="How much construction experience do you have?" name="experienceLevel" defaultValue={worker.experienceLevel} options={EXPERIENCE_LEVELS} />
              <Text label="Your last 1 or 2 jobs" name="workHistory" defaultValue={worker.workHistory} />
              <Text label="When can you start?" name="availableFrom" type="date" defaultValue={worker.availableFrom} />
              <Select label="How will you get to site?" name="transport" defaultValue={worker.transport} options={TRANSPORT_OPTIONS} />
              <fieldset>
                <legend className="text-sm font-semibold">Which days can you work?</legend>
                <div className="mt-2 space-y-1">
                  {WEEKDAYS.map((day) => (
                    <label key={day} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                      <input type="checkbox" name={"day-" + day} defaultChecked={worker.workDays?.includes(day)} />
                      {day}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-semibold">Work areas</legend>
                <div className="mt-2 space-y-1">
                  {WORK_AREAS.map((area) => (
                    <label key={area} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                      <input type="checkbox" name={"area-" + area} defaultChecked={worker.workAreas?.includes(area)} />
                      {area}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          }
        />
      ) : null}
      {step === 4 ? (
        <Form
          pending={pending}
          onSubmit={(data) =>
            start(() =>
              save(
                {
                  fitness: data.fitness,
                  healthConsent: data.healthConsent === "on",
                  allergies: data.allergies,
                  allergyTypes: ALLERGY_TYPES.filter((item) => data["allergy-" + item] === "on"),
                  anaphylaxis: data.anaphylaxis,
                  epipen: data.epipen,
                  medicalConditions: MEDICAL_CONDITIONS.filter((item) => data["condition-" + item] === "on"),
                  injury: data.injury,
                  tasksAffected: TASKS_AFFECTED.filter((item) => data["task-" + item] === "on"),
                  safetyMedication: data.safetyMedication,
                  medicalSharing: data.medicalSharing,
                  medicalNotes: data.medicalNotes,
                },
                5,
              ),
            )
          }
          fields={
            <>
              <p className="text-sm leading-relaxed text-navy/80">
                Labouring usually means lifting about 20 to 25 kg, being on your feet for 8 hours, and working outdoors.
              </p>
              <Select label="Can you safely do these tasks?" name="fitness" defaultValue={worker.fitness} options={FITNESS_OPTIONS} />
              <Select label="Do you have any allergies?" name="allergies" defaultValue={worker.allergies} options={ALLERGY_ANSWERS} />
              <Checks legend="What are you allergic to?" name="allergy" options={ALLERGY_TYPES} selected={worker.allergyTypes} />
              <Select label="Have you ever had a severe allergic reaction (anaphylaxis)?" name="anaphylaxis" defaultValue={worker.anaphylaxis} options={ANAPHYLAXIS_ANSWERS} />
              <Select label="Do you carry an adrenaline auto-injector (EpiPen or Anapen)?" name="epipen" defaultValue={worker.epipen} options={EPIPEN_ANSWERS} />
              <Checks legend="Do you have a medical condition a first aider should know about?" name="condition" options={MEDICAL_CONDITIONS} selected={worker.medicalConditions} />
              <Select label="Do you have an injury that could affect the work you can do?" name="injury" defaultValue={worker.injury} options={INJURY_ANSWERS} />
              <Checks legend="Which tasks does it affect?" name="task" options={TASKS_AFFECTED} selected={worker.tasksAffected} />
              <Select label="Do you take any medication that could affect your safety at work?" name="safetyMedication" defaultValue={worker.safetyMedication} options={MEDICATION_ANSWERS} />
              <Select label="Can we share your allergy and medical information with the site supervisor or first aider?" name="medicalSharing" defaultValue={worker.medicalSharing} options={MEDICAL_SHARING} />
              <Text label="Anything a first aider should know? (private)" name="medicalNotes" defaultValue={worker.medicalNotes} />
              <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                <input type="checkbox" name="healthConsent" defaultChecked={worker.healthConsent} />
                I agree MS Workforce can store these private health answers
              </label>
              <p className="text-xs text-navy/70">These answers stay private. They are not shown to builders.</p>
            </>
          }
        />
      ) : null}
      {step === 5 ? <HeadshotForm onDone={() => setStep(6)} /> : null}
      {step === 6 ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            start(() =>
              save(
                {
                  policiesAck: data.get("policies") === "on",
                  privacyConsent: data.get("privacy") === "on",
                  healthConsent: true,
                  declaration: data.get("declaration") === "on",
                  daConsent: data.get("da") === "on",
                  contractReceived: data.get("contract"),
                  contractAccepted: data.get("contractAccept") === "on",
                  signaturePng: signature,
                  typedName,
                  finish: true,
                },
                5,
              ),
            )
          }}
        >
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="policies" defaultChecked={worker.policiesAck} />
            I have read the workplace policies
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="privacy" defaultChecked={worker.privacyConsent} />
            I agree to the privacy notice
          </label>
          <label className="flex min-h-12 items-start gap-3 py-3 text-sm font-semibold leading-snug">
            <input type="checkbox" name="declaration" className="mt-0.5 h-5 w-5 shrink-0" defaultChecked={worker.declaration} />
            {FITNESS_DECLARATION}
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="da" defaultChecked={worker.daConsent} />
            I agree to the drug and alcohol policy
          </label>
          <Select label="Casual contract received?" name="contract" defaultValue={worker.contractReceived} options={["Yes", "Not yet"]} />
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="contractAccept" defaultChecked={worker.contractAccepted} />
            I accept the casual contract if I have received it
          </label>
          <Text label="Type your full name" name="typedName" value={typedName} onChange={(event) => setTypedName(event.target.value)} />
          <SignaturePad onChange={setSignature} />
          <p className="text-xs leading-relaxed text-navy/70">Tax, bank and super details are not collected here.</p>
          {error ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
          <button className="pill pill-teal w-full" disabled={pending}>
            Finish onboarding
          </button>
        </form>
      ) : null}
      {error && step !== 6 ? <p role="alert" className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
    </div>
  )
}

function knownAnswer(status: string | undefined) {
  return TICKET_ANSWERS.includes(status as (typeof TICKET_ANSWERS)[number]) ? status || "No" : "No"
}

function TicketStep({ worker, photos, onDone }: { worker: Worker; photos: PhotoRef[]; onDone: () => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState("")
  const [savedPhotos, setSavedPhotos] = useState<PhotoRef[]>(photos)
  const [answers, setAnswers] = useState<Record<TicketType, string>>(() => {
    const next = {} as Record<TicketType, string>
    for (const type of TICKET_TYPES) next[type] = knownAnswer(worker.tickets[type]?.status)
    return next
  })
  const [held, setHeld] = useState<string[]>(worker.otherTicketsHeld || [])
  const [entries, setEntries] = useState<Record<string, TicketDraft>>(() => {
    const next: Record<string, TicketDraft> = {}
    for (const type of TICKET_TYPES) next[type] = ticketDraft(type, worker.tickets[type])
    for (const [label, check] of Object.entries(worker.licenceChecks || {})) next[label] = ticketDraft(label, check)
    return next
  })
  const needed = [
    ...TICKET_TYPES.filter((type) => answers[type] === "Yes, I have it").map((type) => ({ key: type, label: TICKET_LABELS[type] })),
    ...held.filter((item) => item !== "None of these").map((item) => ({ key: item, label: item })),
  ]
  const ready = needed.every(
    (item) => savedPhotos.some((photo) => photo.key === item.key && photo.side === "front") && savedPhotos.some((photo) => photo.key === item.key && photo.side === "back"),
  )

  function onSaved(key: string, side: PhotoSide) {
    setSavedPhotos((current) => (current.some((photo) => photo.key === key && photo.side === side) ? current : [...current, { key, side }]))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) {
          setError("Add a photo of the front and the back of each card you hold before you continue.")
          return
        }
        start(async () => {
          const tickets = {} as Record<TicketType, TicketDraft & { status: string }>
          for (const type of TICKET_TYPES) {
            tickets[type] = { status: answers[type], ...(entries[type] || ticketDraft(type, worker.tickets[type])) }
          }
          const otherDetails: Record<string, TicketDraft> = {}
          for (const label of held) {
            if (label === "None of these") continue
            otherDetails[label] = entries[label] || ticketDraft(label, worker.licenceChecks?.[label])
          }
          const result = await saveTicketStep({ tickets, otherTicketsHeld: held, otherDetails })
          if (!result.ok) {
            setError(result.error)
            return
          }
          onDone()
        })
      }}
    >
      <p className="text-sm leading-relaxed text-navy/80">
        If you have a card, type the number and the expiry printed on it, then add a photo of the front and the back. You need both photos before you can continue. MS Workforce checks the number and expiry against the photos. You will not be able to open the photos again.
      </p>
      {TICKET_TYPES.map((type) => (
        <div key={type} className="space-y-2">
          <TicketChoices
            name={type}
            label={TICKET_LABELS[type]}
            value={answers[type]}
            course={type === "whiteCard"}
            onChange={(choice) => setAnswers({ ...answers, [type]: choice })}
          />
          {answers[type] === "Yes, I have it" ? (
            <>
              <TicketMeta
                id={type}
                draft={entries[type] || ticketDraft(type, worker.tickets[type])}
                onChange={(draft) => setEntries({ ...entries, [type]: draft })}
              />
              <TicketPhotoPair
                licenceKey={type}
                label={TICKET_LABELS[type]}
                front={savedPhotos.some((photo) => photo.key === type && photo.side === "front")}
                back={savedPhotos.some((photo) => photo.key === type && photo.side === "back")}
                onSaved={(side) => onSaved(type, side)}
              />
            </>
          ) : null}
        </div>
      ))}
      <fieldset>
        <legend className="text-sm font-semibold">Do you hold any of these other tickets?</legend>
        <div className="mt-2 space-y-1">
          {OTHER_TICKETS.map((item) => {
            const on = held.includes(item)
            return (
              <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(event) => setHeld(event.target.checked ? [...held, item] : held.filter((value) => value !== item))}
                />
                {item}
              </label>
            )
          })}
        </div>
      </fieldset>
      {held
        .filter((item) => item !== "None of these")
        .map((item) => (
          <div key={item} className="space-y-3">
            <TicketMeta
              id={"other-" + item}
              draft={entries[item] || ticketDraft(item, worker.licenceChecks?.[item])}
              onChange={(draft) => setEntries({ ...entries, [item]: draft })}
            />
            <TicketPhotoPair
              licenceKey={item}
              label={item}
              front={savedPhotos.some((photo) => photo.key === item && photo.side === "front")}
              back={savedPhotos.some((photo) => photo.key === item && photo.side === "back")}
              onSaved={(side) => onSaved(item, side)}
            />
          </div>
        ))}
      {error ? (
        <p role="alert" className="text-sm font-semibold text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      <button className="pill pill-teal w-full" disabled={pending || !ready}>
        Save tickets
      </button>
    </form>
  )
}

function Checks({
  legend,
  name,
  options,
  selected,
}: {
  legend: string
  name: string
  options: readonly string[]
  selected?: string[]
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 space-y-1">
        {options.map((item) => (
          <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name={name + "-" + item} defaultChecked={selected?.includes(item)} />
            {item}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Form({
  fields,
  onSubmit,
  pending,
}: {
  fields: React.ReactNode
  pending: boolean
  onSubmit: (data: Record<string, string>) => void
}) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const patch: Record<string, string> = {}
        data.forEach((value, key) => {
          patch[key] = String(value)
        })
        onSubmit(patch)
      }}
    >
      {fields}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save and continue
      </button>
    </form>
  )
}

function Text(props: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const { label, ...input } = props
  return (
    <label className="block text-sm font-semibold" htmlFor={input.name}>
      {label}
      <input id={input.name} className={fieldClass} {...input} />
    </label>
  )
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: readonly string[]
  defaultValue?: string
}) {
  return (
    <label className="block text-sm font-semibold" htmlFor={name}>
      {label}
      <select id={name} name={name} defaultValue={defaultValue} className={fieldClass}>
        <option value="">Choose</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}
