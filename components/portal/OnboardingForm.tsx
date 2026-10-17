"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveProfile, updateTicket } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import {
  ALLERGY_ANSWERS,
  ALLERGY_TYPES,
  ANAPHYLAXIS_ANSWERS,
  CONSTRUCTION_RECENT,
  DRIVER_CLASSES,
  EMERGENCY_RELATIONSHIPS,
  EPIPEN_ANSWERS,
  EXPERIENCE_LEVELS,
  FITNESS_OPTIONS,
  HELD_CHOICES,
  INJURY_ANSWERS,
  LICENCE_STATES,
  MEDICAL_CONDITIONS,
  MEDICAL_SHARING,
  MEDICATION_ANSWERS,
  OTHER_TICKETS,
  RTW_OPTIONS,
  TASKS_AFFECTED,
  TICKET_TYPES,
  TRANSPORT_OPTIONS,
  VEVO_METHODS,
  WEEKDAYS,
  WHITE_CARD_CHOICES,
  WORK_AREAS,
  type TicketType,
  type Worker,
} from "@/lib/portal/types"

export function OnboardingForm({ worker }: { worker: Worker }) {
  const router = useRouter()
  const [step, setStep] = useState(worker.onboardingSubmitted ? 5 : 0)
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
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Step {Math.min(step + 1, 6)} of 6</p>
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
      {step === 2 ? <TicketStep worker={worker} onDone={() => setStep(3)} /> : null}
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
      {step === 5 ? (
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
          <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="declaration" defaultChecked={worker.declaration} />
            I declare these answers are true
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
          {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
          <button className="pill pill-teal w-full" disabled={pending}>
            Finish onboarding
          </button>
        </form>
      ) : null}
      {error && step !== 5 ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
    </div>
  )
}

function TicketStep({ worker, onDone }: { worker: Worker; onDone: () => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState("")
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        start(async () => {
          for (const type of TICKET_TYPES) {
            const status = String(data.get(type) || (type === "whiteCard" ? "Not completed" : "Not held"))
            const result = await updateTicket(type, {
              status,
              number: String(data.get(type + "-number") || "") || undefined,
              expiry: String(data.get(type + "-expiry") || "") || null,
              issued: type === "whiteCard" ? String(data.get("whiteCard-issued") || "") || null : undefined,
              state: String(data.get(type + "-state") || "") || undefined,
            })
            if (!result.ok) {
              setError(result.error)
              return
            }
          }
          const profile = await saveProfile({
            constructionRecent: String(data.get("constructionRecent") || ""),
            licenceState: String(data.get("licenceState") || ""),
            otherTicketsHeld: OTHER_TICKETS.filter((item) => data.get("other-" + item) === "on"),
          })
          if (!profile.ok) {
            setError(profile.error)
            return
          }
          onDone()
        })
      }}
    >
      {TICKET_TYPES.map((type) => (
        <TicketRow key={type} type={type} ticket={worker.tickets[type]} />
      ))}
      <Select label="Have you done any construction work in the last 2 years?" name="constructionRecent" defaultValue={worker.constructionRecent} options={CONSTRUCTION_RECENT} />
      <Select label="Driver licence: state" name="licenceState" defaultValue={worker.licenceState} options={LICENCE_STATES} />
      <Checks legend="Do you hold any of these other tickets?" name="other" options={OTHER_TICKETS} selected={worker.otherTicketsHeld} />
      {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save tickets
      </button>
    </form>
  )
}

function TicketRow({ type, ticket }: { type: TicketType; ticket: Worker["tickets"][TicketType] }) {
  const status = ticket.status
  const options = type === "driverLicence" ? DRIVER_CLASSES : type === "whiteCard" ? WHITE_CARD_CHOICES : HELD_CHOICES
  const labels: Record<TicketType, string> = {
    whiteCard: "White card",
    heights: "Work at heights",
    asbestosA: "Asbestos Class A",
    asbestosB: "Asbestos Class B",
    confinedSpace: "Confined space",
    firstAid: "First aid",
    driverLicence: "Driver licence",
    other: "Other ticket",
  }
  return (
    <label className="block text-sm font-semibold">
      {labels[type]}
      <select
        name={type}
        defaultValue={type === "whiteCard" && (!status || status === "Not held") ? "Not completed" : status || "Not held"}
        className={fieldClass}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      {type === "whiteCard" ? <Text label="Date issued" name="whiteCard-issued" type="date" defaultValue={ticket.issued || ""} /> : null}
    </label>
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
