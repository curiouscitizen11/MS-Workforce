"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { finishInduction } from "@/app/portal/actions"
import { SignaturePad } from "@/components/portal/SignaturePad"
import { fieldClass } from "@/components/portal/ui"
import type { PublicQuestion } from "@/lib/portal/induction"

export function InductionForm({ questions, name }: { questions: PublicQuestion[]; name: string }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [sign, setSign] = useState(false)
  const [typedName, setTypedName] = useState(name)
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [fail, setFail] = useState("")
  const [pending, start] = useTransition()
  const question = questions[index]

  function submit(nextAnswers: number[], withSignature = false) {
    start(async () => {
      const result = await finishInduction({
        answers: nextAnswers,
        typedName: withSignature ? typedName : undefined,
        signaturePng: withSignature ? signature || undefined : undefined,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (!result.pass) {
        setFail("Review and try again. You need the safety-critical questions right, and at least 7 of 8.")
        setAnswers([])
        setIndex(0)
        setSign(false)
        return
      }
      if (result.needsSignature) {
        setSign(true)
        setFail("")
        return
      }
      router.push("/portal")
      router.refresh()
    })
  }

  if (sign) {
    return (
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit(answers, true)
        }}
      >
        <p className="text-sm leading-relaxed">You passed. Type your name and sign to finish.</p>
        <label className="block text-sm font-semibold" htmlFor="typed">
          Full name
          <input id="typed" className={fieldClass} value={typedName} onChange={(event) => setTypedName(event.target.value)} />
        </label>
        <SignaturePad onChange={setSignature} />
        {error ? <p className="text-sm font-semibold text-[#B91C1C]">{error}</p> : null}
        <button className="pill pill-teal w-full" disabled={pending}>
          Sign induction
        </button>
      </form>
    )
  }

  return (
    <div className="space-y-4">
      {fail ? <p className="rounded-2xl bg-[#FEF3C7] px-3 py-2 text-sm font-semibold text-[#B45309]">{fail}</p> : null}
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">
        Question {index + 1} of {questions.length}
      </p>
      <h2 className="text-xl font-semibold leading-snug">{question.prompt}</h2>
      <div className="space-y-2">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            className="min-h-12 w-full rounded-2xl border border-navy/15 bg-white px-4 py-3 text-left text-sm font-semibold"
            onClick={() => {
              const next = [...answers]
              next[index] = optionIndex
              setAnswers(next)
              if (index < questions.length - 1) setIndex(index + 1)
              else submit(next)
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
