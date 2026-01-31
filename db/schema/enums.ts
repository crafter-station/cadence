import { pgEnum } from "drizzle-orm/pg-core";

export const TestStatusEnum = pgEnum("test_status_enum", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const ExperimentStatusEnum = pgEnum("experiment_status_enum", [
  "draft",
  "running",
  "paused",
  "completed",
]);

export const MessageRoleEnum = pgEnum("message_role_enum", ["user", "agent"]);
