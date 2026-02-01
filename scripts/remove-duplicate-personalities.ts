import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { personality } from "../src/db/schema";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

async function removeDuplicates() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Fetching all active personalities...\n");

  const all = await db
    .select()
    .from(personality)
    .where(eq(personality.isActive, true));

  console.log(`Total active personalities: ${all.length}\n`);

  // Group by (userId, name) - keeping the first one (oldest by createdAt)
  const seen = new Map<string, string>(); // key: "userId|name" -> id to keep
  const toDeactivate: string[] = [];

  // Sort by createdAt to keep the oldest
  all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const p of all) {
    const key = `${p.userId ?? 'NULL'}|${p.name}`;

    if (seen.has(key)) {
      // This is a duplicate, mark for deactivation
      toDeactivate.push(p.id);
    } else {
      // First occurrence, keep it
      seen.set(key, p.id);
    }
  }

  console.log(`Found ${toDeactivate.length} duplicates to deactivate\n`);

  if (toDeactivate.length === 0) {
    console.log("No duplicates found!");
    return;
  }

  console.log("Deactivating duplicates (soft delete)...\n");

  for (const id of toDeactivate) {
    const p = all.find(x => x.id === id);
    await db
      .update(personality)
      .set({ isActive: false })
      .where(eq(personality.id, id));
    console.log(`  - Deactivated: ${p?.name} (userId: ${p?.userId ?? 'SHARED'})`);
  }

  // Count remaining active
  const remaining = await db
    .select()
    .from(personality)
    .where(eq(personality.isActive, true));

  console.log(`\nDone! Remaining active personalities: ${remaining.length}`);
}

removeDuplicates().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
