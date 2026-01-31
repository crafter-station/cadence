import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { personality } from "./personality";

export const scenario = pgTable("scenario", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ScenarioSelect = typeof scenario.$inferSelect;
export type ScenarioInsert = typeof scenario.$inferInsert;

export const scenarioStep = pgTable("scenario_step", {
  id: text("id").primaryKey(),
  scenarioId: text("scenario_id")
    .notNull()
    .references(() => scenario.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull(),

  // Step content
  userMessage: text("user_message").notNull(),
  expectedBehavior: text("expected_behavior"),
  assertions: jsonb("assertions").$type<
    {
      type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
      value: string;
      description?: string;
    }[]
  >(),

  // Optional personality override for this step
  personalityId: text("personality_id").references(() => personality.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ScenarioStepSelect = typeof scenarioStep.$inferSelect;
export type ScenarioStepInsert = typeof scenarioStep.$inferInsert;
