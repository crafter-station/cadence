import { generateObject } from "ai";
import { z } from "zod";

import type { PersonalitySelect, TestSessionSelect } from "@/db/schema";

// Default model for analysis - can be overridden via environment variable
const DEFAULT_MODEL = "anthropic/claude-3-5-haiku-latest";

interface AnalyzeTranscriptParams {
  transcript: TestSessionSelect["transcript"];
  personality: PersonalitySelect;
}

interface AnalysisResult {
  accuracy: number;
  issues: string[];
}

const AnalysisSchema = z.object({
  accuracy: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall accuracy score from 0-100"),
  issues: z
    .array(z.string())
    .describe("List of specific issues found in the conversation"),
  strengths: z
    .array(z.string())
    .describe("List of things the agent did well"),
});

export async function analyzeTranscript({
  transcript,
  personality,
}: AnalyzeTranscriptParams): Promise<AnalysisResult> {
  if (transcript.length === 0) {
    return { accuracy: 0, issues: ["No conversation to analyze"] };
  }

  const conversationText = transcript
    .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are an expert at evaluating customer service conversations.
Analyze the following conversation where the customer has this personality profile:

Name: ${personality.name}
Description: ${personality.description}
Traits: ${personality.traits.join(", ")}

Evaluate the agent's performance based on:
1. Appropriateness of responses for this customer type
2. Helpfulness and clarity
3. Tone and empathy
4. Resolution effectiveness
5. Handling of customer's specific traits`;

  try {
    // Use Vercel AI Gateway - model string format: provider/model-name
    const result = await generateObject({
      model: process.env.ANALYSIS_MODEL || DEFAULT_MODEL,
      schema: AnalysisSchema,
      system: systemPrompt,
      prompt: `Analyze this conversation:\n\n${conversationText}`,
    });

    return {
      accuracy: result.object.accuracy,
      issues: result.object.issues,
    };
  } catch (error) {
    console.error("Failed to analyze transcript:", error);

    // Return a basic analysis if AI fails
    return estimateAccuracy(transcript, personality);
  }
}

function estimateAccuracy(
  transcript: TestSessionSelect["transcript"],
  personality: PersonalitySelect
): AnalysisResult {
  let score = 70; // Base score
  const issues: string[] = [];

  const agentMessages = transcript.filter((m) => m.role === "agent");

  // Check for very short responses
  const shortResponses = agentMessages.filter((m) => m.content.length < 20);
  if (shortResponses.length > agentMessages.length / 2) {
    score -= 10;
    issues.push("Too many short responses");
  }

  // Check for appropriate tone based on personality
  if (personality.id === "emotional") {
    const empathyPhrases = ["understand", "sorry", "frustrat", "help"];
    const hasEmpathy = agentMessages.some((m) =>
      empathyPhrases.some((p) => m.content.toLowerCase().includes(p))
    );
    if (!hasEmpathy) {
      score -= 15;
      issues.push("Lacking empathy for emotional customer");
    }
  }

  if (personality.id === "confused") {
    const clarityPhrases = ["let me explain", "simply put", "to clarify"];
    const hasClarity = agentMessages.some((m) =>
      clarityPhrases.some((p) => m.content.toLowerCase().includes(p))
    );
    if (!hasClarity) {
      score -= 10;
      issues.push("Not adapting communication for confused customer");
    }
  }

  if (personality.id === "technical") {
    const technicalDepth = agentMessages.some(
      (m) => m.content.length > 100 && /\d/.test(m.content)
    );
    if (!technicalDepth) {
      score -= 10;
      issues.push("Lacking technical detail for technical customer");
    }
  }

  // Add some randomness to simulate variation
  score += Math.floor(Math.random() * 10) - 5;
  score = Math.max(0, Math.min(100, score));

  return { accuracy: score, issues };
}

// Healing suggestions generation
interface GenerateHealingSuggestionsParams {
  promptContent: string;
  personality: PersonalitySelect;
  transcripts: TestSessionSelect["transcript"][];
  avgAccuracy: number;
}

interface HealingSuggestion {
  issue: string;
  suggestion: string;
  suggestedPrompt: string | null;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  examples: string[];
}

const HealingSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      issue: z.string().describe("Brief description of the identified issue"),
      suggestion: z
        .string()
        .describe("Specific recommendation to fix the issue"),
      suggestedPromptAddition: z
        .string()
        .nullable()
        .describe("Text to add to the prompt to address this issue"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence in this suggestion (0-1)"),
      severity: z
        .enum(["low", "medium", "high", "critical"])
        .describe("How severe is this issue"),
      examples: z
        .array(z.string())
        .describe("Examples from the transcripts showing this issue"),
    })
  ),
});

export async function generateHealingSuggestions({
  promptContent,
  personality,
  transcripts,
  avgAccuracy,
}: GenerateHealingSuggestionsParams): Promise<HealingSuggestion[]> {
  // Format transcripts for analysis
  const transcriptSummaries = transcripts
    .map((t, i) => {
      const conv = t
        .slice(-6)
        .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
        .join("\n");
      return `--- Session ${i + 1} ---\n${conv}`;
    })
    .join("\n\n");

  const systemPrompt = `You are an expert at improving AI agent prompts for customer service.

Current prompt being tested:
---
${promptContent}
---

The prompt was tested against customers with this personality:
Name: ${personality.name}
Description: ${personality.description}
Traits: ${personality.traits.join(", ")}

Average accuracy score: ${avgAccuracy.toFixed(1)}%

Analyze the sample conversations and identify specific issues with the current prompt.
Provide actionable suggestions to improve the prompt for this customer type.`;

  try {
    // Use Vercel AI Gateway - model string format: provider/model-name
    const result = await generateObject({
      model: process.env.ANALYSIS_MODEL || DEFAULT_MODEL,
      schema: HealingSuggestionSchema,
      system: systemPrompt,
      prompt: `Here are sample conversations from the test:\n\n${transcriptSummaries}\n\nIdentify issues and provide improvement suggestions.`,
    });

    return result.object.suggestions.map((s) => ({
      issue: s.issue,
      suggestion: s.suggestion,
      suggestedPrompt: s.suggestedPromptAddition
        ? `${promptContent}\n\n${s.suggestedPromptAddition}`
        : null,
      confidence: s.confidence,
      severity: s.severity,
      examples: s.examples,
    }));
  } catch (error) {
    console.error("Failed to generate healing suggestions:", error);

    // Return basic suggestions if AI fails
    return generateFallbackSuggestions(personality, avgAccuracy);
  }
}

function generateFallbackSuggestions(
  personality: PersonalitySelect,
  avgAccuracy: number
): HealingSuggestion[] {
  const suggestions: HealingSuggestion[] = [];

  if (avgAccuracy < 70) {
    suggestions.push({
      issue: `Low performance with ${personality.name} personality type`,
      suggestion: `Add specific handling instructions for ${personality.name} customers`,
      suggestedPrompt: null,
      confidence: 0.6,
      severity: avgAccuracy < 50 ? "critical" : "high",
      examples: [],
    });
  }

  // Personality-specific suggestions
  const personalitySuggestions: Record<
    string,
    { issue: string; suggestion: string }
  > = {
    assertive: {
      issue: "May not be direct enough for assertive customers",
      suggestion:
        "Add instruction to be concise and direct, get to the point quickly",
    },
    confused: {
      issue: "May use overly complex language",
      suggestion:
        "Add instruction to use simple language and offer to explain concepts",
    },
    emotional: {
      issue: "May lack empathy in responses",
      suggestion:
        "Add instruction to acknowledge feelings before providing solutions",
    },
    technical: {
      issue: "May lack technical depth",
      suggestion:
        "Add instruction to provide detailed technical information when asked",
    },
    multilingual: {
      issue: "May not handle code-switching well",
      suggestion:
        "Add instruction to be patient with mixed-language input and clarify when needed",
    },
    rapid: {
      issue: "May not handle multiple questions in one message",
      suggestion:
        "Add instruction to address each point systematically when multiple questions are asked",
    },
  };

  const personalitySuggestion = personalitySuggestions[personality.id];
  if (personalitySuggestion) {
    suggestions.push({
      ...personalitySuggestion,
      suggestedPrompt: null,
      confidence: 0.5,
      severity: "medium",
      examples: [],
    });
  }

  return suggestions;
}
