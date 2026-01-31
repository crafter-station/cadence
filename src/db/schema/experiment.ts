import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { ExperimentStatusEnum } from "./enums";
import { prompt } from "./prompt";

export const experiment = pgTable("experiment", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  hypothesis: text("hypothesis"),

  status: ExperimentStatusEnum("status").notNull().default("draft"),

  // Winner tracking (soft reference to avoid circular dependency)
  winnerId: text("winner_id"),
  winnerDeclaredAt: timestamp("winner_declared_at"),

  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ExperimentSelect = typeof experiment.$inferSelect;
export type ExperimentInsert = typeof experiment.$inferInsert;

export const experimentVariant = pgTable("experiment_variant", {
  id: text("id").primaryKey(),
  experimentId: text("experiment_id")
    .notNull()
    .references(() => experiment.id, { onDelete: "cascade" }),
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompt.id),
  name: text("name").notNull(),
  description: text("description"),

  // Traffic allocation (0-100)
  trafficPercent: integer("traffic_percent").notNull().default(50),

  // Aggregated metrics
  totalRuns: integer("total_runs").notNull().default(0),
  avgAccuracy: real("avg_accuracy"),
  avgLatency: real("avg_latency"),
  avgCsat: real("avg_csat"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExperimentVariantSelect = typeof experimentVariant.$inferSelect;
export type ExperimentVariantInsert = typeof experimentVariant.$inferInsert;
