import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { personality, personalityVersion } from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

config({ path: ".env.local" });

const TARGET_USER = "user_392anSn1UKpHTXuoABpmUf8rERQ";

async function assignToUser() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log(`Assigning personalities to user: ${TARGET_USER}\n`);

  // Get all shared personalities (userId = null, isActive = true)
  const sharedPersonalities = await db
    .select()
    .from(personality)
    .where(and(isNull(personality.userId), eq(personality.isActive, true)));

  console.log(`Found ${sharedPersonalities.length} shared personalities\n`);

  // Get existing personalities for this user
  const existingUserPersonalities = await db
    .select()
    .from(personality)
    .where(and(
      eq(personality.userId, TARGET_USER),
      eq(personality.isActive, true)
    ));

  const existingNames = new Set(existingUserPersonalities.map(p => p.name));
  console.log(`User already has ${existingUserPersonalities.length} personalities\n`);

  // Clone missing shared personalities to this user
  let clonedCount = 0;
  for (const p of sharedPersonalities) {
    if (!existingNames.has(p.name)) {
      const newId = nanoid();

      await db.insert(personality).values({
        id: newId,
        userId: TARGET_USER,
        name: p.name,
        description: p.description,
        traits: p.traits,
        systemPrompt: p.systemPrompt,
        color: p.color,
        isDefault: false,
        isActive: true,
        version: 1,
      });

      console.log(`  + Cloned: ${p.name}`);
      clonedCount++;
    }
  }

  if (clonedCount === 0) {
    console.log("No new personalities to clone.\n");
  } else {
    console.log(`\nCloned ${clonedCount} new personalities.\n`);
  }

  // Now ensure all user's personalities have version records
  console.log("Creating personality version records...\n");

  const userPersonalities = await db
    .select()
    .from(personality)
    .where(and(
      eq(personality.userId, TARGET_USER),
      eq(personality.isActive, true)
    ));

  let versionCount = 0;
  for (const p of userPersonalities) {
    // Check if version record exists
    const existingVersion = await db
      .select()
      .from(personalityVersion)
      .where(eq(personalityVersion.personalityId, p.id))
      .limit(1);

    if (existingVersion.length === 0) {
      // Create initial version record
      await db.insert(personalityVersion).values({
        id: nanoid(),
        personalityId: p.id,
        version: 1,
        name: p.name,
        description: p.description,
        traits: p.traits,
        systemPrompt: p.systemPrompt,
        color: p.color,
        changeReason: "Initial version",
      });

      console.log(`  + Version created: ${p.name}`);
      versionCount++;
    }
  }

  if (versionCount === 0) {
    console.log("All personalities already have version records.\n");
  } else {
    console.log(`\nCreated ${versionCount} version records.\n`);
  }

  // Final count
  const finalPersonalities = await db
    .select()
    .from(personality)
    .where(and(
      eq(personality.userId, TARGET_USER),
      eq(personality.isActive, true)
    ));

  console.log(`\nDone! User ${TARGET_USER} now has ${finalPersonalities.length} active personalities with version history.`);
}

assignToUser().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
