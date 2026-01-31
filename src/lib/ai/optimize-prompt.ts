import { generateObject } from "ai";
import { z } from "zod";

import type { PersonalitySelect, HealingSuggestionSelect } from "@/db/schema";

const DEFAULT_MODEL = "anthropic/claude-3-5-haiku-latest";

interface EpochMetrics {
  personalityId: string;
  personalityName: string;
  accuracy: number | null;
  conversionRate: number | null;
  sessionsCount: number;
  issues: Array<{ issue: string; count: number; severity: string }>;
}

interface TranscriptSample {
  personalityId: string;
  personalityName: string;
  transcript: Array<{ role: string; content: string }>;
  accuracy: number | null;
  conversionScore: number | null;
}

interface OptimizePromptParams {
  currentPrompt: string;
  epochMetrics: EpochMetrics[];
  healingSuggestions: HealingSuggestionSelect[];
  sampleTranscripts: TranscriptSample[];
  targetMetric: "conversion" | "accuracy" | "csat" | "latency";
  conversionGoals: string[];
}

interface OptimizePromptResult {
  improvedPrompt: string;
  changes: string[];
  reasoning: string;
  predictedImpact: {
    accuracy: number;
    conversion: number;
  };
  appliedSuggestionIds: string[];
}

const OptimizedPromptSchema = z.object({
  improvedPrompt: z
    .string()
    .describe("The complete improved prompt with all changes applied"),
  changes: z
    .array(z.string())
    .describe("List of specific changes made to the prompt"),
  reasoning: z
    .string()
    .describe("Explanation of why these changes will improve performance"),
  predictedAccuracyImprovement: z
    .number()
    .min(-20)
    .max(30)
    .describe("Predicted accuracy improvement in percentage points"),
  predictedConversionImprovement: z
    .number()
    .min(-20)
    .max(30)
    .describe("Predicted conversion improvement in percentage points"),
  appliedSuggestionIds: z
    .array(z.string())
    .describe("IDs of healing suggestions that were incorporated"),
});

export async function optimizePrompt({
  currentPrompt,
  epochMetrics,
  healingSuggestions,
  sampleTranscripts,
  targetMetric,
  conversionGoals,
}: OptimizePromptParams): Promise<OptimizePromptResult> {
  // Format metrics summary
  const metricsSummary = epochMetrics
    .map(
      (m) =>
        `${m.personalityName}: accuracy=${m.accuracy?.toFixed(1) ?? "N/A"}%, conversion=${m.conversionRate?.toFixed(1) ?? "N/A"}%, sessions=${m.sessionsCount}`
    )
    .join("\n");

  // Format issues
  const issuesSummary = epochMetrics
    .flatMap((m) =>
      m.issues.map((i) => `[${m.personalityName}] ${i.issue} (${i.count}x, ${i.severity})`)
    )
    .join("\n");

  // Format healing suggestions
  const suggestionsSummary = healingSuggestions
    .map(
      (s) =>
        `[${s.id}] Issue: ${s.issue}\nSuggestion: ${s.suggestion}\nSeverity: ${s.severity}, Confidence: ${s.confidence?.toFixed(2) ?? "N/A"}`
    )
    .join("\n\n");

  // Format sample transcripts
  const transcriptSummary = sampleTranscripts
    .slice(0, 3)
    .map((t) => {
      const conv = t.transcript
        .slice(-6)
        .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
        .join("\n");
      return `--- ${t.personalityName} (accuracy: ${t.accuracy?.toFixed(1) ?? "N/A"}%, conversion: ${t.conversionScore?.toFixed(1) ?? "N/A"}%) ---\n${conv}`;
    })
    .join("\n\n");

  const systemPrompt = `You are an expert at optimizing AI agent prompts for customer service.

Your goal is to improve the prompt to maximize ${targetMetric === "conversion" ? "conversion rate" : targetMetric === "accuracy" ? "accuracy" : targetMetric === "csat" ? "customer satisfaction" : "response speed"}.

${conversionGoals.length > 0 ? `Conversion goals to optimize for:\n${conversionGoals.map((g) => `- ${g}`).join("\n")}` : ""}

Current prompt:
---
${currentPrompt}
---

Performance metrics by personality:
${metricsSummary}

Issues identified:
${issuesSummary || "No specific issues identified"}

Healing suggestions from previous analysis:
${suggestionsSummary || "No suggestions available"}

Sample conversations:
${transcriptSummary || "No samples available"}

Improve the prompt to address the identified issues while maintaining the core functionality.
Focus on changes that will have the highest impact on ${targetMetric}.
Be specific about what you changed and why.`;

  try {
    const result = await generateObject({
      model: process.env.ANALYSIS_MODEL || DEFAULT_MODEL,
      schema: OptimizedPromptSchema,
      system: systemPrompt,
      prompt: `Analyze the current prompt performance and generate an improved version. Include the IDs of any healing suggestions you incorporated.`,
    });

    return {
      improvedPrompt: result.object.improvedPrompt,
      changes: result.object.changes,
      reasoning: result.object.reasoning,
      predictedImpact: {
        accuracy: result.object.predictedAccuracyImprovement,
        conversion: result.object.predictedConversionImprovement,
      },
      appliedSuggestionIds: result.object.appliedSuggestionIds,
    };
  } catch (error) {
    console.error("Failed to optimize prompt:", error);

    // Return a simple fallback that applies the highest-confidence suggestion
    const topSuggestion = healingSuggestions
      .filter((s) => s.suggestedPrompt)
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];

    if (topSuggestion?.suggestedPrompt) {
      return {
        improvedPrompt: topSuggestion.suggestedPrompt,
        changes: [`Applied suggestion: ${topSuggestion.suggestion}`],
        reasoning: `Fallback: Applied highest-confidence healing suggestion (${topSuggestion.confidence?.toFixed(2) ?? "N/A"})`,
        predictedImpact: { accuracy: 5, conversion: 5 },
        appliedSuggestionIds: [topSuggestion.id],
      };
    }

    // If no suggestions, return original prompt with minor enhancement
    return {
      improvedPrompt: currentPrompt,
      changes: [],
      reasoning: "No changes could be applied automatically",
      predictedImpact: { accuracy: 0, conversion: 0 },
      appliedSuggestionIds: [],
    };
  }
}
