import { generateText } from "ai";

interface TranscriptMessage {
  role: "user" | "agent";
  content: string;
  timestamp: number;
}

interface GenerateAgentResponseParams {
  systemPrompt: string;
  transcript: TranscriptMessage[];
}

interface AgentResponse {
  content: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

// Default model - can be overridden via environment variable
const DEFAULT_MODEL = "anthropic/claude-3-5-haiku-latest";

export async function generateAgentResponse({
  systemPrompt,
  transcript,
}: GenerateAgentResponseParams): Promise<AgentResponse> {
  // Build messages from transcript
  const messages = transcript.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  try {
    // Use Vercel AI Gateway - model string format: provider/model-name
    const result = await generateText({
      model: process.env.AGENT_MODEL || DEFAULT_MODEL,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return {
      content: result.text.trim(),
      tokensIn: result.usage?.inputTokens ?? null,
      tokensOut: result.usage?.outputTokens ?? null,
    };
  } catch (error) {
    console.error("Failed to generate agent response:", error);

    // Return a fallback response
    return {
      content:
        "I apologize, but I'm experiencing technical difficulties. Could you please repeat your question?",
      tokensIn: null,
      tokensOut: null,
    };
  }
}
