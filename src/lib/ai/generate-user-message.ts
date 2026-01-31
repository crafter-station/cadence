import { generateText } from "ai";

import type { PersonalitySelect, TestSessionSelect } from "@/db/schema";

// Default model for user simulation - can be overridden via environment variable
const DEFAULT_MODEL = "anthropic/claude-3-5-haiku-latest";

interface GenerateUserMessageParams {
  personality: PersonalitySelect;
  transcript: TestSessionSelect["transcript"];
  turnNumber: number;
}

const CONVERSATION_STARTERS: Record<string, string[]> = {
  assertive: [
    "I need this resolved immediately.",
    "What's the status of my order?",
    "I don't have time for this - get me a supervisor.",
    "This is urgent. Fix it now.",
  ],
  confused: [
    "Hello? Is this the... support line?",
    "I'm not sure what I'm supposed to do here...",
    "My grandson told me to call about something...",
    "Can you help me? I don't understand this.",
  ],
  technical: [
    "What's the API rate limit for the v3 endpoint?",
    "I need the technical specifications for this integration.",
    "Can you explain the authentication flow?",
    "What's your system architecture?",
  ],
  emotional: [
    "I've been waiting for THREE WEEKS!",
    "This is absolutely unacceptable!",
    "I'm so frustrated with your service.",
    "Nobody seems to care about my problem!",
  ],
  multilingual: [
    "Hi, I need help with mi cuenta, please.",
    "Hello, I have a problema with my order.",
    "Excuse me, je voudrais some information.",
    "Can you help? Tengo una question.",
  ],
  rapid: [
    "Hey quick question about shipping also billing and returns",
    "Need to know three things: price warranty and delivery",
    "So I ordered yesterday and also want to add something and change address",
    "Hi yeah so my order number is 12345 and I need to track it also refund for item 2",
  ],
};

export async function generateUserMessage({
  personality,
  transcript,
  turnNumber,
}: GenerateUserMessageParams): Promise<string> {
  // For first turn, use a starter message
  if (turnNumber === 0) {
    const starters = CONVERSATION_STARTERS[personality.id] ?? CONVERSATION_STARTERS.assertive;
    return starters[Math.floor(Math.random() * starters.length)];
  }

  // Build context from transcript
  const conversationContext = transcript
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are roleplaying as a customer with the following personality:
Name: ${personality.name}
Description: ${personality.description}
Traits: ${personality.traits.join(", ")}

${personality.systemPrompt || ""}

Guidelines:
- Stay in character at all times
- Your response should be a single message from the customer
- Base your response on the conversation so far
- Exhibit the personality traits naturally
- Keep responses concise (1-3 sentences typically)
- Do not include any meta-commentary or break character`;

  const userPrompt = `Here is the conversation so far:

${conversationContext}

Generate the customer's next message. Remember to stay in character as ${personality.name}.`;

  try {
    // Use Vercel AI Gateway - model string format: provider/model-name
    const result = await generateText({
      model: process.env.USER_SIM_MODEL || DEFAULT_MODEL,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.8,
    });

    return result.text.trim();
  } catch (error) {
    // Fallback to simulated response if AI fails
    console.error("Failed to generate user message:", error);
    return generateFallbackMessage(personality, turnNumber);
  }
}

function generateFallbackMessage(
  personality: PersonalitySelect,
  turnNumber: number
): string {
  const followUps: Record<string, string[]> = {
    assertive: [
      "And what about the compensation?",
      "That's not good enough. What else can you do?",
      "I want to speak to someone higher up.",
    ],
    confused: [
      "I'm sorry, could you repeat that?",
      "What does that mean exactly?",
      "I don't understand. Can you explain differently?",
    ],
    technical: [
      "What's the latency on that?",
      "How does that handle edge cases?",
      "Can you provide documentation for that?",
    ],
    emotional: [
      "You don't understand how much this has affected me.",
      "I just want this to be over...",
      "Is anyone actually going to help me?",
    ],
    multilingual: [
      "Gracias, but I still have another question.",
      "D'accord, and what about the shipping?",
      "Entiendo, pero necesito more information.",
    ],
    rapid: [
      "Okay okay got it now what about the other thing",
      "Right right and also can you check something else",
      "Perfect and one more question plus a follow-up",
    ],
  };

  const messages = followUps[personality.id] ?? followUps.assertive;
  return messages[turnNumber % messages.length];
}
