import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let clientInstance: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  clientInstance = postgres(DATABASE_URL);
  dbInstance = drizzle(clientInstance, { schema });
  return dbInstance;
}

export async function closeDb() {
  if (clientInstance) {
    await clientInstance.end();
    clientInstance = null;
    dbInstance = null;
  }
}

export async function isDbConnected(): Promise<boolean> {
  if (!DATABASE_URL) return false;
  try {
    const result = await getDb().execute("SELECT 1" as never);
    return true;
  } catch {
    return false;
  }
}
