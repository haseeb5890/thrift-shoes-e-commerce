import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

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
