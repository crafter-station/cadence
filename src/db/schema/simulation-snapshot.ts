import {
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { evaluationEpoch } from "./evaluation-epoch";
import { testSession } from "./test-session";

export const simulationSnapshot = pgTable("simulation_snapshot", {
  id: text("id").primaryKey(),
  epochId: text("epoch_id")
    .notNull()
    .references(() => evaluationEpoch.id),
  testSessionId: text("test_session_id")
    .notNull()
    .references(() => testSession.id),

  // Snapshot data for replay
  snapshotData: jsonb("snapshot_data").$type<{
    promptVersion: string;
    personality: {
      id: string;
      name: string;
      description: string;
      traits: string[];
    };
    transcript: Array<{
      role: "user" | "agent";
      content: string;
      timestamp: string;
      latency?: number;
      tokensIn?: number;
      tokensOut?: number;
    }>;
    metrics: {
      accuracy: number | null;
      conversionScore: number | null;
      latency: number | null;
    };
    conversionResult: {
      achieved: boolean;
      goals: string[];
      missedOpportunities: string[];
    };
    environment: {
      model: string;
      temperature?: number;
      epochNumber: number;
    };
  }>(),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SimulationSnapshotSelect = typeof simulationSnapshot.$inferSelect;
export type SimulationSnapshotInsert = typeof simulationSnapshot.$inferInsert;
