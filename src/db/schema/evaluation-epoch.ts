import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { TestStatusEnum } from "./enums";
import { evaluation } from "./evaluation";
import { prompt } from "./prompt";
import { testRun } from "./test-run";

export const evaluationEpoch = pgTable("evaluation_epoch", {
  id: text("id").primaryKey(),
  evaluationId: text("evaluation_id")
    .notNull()
    .references(() => evaluation.id),
  epochNumber: integer("epoch_number").notNull(),

  // Prompt version tested this epoch
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompt.id),

  // Previous epoch for comparison
  previousEpochId: text("previous_epoch_id"),

  // Link to existing test run system
  testRunId: text("test_run_id").references(() => testRun.id),

  // Status
  status: TestStatusEnum("status").notNull().default("pending"),

  // Aggregated metrics
  accuracy: real("accuracy"),
  conversionRate: real("conversion_rate"),
  avgLatency: real("avg_latency"),

  // Deltas vs previous epoch
  accuracyDelta: real("accuracy_delta"),
  conversionDelta: real("conversion_delta"),

  // Applied improvements
  improvementApplied: jsonb("improvement_applied").$type<{
    suggestionIds: string[];
    changes: string[];
    reasoning: string;
  }>(),

  // Was this prompt accepted as new best?
  isAccepted: boolean("is_accepted").notNull().default(false),

  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EvaluationEpochSelect = typeof evaluationEpoch.$inferSelect;
export type EvaluationEpochInsert = typeof evaluationEpoch.$inferInsert;
