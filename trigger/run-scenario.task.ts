import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { generateAgentResponse } from "@/lib/ai/generate-agent-response";

/**
 * Run Scenario Task - Executes a scripted scenario test
 *
 * This task runs through predefined conversation steps:
 * 1. Loads scenario with all steps
 * 2. Executes each step sequentially
 * 3. Validates assertions at each step
 * 4. Reports results with pass/fail status
 */
export const RunScenarioTask = schemaTask({
  id: "run-scenario",
  schema: z.object({
    scenarioId: z.string(),
    promptId: z.string(),
    userId: z.string(),
  }),
  run: async (payload) => {
    // Fetch scenario with steps
    const scenario = await db.query.scenario.findFirst({
      where: eq(schema.scenario.id, payload.scenarioId),
      with: {
        steps: {
          orderBy: (steps, { asc }) => [asc(steps.orderIndex)],
        },
      },
    });

    if (!scenario) {
      throw new Error(`Scenario ${payload.scenarioId} not found`);
    }

    // Fetch prompt
    const prompt = await db.query.prompt.findFirst({
      where: eq(schema.prompt.id, payload.promptId),
    });

    if (!prompt) {
      throw new Error(`Prompt ${payload.promptId} not found`);
    }

    const scenarioWithSteps = scenario as typeof scenario & {
      steps: schema.ScenarioStepSelect[];
    };

    logger.info(`Starting scenario "${scenario.name}"`, {
      stepCount: scenarioWithSteps.steps.length,
      promptId: payload.promptId,
    });

    metadata.set("progress", {
      status: "running",
      currentStep: 0,
      totalSteps: scenarioWithSteps.steps.length,
    });

    const transcript: {
      role: "user" | "agent";
      content: string;
      timestamp: number;
    }[] = [];
    const results: {
      stepIndex: number;
      userMessage: string;
      agentResponse: string;
      assertions: {
        type: string;
        value: string;
        passed: boolean;
        description?: string;
      }[];
      passed: boolean;
    }[] = [];

    let allPassed = true;

    try {
      for (let i = 0; i < scenarioWithSteps.steps.length; i++) {
        const step = scenarioWithSteps.steps[i];

        metadata.set("progress", {
          status: "running",
          currentStep: i + 1,
          totalSteps: scenarioWithSteps.steps.length,
        });

        // Add user message to transcript
        transcript.push({
          role: "user",
          content: step.userMessage,
          timestamp: Date.now(),
        });

        // Generate agent response
        const agentResult = await generateAgentResponse({
          systemPrompt: prompt.content,
          transcript,
        });

        transcript.push({
          role: "agent",
          content: agentResult.content,
          timestamp: Date.now(),
        });

        // Validate assertions
        const assertionResults: {
          type: string;
          value: string;
          passed: boolean;
          description?: string;
        }[] = [];

        if (step.assertions && Array.isArray(step.assertions)) {
          for (const assertion of step.assertions) {
            const passed = validateAssertion(agentResult.content, assertion);
            assertionResults.push({
              type: assertion.type,
              value: assertion.value,
              passed,
              description: assertion.description,
            });

            if (!passed) {
              allPassed = false;
            }
          }
        }

        const stepPassed = assertionResults.every((a) => a.passed);
        results.push({
          stepIndex: i,
          userMessage: step.userMessage,
          agentResponse: agentResult.content,
          assertions: assertionResults,
          passed: stepPassed,
        });

        logger.info(`Step ${i + 1}/${scenarioWithSteps.steps.length}`, {
          passed: stepPassed,
          assertionCount: assertionResults.length,
        });
      }

      metadata.set("progress", {
        status: allPassed ? "passed" : "failed",
        currentStep: scenarioWithSteps.steps.length,
        totalSteps: scenarioWithSteps.steps.length,
        passedSteps: results.filter((r) => r.passed).length,
      });

      logger.info(`Scenario "${scenario.name}" completed`, {
        passed: allPassed,
        passedSteps: results.filter((r) => r.passed).length,
        totalSteps: scenarioWithSteps.steps.length,
      });

      return {
        scenarioId: payload.scenarioId,
        scenarioName: scenario.name,
        passed: allPassed,
        results,
        transcript,
      };
    } catch (error) {
      logger.error(`Scenario "${scenario.name}" failed with error`, { error });

      metadata.set("progress", {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

function validateAssertion(
  response: string,
  assertion: { type: string; value: string }
): boolean {
  const content = response.toLowerCase();
  const value = assertion.value.toLowerCase();

  switch (assertion.type) {
    case "contains":
      return content.includes(value);
    case "not_contains":
      return !content.includes(value);
    case "regex":
      try {
        const regex = new RegExp(assertion.value, "i");
        return regex.test(response);
      } catch {
        return false;
      }
    case "sentiment":
      // Basic sentiment check - in production use an AI model
      const positivePhrases = [
        "happy to help",
        "glad",
        "certainly",
        "of course",
        "absolutely",
      ];
      const negativePhrases = [
        "sorry",
        "unfortunately",
        "cannot",
        "unable",
        "regret",
      ];

      if (value === "positive") {
        return positivePhrases.some((p) => content.includes(p));
      } else if (value === "negative") {
        return negativePhrases.some((p) => content.includes(p));
      }
      return true;
    default:
      return true;
  }
}

export type RunScenarioTaskType = typeof RunScenarioTask;
