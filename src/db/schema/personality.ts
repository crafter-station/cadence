import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const personality = pgTable("personality", {
  id: text("id").primaryKey(),
  userId: text("user_id"), // null = default system personality
  name: text("name").notNull(),
  description: text("description").notNull(),
  traits: jsonb("traits").$type<string[]>().notNull(),
  systemPrompt: text("system_prompt"),
  color: text("color").notNull().default("chart-1"),

  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PersonalitySelect = typeof personality.$inferSelect;
export type PersonalityInsert = typeof personality.$inferInsert;
