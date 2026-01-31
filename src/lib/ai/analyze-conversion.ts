import { generateObject } from "ai";
import { z } from "zod";

import type { TestSessionSelect } from "@/db/schema";

const DEFAULT_MODEL = "anthropic/claude-3-5-haiku-latest";

interface AnalyzeConversionParams {
  transcript: TestSessionSelect["transcript"];
  conversionGoals: string[];
  personalityName: string;
  personalityTraits: string[];
}

interface ConversionPoint {
  turn: number;
  type: "opportunity" | "success" | "failure";
  goal: string;
  description: string;
}

interface AnalyzeConversionResult {
  conversionAchieved: boolean;
  conversionScore: number;
  conversionPoints: ConversionPoint[];
  missedOpportunities: string[];
  recommendedActions: string[];
}

const ConversionAnalysisSchema = z.object({
  conversionAchieved: z
    .boolean()
    .describe("Whether any of the conversion goals were achieved"),
  conversionScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall conversion effectiveness score (0-100)"),
  conversionPoints: z.array(
    z.object({
      turn: z.number().describe("The conversation turn number (0-indexed)"),
      type: z
        .enum(["opportunity", "success", "failure"])
        .describe("Type of conversion event"),
      goal: z.string().describe("Which goal this relates to"),
      description: z.string().describe("What happened at this point"),
    })
  ),
  missedOpportunities: z
    .array(z.string())
    .describe("Specific opportunities that were missed to convert"),
  recommendedActions: z
    .array(z.string())
    .describe("Specific actions the agent should take to improve conversion"),
});

export async function analyzeConversion({
  transcript,
  conversionGoals,
  personalityName,
  personalityTraits,
}: AnalyzeConversionParams): Promise<AnalyzeConversionResult> {
  if (transcript.length === 0) {
    return {
      conversionAchieved: false,
      conversionScore: 0,
      conversionPoints: [],
      missedOpportunities: ["No conversation to analyze"],
      recommendedActions: ["Engage the customer to start a conversation"],
    };
  }

  if (conversionGoals.length === 0) {
    return {
      conversionAchieved: false,
      conversionScore: 50,
      conversionPoints: [],
      missedOpportunities: [],
      recommendedActions: ["Define conversion goals for meaningful analysis"],
    };
  }

  const conversationText = transcript
    .map(
      (m, i) =>
        `[Turn ${i}] ${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`
    )
    .join("\n");

  const systemPrompt = `You are an expert at analyzing sales and customer service conversations for conversion effectiveness.

Conversion Goals to Evaluate:
${conversionGoals.map((g, i) => `${i + 1}. ${g}`).join("\n")}

Customer Profile:
- Name: ${personalityName}
- Traits: ${personalityTraits.join(", ")}

Analyze the conversation to determine:
1. Whether any conversion goals were achieved
2. Where conversion opportunities arose
3. What opportunities were missed
4. What the agent could do differently to improve conversion

Be specific about turn numbers and what happened.`;

  try {
    const result = await generateObject({
      model: process.env.ANALYSIS_MODEL || DEFAULT_MODEL,
      schema: ConversionAnalysisSchema,
      system: systemPrompt,
      prompt: `Analyze this conversation for conversion effectiveness:\n\n${conversationText}`,
    });

    return {
      conversionAchieved: result.object.conversionAchieved,
      conversionScore: result.object.conversionScore,
      conversionPoints: result.object.conversionPoints,
      missedOpportunities: result.object.missedOpportunities,
      recommendedActions: result.object.recommendedActions,
    };
  } catch (error) {
    console.error("Failed to analyze conversion:", error);

    // Return a basic heuristic-based analysis
    return estimateConversion(transcript, conversionGoals);
  }
}

function estimateConversion(
  transcript: TestSessionSelect["transcript"],
  conversionGoals: string[]
): AnalyzeConversionResult {
  const agentMessages = transcript.filter((m) => m.role === "agent");
  const conversationText = transcript.map((m) => m.content.toLowerCase()).join(" ");

  // Simple keyword matching for common conversion indicators
  const positiveIndicators = [
    "schedule",
    "book",
    "demo",
    "meeting",
    "call",
    "email",
    "sign up",
    "register",
    "subscribe",
    "purchase",
    "buy",
    "order",
    "confirm",
    "yes",
    "agree",
    "interested",
  ];

  const negativeIndicators = [
    "no thanks",
    "not interested",
    "maybe later",
    "think about it",
    "busy",
    "not now",
  ];

  let score = 50;
  const hasPositive = positiveIndicators.some((p) => conversationText.includes(p));
  const hasNegative = negativeIndicators.some((n) => conversationText.includes(n));

  if (hasPositive && !hasNegative) {
    score = 75;
  } else if (hasNegative) {
    score = 25;
  }

  // Check if agent asked for conversion
  const agentAskedForAction = agentMessages.some((m) =>
    ["would you like", "can i schedule", "shall i", "let me book", "sign up"].some(
      (phrase) => m.content.toLowerCase().includes(phrase)
    )
  );

  if (!agentAskedForAction) {
    score = Math.max(20, score - 20);
  }

  return {
    conversionAchieved: hasPositive && !hasNegative,
    conversionScore: score,
    conversionPoints: [],
    missedOpportunities: agentAskedForAction
      ? []
      : ["Agent did not ask for a specific conversion action"],
    recommendedActions: [
      "Include clear calls to action",
      "Ask directly for the desired outcome",
    ],
  };
}
