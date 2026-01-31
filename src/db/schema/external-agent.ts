import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { prompt } from "./prompt";

// Store external agent connections (linked via URL params from Dapta)
export const externalAgent = pgTable("external_agent", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id")
    .notNull()
    .references(() => prompt.id),
  userId: text("user_id").notNull(),

  // Source platform
  source: text("source").notNull().default("dapta"),

  // Agent identification (from URL params)
  agentName: text("agent_name").notNull(),
  daptaAgentId: text("dapta_agent_id").notNull(),
  retellAgentId: text("retell_agent_id"),
  llmId: text("llm_id"),
  voiceId: text("voice_id"),

  // API credentials
  apiKey: text("api_key").notNull(),

  // Configuration fetched from Dapta API
  llmModel: text("llm_model"), // e.g., "GPT 4.1"
  systemPrompt: text("system_prompt"), // Full instructions
  inputVariables: jsonb("input_variables").$type<
    Array<{ key: string; value: string }>
  >(),

  // Organization context
  workspaceId: text("workspace_id"),
  organizationId: text("organization_id"),

  // Timestamps
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ExternalAgentSelect = typeof externalAgent.$inferSelect;
export type ExternalAgentInsert = typeof externalAgent.$inferInsert;
