import {
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { prompt } from "./prompt";

// Store external agent imports (Dapta, etc.)
export const externalAgent = pgTable("external_agent", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompt.id),

  // Source platform
  source: text("source").notNull(), // "dapta", "retell", etc.

  // Agent info
  agentName: text("agent_name").notNull(),

  // External IDs
  externalAgentId: text("external_agent_id").notNull(),
  retellAgentId: text("retell_agent_id"),
  llmId: text("llm_id"),
  voiceId: text("voice_id"),

  // Organization
  organizationId: text("organization_id"),
  workspaceId: text("workspace_id"),

  // Configuration snapshot
  llmModel: text("llm_model"),
  inputVariables: jsonb("input_variables").$type<Record<string, string>>(),

  // Raw payload for full reference
  rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),

  // Metadata
  sourceUrl: text("source_url"),
  extensionVersion: text("extension_version"),

  importedAt: timestamp("imported_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ExternalAgentSelect = typeof externalAgent.$inferSelect;
export type ExternalAgentInsert = typeof externalAgent.$inferInsert;
