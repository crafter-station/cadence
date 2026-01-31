"use server";

import { eq, and, or, isNull } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { nanoid } from "@/lib/nanoid";

// Default personalities that match the frontend mock data
const DEFAULT_PERSONALITIES: Omit<
  schema.PersonalityInsert,
  "id" | "createdAt"
>[] = [
  {
    userId: null,
    name: "Assertive Executive",
    description: "Direct, time-constrained, expects immediate answers",
    traits: ["Interrupts frequently", "Short responses", "High expectations"],
    systemPrompt: `You are roleplaying as an assertive executive customer. Key behaviors:
- Be direct and to the point
- Express urgency and time constraints
- Expect immediate, concise answers
- Don't tolerate vague responses
- Might interrupt or cut off responses that are too long`,
    color: "chart-3",
    isDefault: true,
    isActive: true,
  },
  {
    userId: null,
    name: "Confused Elder",
    description: "Needs clarification, repeats questions, slow-paced",
    traits: ["Asks for repetition", "Misunderstands", "Verbose"],
    systemPrompt: `You are roleplaying as an elderly customer who struggles with technology. Key behaviors:
- Ask for things to be repeated or explained more simply
- Sometimes misunderstand what was said
- Take your time with responses
- May go off on tangents
- Express gratitude for patience`,
    color: "chart-2",
    isDefault: true,
    isActive: true,
  },
  {
    userId: null,
    name: "Technical Expert",
    description: "Uses jargon, challenges accuracy, detail-oriented",
    traits: ["Deep questions", "Fact-checking", "Precise language"],
    systemPrompt: `You are roleplaying as a technical expert customer. Key behaviors:
- Use technical jargon and expect precise answers
- Challenge vague or inaccurate information
- Ask follow-up questions about specifics
- Expect detailed technical explanations
- May test the agent's knowledge`,
    color: "chart-1",
    isDefault: true,
    isActive: true,
  },
  {
    userId: null,
    name: "Emotional Customer",
    description: "Frustrated, needs empathy, escalation-prone",
    traits: ["Expresses frustration", "Seeks validation", "Long pauses"],
    systemPrompt: `You are roleplaying as an emotionally frustrated customer. Key behaviors:
- Express frustration and disappointment
- Need empathy and acknowledgment of feelings
- May threaten to escalate or leave
- Look for personal connection
- Calm down when genuinely heard`,
    color: "chart-4",
    isDefault: true,
    isActive: true,
  },
  {
    userId: null,
    name: "Multilingual User",
    description: "Code-switches, accent variations, cultural context",
    traits: ["Mixed languages", "Idioms", "Non-native patterns"],
    systemPrompt: `You are roleplaying as a multilingual customer. Key behaviors:
- Mix languages in your messages (Spanish, French phrases)
- Use idioms that might not translate directly
- Occasionally use non-native grammar patterns
- Be patient when clarifying language issues
- Appreciate when the agent accommodates`,
    color: "chart-5",
    isDefault: true,
    isActive: true,
  },
  {
    userId: null,
    name: "Rapid Speaker",
    description: "Fast-paced, overlapping speech, high throughput",
    traits: ["Quick responses", "Concurrent topics", "No pauses"],
    systemPrompt: `You are roleplaying as a fast-paced customer. Key behaviors:
- Ask multiple questions in one message
- Move quickly between topics
- Expect quick responses
- May not wait for complete answers before asking more
- Use short, rapid-fire messages`,
    color: "chart-1",
    isDefault: true,
    isActive: true,
  },
];

