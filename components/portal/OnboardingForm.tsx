"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveProfile } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { HeadshotForm } from "@/components/portal/HeadshotForm"
import { ChosenList } from "@/components/portal/AddPicker"
import { HealthQuestions } from "@/components/portal/HealthQuestions"
import { TicketBook } from "@/components/portal/TicketBook"
import { fieldClass } from "@/components/portal/ui"
import { FITNESS_DECLARATION } from "@/lib/portal/fitness"
import { firstIncompleteOnboardingStep } from "@/lib/portal/onboarding-step"
import { healthFromWorker, healthRecord } from "@/lib/portal/health"
import {
  EMERGENCY_RELATIONSHIPS,
  EXPERIENCE_LEVELS,
  FITNESS_OPTIONS,
  MEDICAL_SHARING,
  MEDICATION_ANSWERS,
  RTW_OPTIONS,
  TRANSPORT_OPTIONS,
  VEVO_METHODS,
  WEEKDAYS,
  WORK_AREAS,
  type Worker,
} from "@/lib/portal/types"
import type { PhotoRef } from "@/lib/portal/ticket-photos"

export function OnboardingForm({ worker, photos, today }: { worker: Worker; photos: PhotoRef[]; today: string }) {
  const router = useRouter()
  const [step, setStep] = useState(() => firstIncompleteOnboardingStep(worker))
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  const [signature, setSignature] = useState<string | null>(worker.signaturePng || null)
  const [typedName, setTypedName] = useState(worker.name)
  const [workAreas, setWorkAreas] = useState<string[]>(worker.workAreas || [])
  const [health, setHealth] = useState(() => healthFromWorker(worker))

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
      {step === 2 ? <TicketStep worker={worker} photos={photos} today={today} onDone={() => setStep(3)} /> : null}
      {step === 3 ? (
        <Form
          pending={pending}
          onSubmit={(data) => {
            const workDays = WEEKDAYS.filter((item) => data["day-" + item] === "on")
            const areas = workAreas.filter((area) => (WORK_AREAS as readonly string[]).includes(area))
            start(() =>
              save(
                {
                  experienceLevel: data.experienceLevel,
                  workHistory: data.workHistory,
                  availableFrom: data.availableFrom,
                  transport: data.transport,
                  workDays,
                  workAreas: areas,
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
              <ChosenList
                legend="Work areas"
                addLabel="+ Add area"
                groups={[{ name: "Areas", items: WORK_AREAS.map((area) => ({ id: area, label: area })) }]}
                selected={workAreas}
                onChange={setWorkAreas}
                empty="No areas added yet."
              />
            </>
          }
        />
      ) : null}
      {step === 4 ? (
        <Form
          pending={pending}
          onSubmit={(data) => {
            const record = healthRecord(health)
            if (!record.ok) {
              setError(record.error)
              return
            }
            start(() =>
              save(
                {
                  fitness: data.fitness,
                  healthConsent: data.healthConsent === "on",
                  allergies: record.allergies,
                  allergyTypes: record.allergyTypes,
                  anaphylaxis: record.anaphylaxis,
                  epipen: record.epipen,
                  medicalConditions: record.medicalConditions,
                  injury: record.injury,
                  tasksAffected: record.tasksAffected,
                  safetyMedication: data.safetyMedication,
                  medicalSharing: data.medicalSharing,
                  medicalNotes: record.medicalNotes,
                },
                5,
              ),
            )
          }}
          fields={
            <>
              <p className="text-sm leading-relaxed text-navy/80">
                Labouring usually means lifting about 20 to 25 kg, being on your feet for 8 hours, and working outdoors.
              </p>
              <Select label="Can you safely do these tasks?" name="fitness" defaultValue={worker.fitness} options={FITNESS_OPTIONS} />
              <HealthQuestions value={health} onChange={setHealth} />
              <Select label="Do you take any medication that could affect your safety at work?" name="safetyMedication" defaultValue={worker.safetyMedication} options={MEDICATION_ANSWERS} />
              <Select label="Can we share your allergy and medical information with the site supervisor or first aider?" name="medicalSharing" defaultValue={worker.medicalSharing} options={MEDICAL_SHARING} />
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

function TicketStep({ worker, photos, today, onDone }: { worker: Worker; photos: PhotoRef[]; today: string; onDone: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-navy/80">
        Add the licences and training certificates you hold. A White card is already on the list. Each one saves when you tap Save. Asbestos awareness, silica awareness and manual handling do not ask for an expiry. You need a photo of the front and the back before a card can be saved. You will not be able to open the photos again.
      </p>
      <TicketBook
        today={today}
        tickets={worker.tickets}
        otherHeld={worker.otherTicketsHeld || []}
        otherDetails={worker.licenceChecks || {}}
        photos={photos}
        onContinue={onDone}
      />
    </div>
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
