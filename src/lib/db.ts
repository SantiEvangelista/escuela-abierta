import "server-only";
import { Pool } from "pg";
import { supabaseRootCA } from "./supabase-ca";

const globalForDb = globalThis as unknown as { escuelaPool?: Pool };
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!globalForDb.escuelaPool) {
    const url = new URL(process.env.DATABASE_URL);
    const supabase = url.hostname.endsWith(".pooler.supabase.com") || url.hostname.endsWith(".supabase.co");
    // pg parses sslmode from the URL after reading the supplied ssl object.
    if (supabase) url.searchParams.delete("sslmode");
    globalForDb.escuelaPool = new Pool({
      connectionString: url.toString(),
      ...(supabase && { ssl: { ca: supabaseRootCA, rejectUnauthorized: true } }),
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      statement_timeout: 15000,
    });
    globalForDb.escuelaPool.on("error", () => console.error("Database pool connection error"));
  }
  return globalForDb.escuelaPool;
}
