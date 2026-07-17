import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Next.js dev re-evaluates this module on every hot reload, which would spawn a
// fresh Pool (and leak connections against Supabase's pooler) each time without
// this cache.
declare global {
  var _pgPool: Pool | undefined
}

export const pool = globalThis._pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool

export const db = drizzle(pool, { schema })
