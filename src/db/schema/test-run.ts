import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { TestStatusEnum } from "./enums";
import { prompt } from "./prompt";
import { experiment, experimentVariant } from "./experiment";
import { externalAgent } from "./external-agent";

export const testRun = pgTable("test_run", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompt.id),
  externalAgentId: text("external_agent_id").references(() => externalAgent.id),
  experimentId: text("experiment_id").references(() => experiment.id),
  variantId: text("variant_id").references(() => experimentVariant.id),

  status: TestStatusEnum("status").notNull().default("pending"),
  config: jsonb("config").$type<{
    testsPerPersonality: Record<string, number>;
    concurrency: number;
    businessMetrics: {
      resolutionTarget: number;
      avgHandleTimeTarget: number;
      csatTarget: number;
      escalationRateTarget: number;
      costPerCall: number;
    };
  }>(),

  // Aggregated metrics
  totalSessions: integer("total_sessions").notNull().default(0),
  completedSessions: integer("completed_sessions").notNull().default(0),
  failedSessions: integer("failed_sessions").notNull().default(0),
  avgAccuracy: real("avg_accuracy"),
  avgLatency: real("avg_latency"),
  totalTokensIn: integer("total_tokens_in").notNull().default(0),
  totalTokensOut: integer("total_tokens_out").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),

  // Trigger.dev integration
  triggerRunId: text("trigger_run_id"),
  triggerRunStatus: text("trigger_run_status"),

  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TestRunSelect = typeof testRun.$inferSelect;
export type TestRunInsert = typeof testRun.$inferInsert;
