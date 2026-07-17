import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { eq } from "drizzle-orm"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

export function isAdminUser(user: Pick<User, "email" | "user_metadata"> | null | undefined) {
  if (!user) return false
  if (user.user_metadata?.role === "admin") return true
  return user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
}

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Resolves the `profiles` row linked to the current Supabase auth session (via authUserId).
 * Returns null if not logged in, or if login just happened and the callback hasn't
 * linked/created the profile yet (shouldn't normally occur since the callback does this
 * synchronously before redirecting).
 */
export async function getSessionProfile() {
  const user = await getSessionUser()
  if (!user) return null
  const [profile] = await db.select().from(profiles).where(eq(profiles.authUserId, user.id))
  return profile ?? null
}

/** For server actions: throws instead of redirecting. */
export async function requireAdminAction() {
  const user = await getSessionUser()
  if (!isAdminUser(user)) throw new Error("Not authorized")
  return user!
}

/** For pages: redirects to sign-in or account instead of throwing. */
export async function requireAdminPage() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")
  if (!isAdminUser(user)) redirect("/account")
  return user
}