"use server"

import { z } from "zod"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { promoCodes } from "@/lib/db/schema"
import { requireAdminAction } from "@/lib/auth-helpers"

const promoSchema = z.object({
  code: z.string().trim().min(3).max(24),
  discountPercent: z.coerce.number().int().min(1).max(100),
  maxUses: z.coerce.number().int().min(1),
})

export async function listPromoCodes() {
  await requireAdminAction()
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))
}

export async function createPromoCode(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()

  let data: z.infer<typeof promoSchema>
  try {
    data = promoSchema.parse({ code: formData.get("code"), discountPercent: formData.get("discountPercent"), maxUses: formData.get("maxUses") })
  } catch {
    return { error: "Enter a code (3+ characters), a discount of 1-100%, and at least 1 use." }
  }

  const code = data.code.toUpperCase()
  const [existing] = await db.select({ id: promoCodes.id }).from(promoCodes).where(eq(promoCodes.code, code))
  if (existing) return { error: `Promo code "${code}" already exists.` }

  await db.insert(promoCodes).values({ id: crypto.randomUUID(), code, discountPercent: data.discountPercent, maxUses: data.maxUses })

  revalidatePath("/admin/promos")
  return { success: true }
}

export async function togglePromoActive(id: string, isActive: boolean): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()
  await db.update(promoCodes).set({ isActive }).where(eq(promoCodes.id, id))
  revalidatePath("/admin/promos")
  return { success: true }
}

export async function deletePromoCode(id: string): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()
  await db.delete(promoCodes).where(eq(promoCodes.id, id))
  revalidatePath("/admin/promos")
  return { success: true }
}

/**
 * Checkout-facing preview — no auth, doesn't claim a redemption. The actual claim happens
 * atomically inside createOrder's transaction so two concurrent checkouts can't both take
 * the last ticket. This is only for showing the customer the discount before they submit.
 */
export async function validatePromoCode(code: string, subtotal: number): Promise<{ error: string } | { code: string; discountPercent: number; discountAmount: number }> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { error: "Enter a promo code." }

  const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, normalized))
  if (!promo || !promo.isActive) return { error: "This promo code is invalid." }
  if (promo.usedCount >= promo.maxUses) return { error: "This promo code has been fully redeemed." }

  const discountAmount = Math.round((subtotal * promo.discountPercent) / 100)
  return { code: promo.code, discountPercent: promo.discountPercent, discountAmount }
}
