"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { saveProfile, updateTicket } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import { DRIVER_CLASSES, FITNESS_OPTIONS, HELD_CHOICES, PPE_OPTIONS, RTW_OPTIONS, TICKET_TYPES, TRANSPORT_OPTIONS, type TicketType, type Worker } from "@/lib/portal/types"

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
              <Text label="Date of birth" name="dob" type="date" defaultValue={worker.dob} />
              <Text label="Address" name="address" defaultValue={worker.address} />
              <Text label="Emergency contact" name="emergencyContact" defaultValue={worker.emergencyContact} />
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
              <Text label="Visa conditions" name="visaConditions" defaultValue={worker.visaConditions} />
              <Text label="Visa expiry" name="visaExpiry" type="date" defaultValue={worker.visaExpiry} />
              <Text label="Passport number (optional, kept private)" name="passportNumber" autoComplete="off" />
              <Text label="Passport country" name="passportCountry" />
              <p className="text-xs leading-relaxed text-navy/70">
                The passport number is encrypted. Mav sees it once for VEVO, then it is deleted. It is not sent to Notion.
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
            const ppe = PPE_OPTIONS.filter((item) => data["ppe-" + item] === "on")
            start(() => save({ ppe, transport: data.transport }, 4))
          }}
          fields={
            <>
              <fieldset>
                <legend className="text-sm font-semibold">PPE you already own</legend>
                <div className="mt-2 space-y-1">
                  {PPE_OPTIONS.map((item) => (
                    <label key={item} className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                      <input type="checkbox" name={"ppe-" + item} defaultChecked={worker.ppe.includes(item)} />
                      {item}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Select label="How will you get to site?" name="transport" defaultValue={worker.transport} options={TRANSPORT_OPTIONS} />
            </>
          }
        />
      ) : null}
      {step === 4 ? (
        <Form
          pending={pending}
          onSubmit={(data) => start(() => save({ fitness: data.fitness, healthConsent: data.healthConsent === "on" }, 5))}
          fields={
            <>
              <Select label="Can you safely do this work?" name="fitness" defaultValue={worker.fitness} options={FITNESS_OPTIONS} />
              <label className="flex min-h-12 items-center gap-3 text-sm font-semibold">
                <input type="checkbox" name="healthConsent" defaultChecked={worker.healthConsent} />
                I agree you can store this fitness answer
              </label>
              <p className="text-xs text-navy/70">We do not ask for medical details.</p>
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
            const status = String(data.get(type) || "Not held")
            const result = await updateTicket(type, {
              status,
              number: String(data.get(type + "-number") || "") || undefined,
              expiry: String(data.get(type + "-expiry") || "") || null,
              state: String(data.get(type + "-state") || "") || undefined,
            })
            if (!result.ok) {
              setError(result.error)
              return
            }
          }
          onDone()
        })
      }}
    >
      {TICKET_TYPES.map((type) => (
        <TicketRow key={type} type={type} status={worker.tickets[type].status} />
      ))}
      {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
      <button className="pill pill-teal w-full" disabled={pending}>
        Save tickets
      </button>
    </form>
  )
}

function TicketRow({ type, status }: { type: TicketType; status: string }) {
  const options = type === "driverLicence" ? DRIVER_CLASSES : HELD_CHOICES
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
      <select name={type} defaultValue={status || "Not held"} className={fieldClass}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
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
