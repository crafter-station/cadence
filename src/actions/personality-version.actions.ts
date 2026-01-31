"use server";

import { eq, desc, and } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

export async function getPersonalityVersionsAction(
  personalityId: string
): Promise<schema.PersonalityVersionSelect[]> {
  return db.query.personalityVersion.findMany({
    where: eq(schema.personalityVersion.personalityId, personalityId),
    orderBy: [desc(schema.personalityVersion.version)],
  });
}

export async function restorePersonalityVersionAction(
  personalityId: string,
  versionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the personality to verify ownership
    const personality = await db.query.personality.findFirst({
      where: and(
        eq(schema.personality.id, personalityId),
        eq(schema.personality.userId, userId)
      ),
    });

    if (!personality) {
      return { success: false, error: "Personality not found" };
    }

    if (personality.isDefault) {
      return { success: false, error: "Cannot modify default personalities" };
    }

    // Get the version to restore
    const versionToRestore = await db.query.personalityVersion.findFirst({
      where: and(
        eq(schema.personalityVersion.id, versionId),
        eq(schema.personalityVersion.personalityId, personalityId)
      ),
    });

    if (!versionToRestore) {
      return { success: false, error: "Version not found" };
    }

    // Save current state to version history before restoring
    const newVersion = personality.version + 1;
    await db.insert(schema.personalityVersion).values({
      id: nanoid(),
      personalityId: personality.id,
      version: personality.version,
      name: personality.name,
      description: personality.description,
      traits: personality.traits,
      systemPrompt: personality.systemPrompt,
      color: personality.color,
      changeReason: `Restored from version ${versionToRestore.version}`,
    });

    // Update the personality with the old version's data
    await db
      .update(schema.personality)
      .set({
        name: versionToRestore.name,
        description: versionToRestore.description,
        traits: versionToRestore.traits,
        systemPrompt: versionToRestore.systemPrompt,
        color: versionToRestore.color,
        version: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(schema.personality.id, personalityId));

    return { success: true };
  } catch (error) {
    console.error("Failed to restore personality version:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
