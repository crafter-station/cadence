import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { personality } from "./personality";

export const personalityVersion = pgTable("personality_version", {
  id: text("id").primaryKey(),
  personalityId: text("personality_id")
    .notNull()
    .references(() => personality.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),

  // Snapshot fields
  name: text("name").notNull(),
  description: text("description").notNull(),
  traits: jsonb("traits").$type<string[]>().notNull(),
  systemPrompt: text("system_prompt"),
  color: text("color").notNull(),

  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PersonalityVersionSelect =
  typeof personalityVersion.$inferSelect;
export type PersonalityVersionInsert =
  typeof personalityVersion.$inferInsert;
