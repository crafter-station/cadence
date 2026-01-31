import { relations } from "drizzle-orm";

import { prompt } from "./prompt";
import { personality } from "./personality";
import { personalityVersion } from "./personality-version";
import { testRun } from "./test-run";
import { testSession } from "./test-session";
import { scenario, scenarioStep } from "./scenario";
import { experiment, experimentVariant } from "./experiment";
import { healingSuggestion } from "./healing-suggestion";
import { externalAgent } from "./external-agent";
import { evaluation } from "./evaluation";
import { evaluationEpoch } from "./evaluation-epoch";
import { evaluationMetrics } from "./evaluation-metrics";
import { simulationSnapshot } from "./simulation-snapshot";

export const promptRelations = relations(prompt, ({ one, many }) => ({
  parent: one(prompt, {
    fields: [prompt.parentId],
    references: [prompt.id],
    relationName: "promptVersions",
  }),
  children: many(prompt, { relationName: "promptVersions" }),
  testRuns: many(testRun),
  variants: many(experimentVariant),
  healingSuggestions: many(healingSuggestion),
  externalAgent: one(externalAgent, {
    fields: [prompt.id],
    references: [externalAgent.promptId],
  }),
  evaluationsAsSource: many(evaluation, { relationName: "evaluationSource" }),
  evaluationsAsBest: many(evaluation, { relationName: "evaluationBest" }),
  evaluationEpochs: many(evaluationEpoch),
}));

export const personalityRelations = relations(personality, ({ many }) => ({
  testSessions: many(testSession),
  scenarioSteps: many(scenarioStep),
  healingSuggestions: many(healingSuggestion),
  versions: many(personalityVersion),
  evaluationMetrics: many(evaluationMetrics),
}));

export const personalityVersionRelations = relations(
  personalityVersion,
  ({ one }) => ({
    personality: one(personality, {
      fields: [personalityVersion.personalityId],
      references: [personality.id],
    }),
  })
);

export const testRunRelations = relations(testRun, ({ one, many }) => ({
  prompt: one(prompt, {
    fields: [testRun.promptId],
    references: [prompt.id],
  }),
  experiment: one(experiment, {
    fields: [testRun.experimentId],
    references: [experiment.id],
  }),
  variant: one(experimentVariant, {
    fields: [testRun.variantId],
    references: [experimentVariant.id],
  }),
  sessions: many(testSession),
  healingSuggestions: many(healingSuggestion),
  evaluationEpochs: many(evaluationEpoch),
}));

export const testSessionRelations = relations(testSession, ({ one, many }) => ({
  testRun: one(testRun, {
    fields: [testSession.testRunId],
    references: [testRun.id],
  }),
  personality: one(personality, {
    fields: [testSession.personalityId],
    references: [personality.id],
  }),
  simulationSnapshots: many(simulationSnapshot),
}));

export const scenarioRelations = relations(scenario, ({ many }) => ({
  steps: many(scenarioStep),
}));

export const scenarioStepRelations = relations(scenarioStep, ({ one }) => ({
  scenario: one(scenario, {
    fields: [scenarioStep.scenarioId],
    references: [scenario.id],
  }),
  personality: one(personality, {
    fields: [scenarioStep.personalityId],
    references: [personality.id],
  }),
}));

export const experimentRelations = relations(experiment, ({ one, many }) => ({
  variants: many(experimentVariant),
  winner: one(experimentVariant, {
    fields: [experiment.winnerId],
    references: [experimentVariant.id],
  }),
  testRuns: many(testRun),
}));

export const experimentVariantRelations = relations(
  experimentVariant,
  ({ one, many }) => ({
    experiment: one(experiment, {
      fields: [experimentVariant.experimentId],
      references: [experiment.id],
    }),
    prompt: one(prompt, {
      fields: [experimentVariant.promptId],
      references: [prompt.id],
    }),
    testRuns: many(testRun),
  })
);

export const healingSuggestionRelations = relations(
  healingSuggestion,
  ({ one }) => ({
    testRun: one(testRun, {
      fields: [healingSuggestion.testRunId],
      references: [testRun.id],
    }),
    prompt: one(prompt, {
      fields: [healingSuggestion.promptId],
      references: [prompt.id],
    }),
    personality: one(personality, {
      fields: [healingSuggestion.personalityId],
      references: [personality.id],
    }),
    resultingPrompt: one(prompt, {
      fields: [healingSuggestion.resultingPromptId],
      references: [prompt.id],
    }),
  })
);

export const externalAgentRelations = relations(externalAgent, ({ one }) => ({
  prompt: one(prompt, {
    fields: [externalAgent.promptId],
    references: [prompt.id],
  }),
}));

// Evaluation relations
export const evaluationRelations = relations(evaluation, ({ one, many }) => ({
  sourcePrompt: one(prompt, {
    fields: [evaluation.sourcePromptId],
    references: [prompt.id],
    relationName: "evaluationSource",
  }),
  bestPrompt: one(prompt, {
    fields: [evaluation.bestPromptId],
    references: [prompt.id],
    relationName: "evaluationBest",
  }),
  epochs: many(evaluationEpoch),
}));

export const evaluationEpochRelations = relations(
  evaluationEpoch,
  ({ one, many }) => ({
    evaluation: one(evaluation, {
      fields: [evaluationEpoch.evaluationId],
      references: [evaluation.id],
    }),
    prompt: one(prompt, {
      fields: [evaluationEpoch.promptId],
      references: [prompt.id],
    }),
    previousEpoch: one(evaluationEpoch, {
      fields: [evaluationEpoch.previousEpochId],
      references: [evaluationEpoch.id],
      relationName: "epochChain",
    }),
    testRun: one(testRun, {
      fields: [evaluationEpoch.testRunId],
      references: [testRun.id],
    }),
    metrics: many(evaluationMetrics),
    snapshots: many(simulationSnapshot),
  })
);

export const evaluationMetricsRelations = relations(
  evaluationMetrics,
  ({ one }) => ({
    epoch: one(evaluationEpoch, {
      fields: [evaluationMetrics.epochId],
      references: [evaluationEpoch.id],
    }),
    personality: one(personality, {
      fields: [evaluationMetrics.personalityId],
      references: [personality.id],
    }),
  })
);

export const simulationSnapshotRelations = relations(
  simulationSnapshot,
  ({ one }) => ({
    epoch: one(evaluationEpoch, {
      fields: [simulationSnapshot.epochId],
      references: [evaluationEpoch.id],
    }),
    testSession: one(testSession, {
      fields: [simulationSnapshot.testSessionId],
      references: [testSession.id],
    }),
  })
);
