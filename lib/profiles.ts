import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

// Accepts either the top-level `db` or a `tx` handle from db.transaction(...) —
// both expose the same query-builder methods used here.
type Executor = typeof db

export async function findProfileByEmail(executor: Executor, email: string) {
  const [profile] = await executor.select().from(profiles).where(eq(profiles.email, email))
  return profile
}

/**
 * Finds a profile by email, creating one if it doesn't exist yet.
 *
 * - If a profile already exists and has no authUserId, and `authUserId` is passed here,
 *   it gets linked now (this is how a guest checkout later becomes an authenticated account,
 *   and how a fresh magic-link login retroactively claims past guest orders).
 * - Never overwrites an existing authUserId, fullName, or phone with a different value —
 *   only fills in gaps.
 */
export async function getOrCreateProfile(
  executor: Executor,
  input: { email: string; fullName?: string | null; phone?: string | null; authUserId?: string | null },
) {
  const email = input.email.trim().toLowerCase()
  const existing = await findProfileByEmail(executor, email)

  if (existing) {
    const updates: Partial<typeof profiles.$inferInsert> = {}
    if (!existing.authUserId && input.authUserId) updates.authUserId = input.authUserId
    if (!existing.fullName && input.fullName) updates.fullName = input.fullName
    if (!existing.phone && input.phone) updates.phone = input.phone

    if (Object.keys(updates).length === 0) return existing

    const [updated] = await executor
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await executor
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      email,
      fullName: input.fullName ?? null,
      phone: input.phone ?? null,
      authUserId: input.authUserId ?? null,
    })
    .returning()
  return created
}