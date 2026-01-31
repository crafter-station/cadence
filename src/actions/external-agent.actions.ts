"use server";

import { eq, and } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";
import {
  fetchDaptaAgent,
  fetchDaptaLLM,
  fetchRetellAgent,
  deduplicateVariables,
} from "@/lib/dapta-api";

export interface CreateExternalAgentInput {
  userId: string;
  agentName: string;
  daptaAgentId: string;
  retellAgentId?: string;
  llmId?: string;
  apiKey: string;
  source?: string;
}

export interface SyncedAgentData {
  agentId: string;
  promptId: string;
  agentName: string;
  systemPrompt: string | null;
  llmModel: string | null;
  voiceId: string | null;
  inputVariables: Array<{ key: string; value: string }>;
  workspaceId: string | null;
  organizationId: string | null;
}

export async function createOrUpdateExternalAgentAction(
  input: CreateExternalAgentInput
): Promise<{
  success: boolean;
  agentId?: string;
  promptId?: string;
  data?: SyncedAgentData;
  error?: string;
}> {
  try {
    // Fetch agent data from Dapta API
    const daptaAgent = await fetchDaptaAgent(input.daptaAgentId);

    let systemPrompt = daptaAgent?.instructions ?? null;
    let llmModel = daptaAgent?.llm_model ?? null;
    let voiceId = daptaAgent?.voice_id ?? null;
    let inputVariables = deduplicateVariables(daptaAgent?.variables);
    const workspaceId = daptaAgent?.workspace_id ?? null;
    const organizationId = daptaAgent?.organization_id ?? null;

    // Fetch additional LLM info if we have llmId
    const llmId = input.llmId ?? daptaAgent?.llm_id;
    if (llmId && !llmModel) {
      const llmData = await fetchDaptaLLM(llmId);
      if (llmData) {
        llmModel = llmData.model;
        if (!systemPrompt && llmData.general_prompt) {
          systemPrompt = llmData.general_prompt;
        }
      }
    }

    // Fetch Retell agent info if we have retellAgentId
    const retellAgentId = input.retellAgentId ?? daptaAgent?.retell_agent_id;
    if (retellAgentId && !voiceId) {
      const retellData = await fetchRetellAgent(retellAgentId);
      if (retellData) {
        voiceId = retellData.voice_id;
      }
    }

    // Use fetched name or fallback to input
    const agentName = daptaAgent?.name ?? input.agentName;

    // Check if agent already exists for this user
    const existing = await db.query.externalAgent.findFirst({
      where: and(
        eq(schema.externalAgent.daptaAgentId, input.daptaAgentId),
        eq(schema.externalAgent.userId, input.userId)
      ),
    });

    if (existing) {
      // Update existing agent and its prompt
      await db
        .update(schema.externalAgent)
        .set({
          agentName,
          retellAgentId: retellAgentId ?? null,
          llmId: llmId ?? null,
          voiceId,
          apiKey: input.apiKey,
          llmModel,
          systemPrompt,
          inputVariables,
          workspaceId,
          organizationId,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.externalAgent.id, existing.id));

      // Update the linked prompt with system prompt
      if (systemPrompt) {
        await db
          .update(schema.prompt)
          .set({
            name: agentName,
            content: systemPrompt,
          })
          .where(eq(schema.prompt.id, existing.promptId));
      }

      return {
        success: true,
        agentId: existing.id,
        promptId: existing.promptId,
        data: {
          agentId: existing.id,
          promptId: existing.promptId,
          agentName,
          systemPrompt,
          llmModel,
          voiceId,
          inputVariables,
          workspaceId,
          organizationId,
        },
      };
    }

    // Create new prompt for this external agent
    const promptId = nanoid();
    await db.insert(schema.prompt).values({
      id: promptId,
      userId: input.userId,
      name: agentName,
      content: systemPrompt ?? `External agent: ${agentName}`,
      version: 1,
      isActive: true,
    });

    // Create external agent record
    const agentId = nanoid();
    await db.insert(schema.externalAgent).values({
      id: agentId,
      promptId,
      userId: input.userId,
      source: input.source ?? "dapta",
      agentName,
      daptaAgentId: input.daptaAgentId,
      retellAgentId: retellAgentId ?? null,
      llmId: llmId ?? null,
      voiceId,
      apiKey: input.apiKey,
      llmModel,
      systemPrompt,
      inputVariables,
      workspaceId,
      organizationId,
      lastSyncedAt: new Date(),
    });

    return {
      success: true,
      agentId,
      promptId,
      data: {
        agentId,
        promptId,
        agentName,
        systemPrompt,
        llmModel,
        voiceId,
        inputVariables,
        workspaceId,
        organizationId,
      },
    };
  } catch (error) {
    console.error("Failed to create/update external agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function syncExternalAgentAction(
  agentId: string,
  userId: string
): Promise<{ success: boolean; data?: SyncedAgentData; error?: string }> {
  try {
    const agent = await db.query.externalAgent.findFirst({
      where: and(
        eq(schema.externalAgent.id, agentId),
        eq(schema.externalAgent.userId, userId)
      ),
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    // Re-fetch from Dapta
    const result = await createOrUpdateExternalAgentAction({
      userId,
      agentName: agent.agentName,
      daptaAgentId: agent.daptaAgentId,
      retellAgentId: agent.retellAgentId ?? undefined,
      llmId: agent.llmId ?? undefined,
      apiKey: agent.apiKey,
      source: agent.source,
    });

    return result;
  } catch (error) {
    console.error("Failed to sync external agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getExternalAgentAction(
  daptaAgentId: string,
  userId: string
): Promise<schema.ExternalAgentSelect | null> {
  const result = await db.query.externalAgent.findFirst({
    where: and(
      eq(schema.externalAgent.daptaAgentId, daptaAgentId),
      eq(schema.externalAgent.userId, userId)
    ),
  });
  return result ?? null;
}

export async function getExternalAgentByIdAction(
  agentId: string,
  userId: string
): Promise<schema.ExternalAgentSelect | null> {
  const result = await db.query.externalAgent.findFirst({
    where: and(
      eq(schema.externalAgent.id, agentId),
      eq(schema.externalAgent.userId, userId)
    ),
  });
  return result ?? null;
}

export async function getExternalAgentsForUserAction(
  userId: string
): Promise<schema.ExternalAgentSelect[]> {
  return db.query.externalAgent.findMany({
    where: eq(schema.externalAgent.userId, userId),
    orderBy: (agent, { desc }) => [desc(agent.updatedAt)],
  });
}
