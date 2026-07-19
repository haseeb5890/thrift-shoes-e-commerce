"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { wishlists, products } from "@/lib/db/schema"
import { getSessionProfile } from "@/lib/auth-helpers"

export type WishlistProductRow = {
  id: string
  slug: string
  name: string
  brand: string
  size: string
  condition: string
  price: number
  compareAtPrice: number | null
  imageUrl: string
  imageAlt: string
  stock: number
  priceAtAdd: number
}

/** Returns null if not logged in (no linked profile). Returns the joined wishlist rows otherwise. */
export async function getSessionWishlist(): Promise<WishlistProductRow[] | null> {
  const profile = await getSessionProfile()
  if (!profile) return null

  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brand: products.brand,
      size: products.size,
      condition: products.condition,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      imageUrl: products.imageUrl,
      imageAlt: products.imageAlt,
      stock: products.stock,
      priceAtAdd: wishlists.priceAtAdd,
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(eq(wishlists.profileId, profile.id))
}

export async function toggleWishlistItem(productId: string, currentPrice: number): Promise<{ wishlisted: boolean } | { error: string }> {
  const profile = await getSessionProfile()
  if (!profile) return { error: "Sign in to save items to your wishlist." }

  const [existing] = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(and(eq(wishlists.profileId, profile.id), eq(wishlists.productId, productId)))

  if (existing) {
    await db.delete(wishlists).where(eq(wishlists.id, existing.id))
    revalidatePath("/wishlist")
    return { wishlisted: false }
  }

  await db.insert(wishlists).values({ id: crypto.randomUUID(), profileId: profile.id, productId, priceAtAdd: currentPrice })
  revalidatePath("/wishlist")
  return { wishlisted: true }
}

/** Called once right after login to merge a guest's localStorage wishlist into their account. */
export async function syncGuestWishlist(items: { productId: string; priceAtAdd: number }[]): Promise<WishlistProductRow[] | null> {
  const profile = await getSessionProfile()
  if (!profile) return null
  if (items.length === 0) return getSessionWishlist()

  const existingRows = await db.select({ productId: wishlists.productId }).from(wishlists).where(eq(wishlists.profileId, profile.id))
  const existingIds = new Set(existingRows.map((r) => r.productId))
  const toInsert = items.filter((item) => !existingIds.has(item.productId))

  if (toInsert.length) {
    await db
      .insert(wishlists)
      .values(toInsert.map((item) => ({ id: crypto.randomUUID(), profileId: profile.id, productId: item.productId, priceAtAdd: item.priceAtAdd })))
  }

  revalidatePath("/wishlist")
  return getSessionWishlist()
}