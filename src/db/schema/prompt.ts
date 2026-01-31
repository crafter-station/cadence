import {
  boolean,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const prompt = pgTable("prompt", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  parentId: text("parent_id").references((): any => prompt.id),

  // Aggregated metrics from test runs
  avgAccuracy: real("avg_accuracy"),
  avgLatency: real("avg_latency"),
  totalRuns: integer("total_runs").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PromptSelect = typeof prompt.$inferSelect;
export type PromptInsert = typeof prompt.$inferInsert;
