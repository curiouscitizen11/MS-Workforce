/**
 * WHS induction v1.0.
 * Topics and the pass rule match the live quiz: all 3 critical questions
 * (1, 2 and 4) correct, and at least 7 of 8 overall.
 * The live answer wording was not in the website repo, so confirm the
 * option text against the current induction form before go-live.
 */
export const INDUCTION_VERSION = "v1.0"

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  critical: boolean
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    critical: true,
    correctIndex: 2,
    prompt: "You arrive on site and have not done the site induction. What do you do?",
    options: [
      "Start work and do the induction at lunch",
      "Ask a mate what the rules are and get on with it",
      "Stop. Do the site induction before I start work",
      "Sign the book and start if the supervisor is busy",
    ],
  },
  {
    id: "q2",
    critical: true,
    correctIndex: 0,
    prompt: "The supervisor asks you to operate plant you are not licensed or trained for. What do you do?",
    options: [
      "Say no. I will not use plant I am not licensed or trained for",
      "Have a go if someone watches me",
      "Use it only for a few minutes",
      "Do it if the supervisor signs a note",
    ],
  },
  {
    id: "q3",
    critical: false,
    correctIndex: 3,
    prompt: "Who do you report a near miss to?",
    options: [
      "Nobody, if nobody was hurt",
      "Only the other workers on the crew",
      "Wait until the end of the week",
      "My supervisor, and MS Workforce",
    ],
  },
  {
    id: "q4",
    critical: true,
    correctIndex: 1,
    prompt: "You had a big night and still feel affected by alcohol or drugs. What do you do?",
    options: [
      "Start work and drink water",
      "I don't start. I tell my supervisor I am not fit for work",
      "Work if I feel a bit better after smoko",
      "Only do light jobs",
    ],
  },
  {
    id: "q5",
    critical: false,
    correctIndex: 2,
    prompt: "What do you bring to every site unless you are told otherwise?",
    options: [
      "Just a hi-vis shirt",
      "Whatever is in the ute",
      "Steel-cap boots, hi-vis, hard hat and safety glasses",
      "Boots only. The builder supplies the rest",
    ],
  },
  {
    id: "q6",
    critical: false,
    correctIndex: 0,
    prompt: "You see an unguarded edge or an open trench. What do you do?",
    options: [
      "Stop, keep clear, and report it straight away",
      "Step over it if I am careful",
      "Cover it and keep working",
      "Leave it for the next crew",
    ],
  },
  {
    id: "q7",
    critical: false,
    correctIndex: 1,
    prompt: "You are running late or cannot make it to site. What do you do?",
    options: [
      "Turn up when I can. No need to call",
      "Call the site contact and MS Workforce as soon as I know",
      "Message a workmate only",
      "Wait until the morning of the shift",
    ],
  },
  {
    id: "q8",
    critical: false,
    correctIndex: 3,
    prompt: "Someone is injured on site. What is your first step?",
    options: [
      "Move them somewhere quieter",
      "Keep working so the job stays on time",
      "Post about it after the shift",
      "Make sure it is safe to help, then get a first aider or call 000",
    ],
  },
]

export type PublicQuestion = { id: string; prompt: string; options: string[] }

export function publicQuiz(): PublicQuestion[] {
  return QUESTIONS.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }))
}

export function scoreAnswers(answers: number[]): { score: number; critical: number; pass: boolean } {
  let score = 0
  let critical = 0
  QUESTIONS.forEach((question, index) => {
    if (answers[index] !== question.correctIndex) return
    score += 1
    if (question.critical) critical += 1
  })
  return { score, critical, pass: critical === 3 && score >= 7 }
}
