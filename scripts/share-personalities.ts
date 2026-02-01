import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { personality } from "../src/db/schema";
import { eq, isNotNull } from "drizzle-orm";

config({ path: ".env.local" });

async function sharePersonalities() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Fetching all user-created personalities...\n");

  // Get all personalities that have a userId (user-created)
  const userPersonalities = await db
    .select()
    .from(personality)
    .where(isNotNull(personality.userId));

  if (userPersonalities.length === 0) {
    console.log("No user-created personalities found.");
    return;
  }

  console.log(`Found ${userPersonalities.length} user-created personalities:\n`);

  for (const p of userPersonalities) {
    console.log(`  - ${p.name} (owner: ${p.userId})`);
  }

  console.log("\nMaking all personalities available to everyone (setting userId to null)...\n");

  // Option 1: Make them available to everyone by setting userId to null
  for (const p of userPersonalities) {
    await db
      .update(personality)
      .set({ userId: null })
      .where(eq(personality.id, p.id));

    console.log(`  + ${p.name} is now available to all users`);
  }

  console.log("\nDone! All personalities are now shared with everyone.");
}

sharePersonalities().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