export async function seedDefaultPersonalitiesAction(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    // Check if default personalities already exist
    const existing = await db.query.personality.findMany({
      where: eq(schema.personality.isDefault, true),
    });

    if (existing.length > 0) {
      return { success: true, count: existing.length };
    }

    // Insert default personalities
    const inserts = DEFAULT_PERSONALITIES.map((p) => ({
      ...p,
      id: p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));

    await db.insert(schema.personality).values(inserts);

    return { success: true, count: inserts.length };
  } catch (error) {
    console.error("Failed to seed personalities:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPersonalitiesAction(
  userId?: string
): Promise<schema.PersonalitySelect[]> {
  if (!userId) {
    return [];
  }

  // Only return user's own personalities (no defaults)
  return db.query.personality.findMany({
    where: and(
      eq(schema.personality.isActive, true),
      eq(schema.personality.userId, userId)
    ),
    orderBy: (personality, { asc }) => [asc(personality.name)],
  });
}

export interface CreatePersonalityInput {
  userId: string;
  name: string;
  description: string;
  traits: string[];
  systemPrompt?: string;
  color?: string;
}

export async function createPersonalityAction(
  input: CreatePersonalityInput
): Promise<{ success: boolean; personalityId?: string; error?: string }> {
  try {
    const personalityId = nanoid();

    await db.insert(schema.personality).values({
      id: personalityId,
      userId: input.userId,
      name: input.name,
      description: input.description,
      traits: input.traits,
      systemPrompt: input.systemPrompt ?? null,
      color: input.color ?? "chart-1",
      isDefault: false,
      isActive: true,
    });

    return { success: true, personalityId };
  } catch (error) {
    console.error("Failed to create personality:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updatePersonalityAction(
  personalityId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    traits?: string[];
    systemPrompt?: string;
    color?: string;
  },
  changeReason?: string
): Promise<{ success: boolean; newPersonalityId?: string; error?: string }> {
  try {
    // First try to find user's own personality
    let personality = await db.query.personality.findFirst({
      where: and(
        eq(schema.personality.id, personalityId),
        eq(schema.personality.userId, userId)
      ),
    });

    // If not found, check if it's a system default that needs to be cloned
    if (!personality) {
      const defaultPersonality = await db.query.personality.findFirst({
        where: and(
          eq(schema.personality.id, personalityId),
          eq(schema.personality.isDefault, true)
        ),
      });

      if (defaultPersonality) {
        // Clone the default for this user with the updates applied
        const newId = nanoid();
        await db.insert(schema.personality).values({
          id: newId,
          userId: userId,
          name: updates.name ?? defaultPersonality.name,
          description: updates.description ?? defaultPersonality.description,
          traits: updates.traits ?? defaultPersonality.traits,
          systemPrompt: updates.systemPrompt ?? defaultPersonality.systemPrompt,
          color: updates.color ?? defaultPersonality.color,
          isDefault: false,
          isActive: true,
          version: 1,
        });

        return { success: true, newPersonalityId: newId };
      }

      return { success: false, error: "Personality not found" };
    }

    // Save current state to version history BEFORE updating
    await db.insert(schema.personalityVersion).values({
      id: nanoid(),
      personalityId: personality.id,
      version: personality.version,
      name: personality.name,
      description: personality.description,
      traits: personality.traits,
      systemPrompt: personality.systemPrompt,
      color: personality.color,
      changeReason: changeReason ?? null,
    });

    // Increment version and update
    const newVersion = personality.version + 1;
    await db
      .update(schema.personality)
      .set({
        ...updates,
        version: newVersion,
        updatedAt: new Date(),
      })
      .where(eq(schema.personality.id, personalityId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update personality:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deletePersonalityAction(
  personalityId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if it's the user's own personality
    const personality = await db.query.personality.findFirst({
      where: and(
        eq(schema.personality.id, personalityId),
        eq(schema.personality.userId, userId)
      ),
    });

    if (personality) {
      // Soft delete user's own personality
      await db
        .update(schema.personality)
        .set({ isActive: false })
        .where(eq(schema.personality.id, personalityId));
      return { success: true };
    }

    // Check if it's a system default
    const defaultPersonality = await db.query.personality.findFirst({
      where: and(
        eq(schema.personality.id, personalityId),
        eq(schema.personality.isDefault, true)
      ),
    });

    if (defaultPersonality) {
      return {
        success: false,
        error: "Cannot delete system defaults. Edit it to create your own copy first.",
      };
    }

    return { success: false, error: "Personality not found" };
  } catch (error) {
    console.error("Failed to delete personality:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Clone default personalities for a user so they can customize them
export async function cloneDefaultsForUserAction(
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Check if user already has personalities (already cloned)
    const existingUserPersonalities = await db.query.personality.findMany({
      where: and(
        eq(schema.personality.userId, userId),
        eq(schema.personality.isActive, true)
      ),
    });

    if (existingUserPersonalities.length > 0) {
      // User already has personalities, no need to clone
      return { success: true, count: 0 };
    }

    // Get all default personalities
    const defaults = await db.query.personality.findMany({
      where: eq(schema.personality.isDefault, true),
    });

    if (defaults.length === 0) {
      return { success: true, count: 0 };
    }

    // Clone each default for the user
    const clones = defaults.map((p) => ({
      id: nanoid(),
      userId: userId,
      name: p.name,
      description: p.description,
      traits: p.traits,
      systemPrompt: p.systemPrompt,
      color: p.color,
      isDefault: false,
      isActive: true,
      version: 1,
    }));

    await db.insert(schema.personality).values(clones);

    return { success: true, count: clones.length };
  } catch (error) {
    console.error("Failed to clone defaults for user:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Reset all user personalities to defaults (soft delete existing, re-clone)
export async function resetToDefaultsAction(
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Soft delete all user's existing personalities
    await db
      .update(schema.personality)
      .set({ isActive: false })
      .where(eq(schema.personality.userId, userId));

    // Get all default personalities
    const defaults = await db.query.personality.findMany({
      where: eq(schema.personality.isDefault, true),
    });

    if (defaults.length === 0) {
      return { success: true, count: 0 };
    }

    // Clone each default for the user
    const clones = defaults.map((p) => ({
      id: nanoid(),
      userId: userId,
      name: p.name,
      description: p.description,
      traits: p.traits,
      systemPrompt: p.systemPrompt,
      color: p.color,
      isDefault: false,
      isActive: true,
      version: 1,
    }));

    await db.insert(schema.personality).values(clones);

    return { success: true, count: clones.length };
  } catch (error) {
    console.error("Failed to reset to defaults:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
