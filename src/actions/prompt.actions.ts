"use server";

import { eq, and, desc } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

export interface CreatePromptInput {
  userId: string;
  name: string;
  content: string;
  parentId?: string;
}

export interface CreatePromptResult {
  success: boolean;
  promptId?: string;
  error?: string;
}

export async function createPromptAction(
  input: CreatePromptInput
): Promise<CreatePromptResult> {
  try {
    const promptId = nanoid();

    // Determine version number
    let version = 1;
    if (input.parentId) {
      const parent = await db.query.prompt.findFirst({
        where: eq(schema.prompt.id, input.parentId),
      });
      if (parent) {
        version = parent.version + 1;
      }
    }

    await db.insert(schema.prompt).values({
      id: promptId,
      userId: input.userId,
      name: input.name,
      content: input.content,
      version,
      parentId: input.parentId ?? null,
    });

    return {
      success: true,
      promptId,
    };
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updatePromptAction(
  promptId: string,
  userId: string,
  updates: { name?: string; content?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const prompt = await db.query.prompt.findFirst({
      where: and(
        eq(schema.prompt.id, promptId),
        eq(schema.prompt.userId, userId)
      ),
    });

    if (!prompt) {
      return { success: false, error: "Prompt not found" };
    }

    await db
      .update(schema.prompt)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.prompt.id, promptId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPromptsAction(
  userId: string
): Promise<schema.PromptSelect[]> {
  return db.query.prompt.findMany({
    where: and(
      eq(schema.prompt.userId, userId),
      eq(schema.prompt.isActive, true)
    ),
    orderBy: (prompt, { desc }) => [desc(prompt.createdAt)],
  });
}

export async function getPromptVersionsAction(
  userId: string,
  promptName: string
): Promise<schema.PromptSelect[]> {
  // Get all versions of prompts with this name
  const prompts = await db.query.prompt.findMany({
    where: and(
      eq(schema.prompt.userId, userId),
      eq(schema.prompt.name, promptName),
      eq(schema.prompt.isActive, true)
    ),
    orderBy: desc(schema.prompt.version),
  });

  return prompts;
}

export async function deletePromptAction(
  promptId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const prompt = await db.query.prompt.findFirst({
      where: and(
        eq(schema.prompt.id, promptId),
        eq(schema.prompt.userId, userId)
      ),
    });

    if (!prompt) {
      return { success: false, error: "Prompt not found" };
    }

    // Soft delete
    await db
      .update(schema.prompt)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.prompt.id, promptId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPromptAction(
  promptId: string
): Promise<schema.PromptSelect | null> {
  const result = await db.query.prompt.findFirst({
    where: eq(schema.prompt.id, promptId),
  });
  return result ?? null;
}

export interface CreatePromptVersionInput {
  userId: string;
  parentId: string;
  content: string;
  description?: string;
}

export async function createPromptVersionAction(
  input: CreatePromptVersionInput
): Promise<CreatePromptResult> {
  try {
    // Get parent prompt
    const parent = await db.query.prompt.findFirst({
      where: and(
        eq(schema.prompt.id, input.parentId),
        eq(schema.prompt.userId, input.userId)
      ),
    });

    if (!parent) {
      return { success: false, error: "Parent prompt not found" };
    }

    const promptId = nanoid();
    const newVersion = parent.version + 1;

    await db.insert(schema.prompt).values({
      id: promptId,
      userId: input.userId,
      name: parent.name,
      content: input.content,
      version: newVersion,
      parentId: input.parentId,
      isActive: true,
    });

    return {
      success: true,
      promptId,
    };
  } catch (error) {
    console.error("Failed to create prompt version:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAllPromptsGroupedAction(
  userId: string
): Promise<{ name: string; latestVersion: schema.PromptSelect; versions: schema.PromptSelect[] }[]> {
  const allPrompts = await db.query.prompt.findMany({
    where: and(
      eq(schema.prompt.userId, userId),
      eq(schema.prompt.isActive, true)
    ),
    orderBy: [desc(schema.prompt.name), desc(schema.prompt.version)],
  });

  // Group by name
  const grouped = new Map<string, schema.PromptSelect[]>();
  for (const prompt of allPrompts) {
    const existing = grouped.get(prompt.name) ?? [];
    existing.push(prompt);
    grouped.set(prompt.name, existing);
  }

  return Array.from(grouped.entries()).map(([name, versions]) => ({
    name,
    latestVersion: versions[0],
    versions,
  }));
}
