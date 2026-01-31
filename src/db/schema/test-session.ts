import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { TestStatusEnum } from "./enums";
import { testRun } from "./test-run";
import { personality } from "./personality";

export const testSession = pgTable("test_session", {
  id: text("id").primaryKey(),
  testRunId: text("test_run_id")
    .notNull()
    .references(() => testRun.id),
  personalityId: text("personality_id")
    .notNull()
    .references(() => personality.id),
  instanceNumber: integer("instance_number").notNull(),

  status: TestStatusEnum("status").notNull().default("pending"),
  progress: real("progress").notNull().default(0),

  // Session metrics
  turns: integer("turns").notNull().default(0),
  accuracy: real("accuracy"),
  avgLatency: real("avg_latency"),
  errors: integer("errors").notNull().default(0),
  tokensIn: integer("tokens_in").notNull().default(0),
  tokensOut: integer("tokens_out").notNull().default(0),

  // Voice call fields
  daptaCallId: text("dapta_call_id"),
  audioUrl: text("audio_url"),
  audioDurationSeconds: real("audio_duration_seconds"),
  durationSeconds: real("duration_seconds"),

  // Full conversation transcript
  transcript: jsonb("transcript")
    .$type<
      {
        role: "user" | "agent";
        content: string;
        timestamp: number;
        latency?: number;
        tokensIn?: number;
        tokensOut?: number;
      }[]
    >()
    .notNull()
    .default([]),

  // Trigger.dev integration
  triggerRunId: text("trigger_run_id"),

  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TestSessionSelect = typeof testSession.$inferSelect;
export type TestSessionInsert = typeof testSession.$inferInsert;
