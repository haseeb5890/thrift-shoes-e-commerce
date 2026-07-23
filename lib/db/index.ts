import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

// Next.js dev re-evaluates this module on every hot reload, which would spawn a
// fresh Pool (and leak connections against Supabase's pooler) each time without
// this cache.
declare global {
  var _pgPool: Pool | undefined
}

// Supabase's pooler (port 6543, transaction mode) already pools connections in front of
// Postgres — each serverless invocation here should only ever need a couple of connections at
// once, not maintain its own large pool on top of that. Left at the pg default (max 10, no
// connection timeout), every concurrent Vercel invocation competes for connections against the
// same shared pooler ceiling; once it saturates, a query just hangs indefinitely instead of
// failing fast, which is what showed up as multi-minute admin requests that eventually errored
// client-side even though the mutation itself had already succeeded.
export const pool = globalThis._pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
})
if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool

// Supabase can proactively close a connection that's sitting idle in the pool; without this
// listener that surfaces as an unhandled 'error' event on the Pool, which can crash the process.
pool.on("error", (err) => console.error("Unexpected error on idle Postgres client", err))

export const db = drizzle(pool, { schema })
