import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { evaluationEpoch } from "./evaluation-epoch";
import { personality } from "./personality";

export const evaluationMetrics = pgTable("evaluation_metrics", {
  id: text("id").primaryKey(),
  epochId: text("epoch_id")
    .notNull()
    .references(() => evaluationEpoch.id),
  personalityId: text("personality_id")
    .notNull()
    .references(() => personality.id),

  // Performance metrics
  accuracy: real("accuracy"),
  conversionRate: real("conversion_rate"),
  avgLatency: real("avg_latency"),
  sessionsCount: integer("sessions_count").notNull().default(0),

  // Conversion tracking
  conversions: integer("conversions").notNull().default(0),
  conversionOpportunities: integer("conversion_opportunities").notNull().default(0),

  // Issues found
  issues: jsonb("issues").$type<
    Array<{
      issue: string;
      count: number;
      severity: "low" | "medium" | "high" | "critical";
    }>
  >(),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EvaluationMetricsSelect = typeof evaluationMetrics.$inferSelect;
export type EvaluationMetricsInsert = typeof evaluationMetrics.$inferInsert;
