import "server-only";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as { escuelaPool?: Pool };
export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (!globalForDb.escuelaPool) {
    globalForDb.escuelaPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      statement_timeout: 15000,
    });
    globalForDb.escuelaPool.on("error", () => console.error("Database pool connection error"));
  }
  return globalForDb.escuelaPool;
}
