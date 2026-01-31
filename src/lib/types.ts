export type TestStatus = "idle" | "running" | "completed" | "failed"

export interface Personality {
  id: string
  name: string
  description: string
  traits: string[]
  color: string
}

export interface TestSession {
  id: string
  personalityId: string
  instanceId: number
  status: TestStatus
  progress: number
  latency: number[]
  accuracy: number
  turns: number
  errors: number
  transcript: { role: "user" | "agent"; content: string; timestamp: number }[]
}

export const FALLBACK_PERSONALITIES: Personality[] = [
  {
    id: "assertive-executive",
    name: "Assertive Executive",
    description: "Direct, time-constrained, expects immediate answers",
    traits: ["Interrupts frequently", "Short responses", "High expectations"],
    color: "chart-3",
  },
  {
    id: "confused-elder",
    name: "Confused Elder",
    description: "Needs clarification, repeats questions, slow-paced",
    traits: ["Asks for repetition", "Misunderstands", "Verbose"],
    color: "chart-2",
  },
  {
    id: "technical-expert",
    name: "Technical Expert",
    description: "Uses jargon, challenges accuracy, detail-oriented",
    traits: ["Deep questions", "Fact-checking", "Precise language"],
    color: "chart-1",
  },
  {
    id: "emotional-customer",
    name: "Emotional Customer",
    description: "Frustrated, needs empathy, escalation-prone",
    traits: ["Expresses frustration", "Seeks validation", "Long pauses"],
    color: "chart-4",
  },
  {
    id: "multilingual-user",
    name: "Multilingual User",
    description: "Code-switches, accent variations, cultural context",
    traits: ["Mixed languages", "Idioms", "Non-native patterns"],
    color: "chart-5",
  },
  {
    id: "rapid-speaker",
    name: "Rapid Speaker",
    description: "Fast-paced, overlapping speech, high throughput",
    traits: ["Quick responses", "Concurrent topics", "No pauses"],
    color: "chart-1",
  },
]
