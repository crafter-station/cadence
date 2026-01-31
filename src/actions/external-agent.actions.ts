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
  updateDaptaAgentPrompt,
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
    // Fetch agent data from Dapta API (requires API key for auth)
    const daptaAgent = await fetchDaptaAgent(input.daptaAgentId, input.apiKey);

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

// Fetch live agent data from Dapta (without saving to DB)
export interface LiveAgentData {
  name: string;
  instructions: string;
  model: string | null;
  voiceId: string | null;
  voiceModel: string | null;
  voiceSpeed: number | null;
  voiceLanguage: string | null;
  inputVariables: Array<{ key: string; value: string }>;
  retellAgentId: string | null;
  llmId: string | null;
}

export async function fetchLiveAgentDataAction(
  agentId: string,
  userId: string
): Promise<{ success: boolean; data?: LiveAgentData; error?: string }> {
  try {
    // Get agent from DB to retrieve API key
    const agent = await db.query.externalAgent.findFirst({
      where: and(
        eq(schema.externalAgent.id, agentId),
        eq(schema.externalAgent.userId, userId)
      ),
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    // Fetch fresh data from Dapta
    const daptaAgent = await fetchDaptaAgent(agent.daptaAgentId, agent.apiKey);

    if (!daptaAgent) {
      return { success: false, error: "Failed to fetch agent from Dapta" };
    }

    return {
      success: true,
      data: {
        name: daptaAgent.name,
        instructions: daptaAgent.instructions,
        model: daptaAgent.model ?? daptaAgent.llm_model ?? null,
        voiceId: daptaAgent.voice_id ?? daptaAgent.voice ?? null,
        voiceModel: daptaAgent.voice_model ?? null,
        voiceSpeed: daptaAgent.voice_speed ?? null,
        voiceLanguage: daptaAgent.voice_language ?? null,
        inputVariables: deduplicateVariables(daptaAgent.variables),
        retellAgentId: daptaAgent.retell_agent_id ?? daptaAgent.voice_retell_agent_id ?? null,
        llmId: daptaAgent.llm_id ?? daptaAgent.voice_llm_id ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch live agent data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get external agent with its associated prompt content
export interface ExternalAgentWithPrompt {
  id: string;
  agentName: string;
  daptaAgentId: string;
  retellAgentId: string | null;
  llmId: string | null;
  llmModel: string | null;
  voiceId: string | null;
  systemPrompt: string | null;
  inputVariables: Array<{ key: string; value: string }> | null;
  lastSyncedAt: Date | null;
  promptId: string;
  promptName: string;
  promptContent: string;
  promptVersion: number;
}

export async function getExternalAgentWithPromptAction(
  agentId: string,
  userId: string
): Promise<ExternalAgentWithPrompt | null> {
  const agent = await db.query.externalAgent.findFirst({
    where: and(
      eq(schema.externalAgent.id, agentId),
      eq(schema.externalAgent.userId, userId)
    ),
  });

  if (!agent) {
    return null;
  }

  const prompt = await db.query.prompt.findFirst({
    where: eq(schema.prompt.id, agent.promptId),
  });

  if (!prompt) {
    return null;
  }

  return {
    id: agent.id,
    agentName: agent.agentName,
    daptaAgentId: agent.daptaAgentId,
    retellAgentId: agent.retellAgentId,
    llmId: agent.llmId,
    llmModel: agent.llmModel,
    voiceId: agent.voiceId,
    systemPrompt: agent.systemPrompt,
    inputVariables: agent.inputVariables,
    lastSyncedAt: agent.lastSyncedAt,
    promptId: prompt.id,
    promptName: prompt.name,
    promptContent: prompt.content,
    promptVersion: prompt.version,
  };
}

export async function updateExternalAgentPromptAction(
  agentId: string,
  userId: string,
  newPrompt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get agent from DB to retrieve API key and Dapta IDs
    const agent = await db.query.externalAgent.findFirst({
      where: and(
        eq(schema.externalAgent.id, agentId),
        eq(schema.externalAgent.userId, userId)
      ),
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    // Update prompt in Dapta using stored API key
    const result = await updateDaptaAgentPrompt(
      agent.daptaAgentId,
      newPrompt,
      agent.apiKey
    );

    if (!result.success) {
      return { success: false, error: result.message };
    }

    // Update local copy of the prompt
    await db
      .update(schema.externalAgent)
      .set({
        systemPrompt: newPrompt,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.externalAgent.id, agentId));

    // Also update the linked prompt record
    await db
      .update(schema.prompt)
      .set({
        content: newPrompt,
      })
      .where(eq(schema.prompt.id, agent.promptId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update external agent prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
