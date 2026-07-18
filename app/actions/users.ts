"use server"

import { revalidatePath } from "next/cache"
import { requireAdminAction } from "@/lib/auth-helpers"
import { createAdminClient } from "@/lib/supabase/admin-client"

function assertMutable(currentUserId: string, currentUserEmail: string | undefined, targetId: string, targetEmail: string | undefined) {
  if (targetId === currentUserId) throw new Error("You can't change your own account here")
  if (targetEmail?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) throw new Error("The bootstrap admin account can't be modified")
}

export async function listUsers() {
  await requireAdminAction()
  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw new Error(error.message)
  return data.users
    .map((user) => ({
      id: user.id,
      email: user.email ?? "",
      name: (user.user_metadata?.name as string | undefined) ?? user.email?.split("@")[0] ?? "",
      role: (user.user_metadata?.role === "admin" || user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() ? "admin" : "user") as "admin" | "user",
      banned: Boolean(user.banned_until && new Date(user.banned_until) > new Date()),
      createdAt: user.created_at,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function setUserRole(userId: string, role: "admin" | "user", pin: string): Promise<{ error: string } | { success: true }> {
  const admin = await requireAdminAction()
  if (!process.env.ADMIN_PROMOTION_PIN || pin !== process.env.ADMIN_PROMOTION_PIN) return { error: "Incorrect PIN." }
  const supabase = createAdminClient()
  const { data: target } = await supabase.auth.admin.getUserById(userId)
  if (!target.user) throw new Error("User not found")
  assertMutable(admin.id, admin.email, userId, target.user.email)
  const { error } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { ...target.user.user_metadata, role } })
  if (error) throw new Error(error.message)
  revalidatePath("/admin/users")
  return { success: true }
}

export async function toggleUserBan(userId: string, banned: boolean) {
  const admin = await requireAdminAction()
  const supabase = createAdminClient()
  const { data: target } = await supabase.auth.admin.getUserById(userId)
  if (!target.user) throw new Error("User not found")
  assertMutable(admin.id, admin.email, userId, target.user.email)
  const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: banned ? "876000h" : "none" })
  if (error) throw new Error(error.message)
  revalidatePath("/admin/users")
}

export async function deleteUserAccount(userId: string) {
  const admin = await requireAdminAction()
  const supabase = createAdminClient()
  const { data: target } = await supabase.auth.admin.getUserById(userId)
  if (!target.user) throw new Error("User not found")
  assertMutable(admin.id, admin.email, userId, target.user.email)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/users")
}
