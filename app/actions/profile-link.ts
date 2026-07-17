"use server"

import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/auth-helpers"
import { getOrCreateProfile } from "@/lib/profiles"

/**
 * Links (or creates) the profiles row for the currently-authenticated Supabase user.
 *
 * Needed because password sign-in/sign-up sets a session directly in the browser and
 * never redirects through app/auth/callback/route.ts — so nothing else would otherwise
 * call getOrCreateProfile with this user's authUserId. Google OAuth and email-confirmation
 * links DO go through the callback and don't need this, but calling it again there is
 * harmless (getOrCreateProfile only fills gaps, never overwrites).
 */
export async function linkCurrentUserProfile() {
  const user = await getSessionUser()
  if (!user?.email) return null

  return getOrCreateProfile(db, {
    email: user.email,
    authUserId: user.id,
    fullName: (user.user_metadata?.name as string | undefined) ?? (user.user_metadata?.full_name as string | undefined) ?? null,
  })
}