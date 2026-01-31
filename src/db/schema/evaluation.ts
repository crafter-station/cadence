import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { EvaluationStatusEnum } from "./enums";
import { prompt } from "./prompt";
import { externalAgent } from "./external-agent";

export const evaluation = pgTable("evaluation", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),

  // Source and best prompts
  sourcePromptId: text("source_prompt_id")
    .notNull()
    .references(() => prompt.id),
  bestPromptId: text("best_prompt_id").references(() => prompt.id),

  // External agent for voice calls
  externalAgentId: text("external_agent_id")
    .notNull()
    .references(() => externalAgent.id),

  // Configuration
  config: jsonb("config").$type<{
    maxEpochs: number;
    testsPerEpoch: number;
    personalityIds: string[];
    concurrency: number;
    improvementThreshold: number;
    targetMetric: "conversion" | "accuracy" | "csat" | "latency";
    conversionGoals: string[];
  }>(),

  // Status and progress
  status: EvaluationStatusEnum("status").notNull().default("pending"),
  currentEpochNumber: integer("current_epoch_number").notNull().default(0),
  totalEpochs: integer("total_epochs").notNull().default(0),

  // Aggregated metrics
  bestAccuracy: real("best_accuracy"),
  bestConversionRate: real("best_conversion_rate"),
  totalImprovement: real("total_improvement"),

  // Trigger.dev integration
  triggerRunId: text("trigger_run_id"),

  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type EvaluationSelect = typeof evaluation.$inferSelect;
export type EvaluationInsert = typeof evaluation.$inferInsert;
