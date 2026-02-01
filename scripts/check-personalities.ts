import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { personality } from "../src/db/schema";

config({ path: ".env.local" });

async function checkPersonalities() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Fetching ALL personalities...\n");

  const all = await db.select().from(personality);

  console.log(`Total personalities in database: ${all.length}\n`);

  for (const p of all) {
    console.log(`  - ${p.name} (id: ${p.id}, userId: ${p.userId || 'SHARED'}, isActive: ${p.isActive})`);
  }
}

checkPersonalities().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
