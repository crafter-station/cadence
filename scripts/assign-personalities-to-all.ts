import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { personality } from "../src/db/schema";
import { isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

config({ path: ".env.local" });

async function assignPersonalitiesToAll() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Fetching shared personalities (userId = null)...\n");

  // Get all shared personalities
  const sharedPersonalities = await db
    .select()
    .from(personality)
    .where(isNull(personality.userId));

  console.log(`Found ${sharedPersonalities.length} shared personalities\n`);

  // Get all unique userIds from other tables (test_run, prompt, etc.)
  // We'll query from multiple tables to find all users
  const usersResult = await db.execute(sql`
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM test_run WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM prompt WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM external_agent WHERE user_id IS NOT NULL
    ) AS all_users
  `);

  const userIds = (usersResult.rows as { user_id: string }[]).map(r => r.user_id);

  console.log(`Found ${userIds.length} users:\n`);
  for (const uid of userIds) {
    console.log(`  - ${uid}`);
  }

  console.log("\nCloning personalities to each user...\n");

  for (const userId of userIds) {
    console.log(`\nUser: ${userId}`);

    for (const p of sharedPersonalities) {
      const newId = nanoid();

      await db.insert(personality).values({
        id: newId,
        userId: userId,
        name: p.name,
        description: p.description,
        traits: p.traits,
        systemPrompt: p.systemPrompt,
        color: p.color,
        isDefault: false,
        isActive: true,
        version: 1,
      });

      console.log(`  + ${p.name}`);
    }
  }

  console.log("\n\nDone! All personalities cloned to all users.");
}

assignPersonalitiesToAll().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
