import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    _db = drizzle(process.env.DATABASE_URL, { schema });
  }
  return _db;
}

// Lazy db proxy - only throws when actually used
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof NeonHttpDatabase<typeof schema>];
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});
