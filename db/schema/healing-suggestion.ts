import {
  boolean,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { testRun } from "./test-run";
import { prompt } from "./prompt";
import { personality } from "./personality";

export const healingSuggestion = pgTable("healing_suggestion", {
  id: text("id").primaryKey(),
  testRunId: text("test_run_id")
    .notNull()
    .references(() => testRun.id),
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompt.id),
  personalityId: text("personality_id").references(() => personality.id),

  // Suggestion content
  issue: text("issue").notNull(),
  suggestion: text("suggestion").notNull(),
  suggestedPrompt: text("suggested_prompt"),
  confidence: real("confidence"),
  severity: text("severity").$type<"low" | "medium" | "high" | "critical">(),

  // Evidence from test sessions
  evidence: jsonb("evidence").$type<{
    sessionIds: string[];
    examples: string[];
  }>(),

  // Application tracking
  isApplied: boolean("is_applied").notNull().default(false),
  appliedAt: timestamp("applied_at"),
  resultingPromptId: text("resulting_prompt_id").references(() => prompt.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type HealingSuggestionSelect = typeof healingSuggestion.$inferSelect;
export type HealingSuggestionInsert = typeof healingSuggestion.$inferInsert;
