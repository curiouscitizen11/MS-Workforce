import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { HealthQuestions } from "@/components/portal/HealthQuestions"
import { healthFromWorker, healthRecord, healthSummary, type HealthDraft } from "@/lib/portal/health"
import { workerNotionProperties } from "@/lib/portal/notion/map"
import { createMemoryStore } from "@/lib/portal/store"

const empty: HealthDraft = {
  allergies: "No",
  allergyTypes: [],
  allergyNote: "",
  anaphylaxis: "",
  epipen: "",
  condition: "No",
  conditions: [],
  conditionNote: "",
  injury: "No",
  injuryKind: "Yes, a current injury",
  tasks: [],
  injuryNote: "",
  otherNotes: "",
}

describe("health questions", () => {
  it("keeps a yes answer only when there is a choice or a description, and clears a no", () => {
    const missing = healthRecord({ ...empty, allergies: "Yes" })
    expect(missing.ok).toBe(false)
    const described = healthRecord({ ...empty, allergies: "Yes", allergyNote: "Bee stings" })
    expect(described.ok).toBe(true)
    if (described.ok) {
      expect(described.allergyTypes).toEqual(["Other, please explain"])
      expect(described.medicalNotes).toBe("Allergies: Bee stings")
      expect(described.medicalConditions).toEqual(["No"])
      expect(described.injury).toBe("No")
      expect(described.tasksAffected).toEqual([])
    }
    const cleared = healthFromWorker({
      allergies: "No",
      allergyTypes: ["Latex"],
      medicalConditions: ["Asthma"],
      injury: "No",
      tasksAffected: ["Ladders or heights"],
    })
    expect(cleared.allergyTypes).toEqual([])
    expect(cleared.condition).toBe("Yes")
    expect(cleared.conditions).toEqual(["Asthma"])
    expect(cleared.tasks).toEqual([])
    expect(healthSummary(["Bee or wasp stings", "Latex"], "")).toBe("Bee or wasp stings, Latex")
  })

  it("hides the option list until yes, and shows one summary row", () => {
    const hidden = renderToStaticMarkup(createElement(HealthQuestions, { value: empty, onChange: () => undefined }))
    expect(hidden).toContain("Allergies")
    expect(hidden).toContain("I&#x27;d rather tell MS Workforce by phone")
    expect(hidden).not.toContain("Bee or wasp stings")
    expect(hidden).not.toContain("Tasks it affects")
    expect(hidden).not.toContain("anaphylaxis")

    const shown = renderToStaticMarkup(
      createElement(HealthQuestions, {
        value: { ...empty, allergies: "Yes", allergyTypes: ["Bee or wasp stings", "Latex"], anaphylaxis: "No", epipen: "No" },
        onChange: () => undefined,
      }),
    )
    expect(shown).toContain("Allergies: Bee or wasp stings, Latex")
    expect(shown).toContain("Edit")
    expect(shown).not.toContain("Other insect bites")

    const sheet = renderToStaticMarkup(
      createElement(HealthQuestions, {
        value: { ...empty, allergies: "Yes", allergyTypes: ["Latex"] },
        onChange: () => undefined,
        initialSheet: "allergies",
      }),
    )
    expect(sheet).toContain("What are you allergic to?")
    expect(sheet).toContain("Describe")
    expect(sheet).toContain("anaphylaxis")
    expect(sheet).toContain('role="dialog"')
    expect(sheet).not.toContain("Tasks it affects")
  })

  it("still sends the same Notion health properties", async () => {
    const store = createMemoryStore({ seed: true })
    const worker = await store.workers.get("w-sam")
    if (!worker) throw new Error("missing worker")
    worker.allergies = "Yes"
    worker.allergyTypes = ["Latex"]
    worker.anaphylaxis = "No"
    worker.epipen = "No"
    worker.medicalConditions = ["Asthma"]
    worker.medicalNotes = "Condition: uses an inhaler"
    worker.injury = "Yes, a current injury"
    worker.tasksAffected = ["Lifting or carrying"]
    const props = workerNotionProperties(worker)
    expect(props.Allergies).toBe("Yes")
    expect(props["Allergy types"]).toEqual(["Latex"])
    expect(props["Anaphylaxis risk"]).toBe("No")
    expect(props["Carries EpiPen"]).toBe("No")
    expect(props["Medical conditions"]).toEqual(["Asthma"])
    expect(props["Medical notes"]).toBe("Condition: uses an inhaler")
    expect(props["Injury affecting duties"]).toBe("Yes, a current injury")
    expect(props["Tasks affected"]).toEqual(["Lifting or carrying"])
  })
})
