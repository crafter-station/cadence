"use server";

import { eq, and } from "drizzle-orm";
import { tasks } from "@trigger.dev/sdk/v3";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import type { RunScenarioTask } from "@/trigger/run-scenario.task";

export interface CreateScenarioInput {
  userId: string;
  name: string;
  description?: string;
  tags?: string[];
  steps: {
    userMessage: string;
    expectedBehavior?: string;
    assertions?: {
      type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
      value: string;
      description?: string;
    }[];
    personalityId?: string;
  }[];
}

export interface CreateScenarioResult {
  success: boolean;
  scenarioId?: string;
  error?: string;
}

export async function createScenarioAction(
  input: CreateScenarioInput
): Promise<CreateScenarioResult> {
  try {
    const scenarioId = nanoid();

    // Create scenario
    await db.insert(schema.scenario).values({
      id: scenarioId,
      userId: input.userId,
      name: input.name,
      description: input.description ?? null,
      tags: input.tags ?? [],
    });

    // Create steps
    if (input.steps.length > 0) {
      const stepInserts: schema.ScenarioStepInsert[] = input.steps.map(
        (step, index) => ({
          id: nanoid(),
          scenarioId,
          orderIndex: index,
          userMessage: step.userMessage,
          expectedBehavior: step.expectedBehavior ?? null,
          assertions: step.assertions ?? null,
          personalityId: step.personalityId ?? null,
        })
      );

      await db.insert(schema.scenarioStep).values(stepInserts);
    }

    return {
      success: true,
      scenarioId,
    };
  } catch (error) {
    console.error("Failed to create scenario:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateScenarioAction(
  scenarioId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    tags?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const scenario = await db.query.scenario.findFirst({
      where: and(
        eq(schema.scenario.id, scenarioId),
        eq(schema.scenario.userId, userId)
      ),
    });

    if (!scenario) {
      return { success: false, error: "Scenario not found" };
    }

    await db
      .update(schema.scenario)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.scenario.id, scenarioId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update scenario:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function addScenarioStepAction(
  scenarioId: string,
  userId: string,
  step: {
    userMessage: string;
    expectedBehavior?: string;
    assertions?: {
      type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
      value: string;
      description?: string;
    }[];
    personalityId?: string;
  }
): Promise<{ success: boolean; stepId?: string; error?: string }> {
  try {
    const scenario = await db.query.scenario.findFirst({
      where: and(
        eq(schema.scenario.id, scenarioId),
        eq(schema.scenario.userId, userId)
      ),
      with: {
        steps: true,
      },
    });

    if (!scenario) {
      return { success: false, error: "Scenario not found" };
    }

    const stepId = nanoid();
    const orderIndex = scenario.steps.length;

    await db.insert(schema.scenarioStep).values({
      id: stepId,
      scenarioId,
      orderIndex,
      userMessage: step.userMessage,
      expectedBehavior: step.expectedBehavior ?? null,
      assertions: step.assertions ?? null,
      personalityId: step.personalityId ?? null,
    });

    return { success: true, stepId };
  } catch (error) {
    console.error("Failed to add scenario step:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateScenarioStepAction(
  stepId: string,
  userId: string,
  updates: {
    userMessage?: string;
    expectedBehavior?: string;
    assertions?: {
      type: "contains" | "not_contains" | "regex" | "sentiment" | "custom";
      value: string;
      description?: string;
    }[];
    personalityId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const step = await db.query.scenarioStep.findFirst({
      where: eq(schema.scenarioStep.id, stepId),
      with: {
        scenario: true,
      },
    });

    if (!step) {
      return { success: false, error: "Step not found" };
    }

    const stepWithScenario = step as typeof step & { scenario: { userId: string } };
    if (stepWithScenario.scenario.userId !== userId) {
      return { success: false, error: "Step not found" };
    }

    await db
      .update(schema.scenarioStep)
      .set(updates)
      .where(eq(schema.scenarioStep.id, stepId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update scenario step:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteScenarioStepAction(
  stepId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const step = await db.query.scenarioStep.findFirst({
      where: eq(schema.scenarioStep.id, stepId),
      with: {
        scenario: true,
      },
    });

    if (!step) {
      return { success: false, error: "Step not found" };
    }

    const stepWithScenario = step as typeof step & { scenario: { userId: string } };
    if (stepWithScenario.scenario.userId !== userId) {
      return { success: false, error: "Step not found" };
    }

    await db
      .delete(schema.scenarioStep)
      .where(eq(schema.scenarioStep.id, stepId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete scenario step:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getScenariosAction(
  userId: string
): Promise<schema.ScenarioSelect[]> {
  return db.query.scenario.findMany({
    where: and(
      eq(schema.scenario.userId, userId),
      eq(schema.scenario.isActive, true)
    ),
    orderBy: (scenario, { desc }) => [desc(scenario.createdAt)],
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.orderIndex)],
      },
    },
  });
}

export async function getScenarioAction(
  scenarioId: string
): Promise<schema.ScenarioSelect | null> {
  const result = await db.query.scenario.findFirst({
    where: eq(schema.scenario.id, scenarioId),
    with: {
      steps: {
        orderBy: (steps, { asc }) => [asc(steps.orderIndex)],
      },
    },
  });
  return result ?? null;
}

export async function deleteScenarioAction(
  scenarioId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const scenario = await db.query.scenario.findFirst({
      where: and(
        eq(schema.scenario.id, scenarioId),
        eq(schema.scenario.userId, userId)
      ),
    });

    if (!scenario) {
      return { success: false, error: "Scenario not found" };
    }

    // Soft delete
    await db
      .update(schema.scenario)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.scenario.id, scenarioId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete scenario:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runScenarioAction(
  scenarioId: string,
  promptId: string,
  userId: string
): Promise<{ success: boolean; runId?: string; error?: string }> {
  try {
    const scenario = await db.query.scenario.findFirst({
      where: eq(schema.scenario.id, scenarioId),
    });

    if (!scenario) {
      return { success: false, error: "Scenario not found" };
    }

    const prompt = await db.query.prompt.findFirst({
      where: eq(schema.prompt.id, promptId),
    });

    if (!prompt) {
      return { success: false, error: "Prompt not found" };
    }

    // Trigger scenario run
    const handle = await tasks.trigger<typeof RunScenarioTask>("run-scenario", {
      scenarioId,
      promptId,
      userId,
    }, {
      tags: [`scenario:${scenarioId}`, `prompt:${promptId}`, `user:${userId}`],
    });

    return {
      success: true,
      runId: handle.id,
    };
  } catch (error) {
    console.error("Failed to run scenario:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
