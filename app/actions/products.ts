"use server"

import { z } from "zod"
import { revalidatePath, revalidateTag } from "next/cache"
import { eq, and, asc, desc, gt, inArray, sql } from "drizzle-orm"
import { requireAdminAction } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { products, productMedia, wishlists, reviews } from "@/lib/db/schema"
import { deleteMediaByUrls } from "@/lib/r2"
import type { Product } from "@/lib/store-data"

const productSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  category: z.array(z.string()).min(1),
  gender: z.string().min(1),
  size: z.string().min(1),
  condition: z.string().min(1),
  description: z.string().optional(),
  color: z.string().min(1),
  price: z.coerce.number().int().positive(),
  compareAtPrice: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().nonnegative(),
  isFeatured: z.boolean().optional(),
})

function parseProductFields(formData: FormData) {
  return productSchema.parse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    category: formData.getAll("category"),
    gender: formData.get("gender"),
    size: formData.get("size"),
    condition: formData.get("condition"),
    description: formData.get("description") || undefined,
    color: formData.get("color"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    stock: formData.get("stock"),
    isFeatured: formData.get("isFeatured") === "on",
  })
}

function mediaUrls(formData: FormData, field: string) {
  return formData.getAll(field).map(String).filter((url) => url.startsWith("http"))
}

// Returns a result instead of redirecting — called directly from a client component
// (AdminProductForm) that navigates to /admin/products immediately on submit and shows a
// pending-upload status bar there while this runs in the background, rather than making the
// admin sit on the form until the DB write (and revalidation) finishes.
export async function createProduct(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()

  try {
    const data = parseProductFields(formData)
    const imageUrls = mediaUrls(formData, "imageUrls")
    if (imageUrls.length === 0) return { error: "At least one product image is required" }
    const videoUrl = mediaUrls(formData, "videoUrl")[0] ?? null

    const productId = crypto.randomUUID()
    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`

    await db.insert(products).values({
      id: productId,
      slug,
      name: data.name,
      brand: data.brand,
      category: data.category,
      gender: data.gender,
      size: data.size,
      condition: data.condition,
      description: data.description ?? null,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      imageUrl: imageUrls[0],
      imageAlt: data.name,
      color: data.color,
      isFeatured: data.isFeatured ?? false,
      stock: data.stock,
    })

    const mediaRows = imageUrls.map((url, index) => ({ id: crypto.randomUUID(), productId, url, kind: "image", sortOrder: index }))
    if (videoUrl) mediaRows.push({ id: crypto.randomUUID(), productId, url: videoUrl, kind: "video", sortOrder: 0 })
    await db.insert(productMedia).values(mediaRows)

    revalidatePath("/admin")
    revalidatePath("/admin/products")
    revalidatePath("/shop")
    revalidateTag("product-facet-universe", "max")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't create this product. Please try again." }
  }
}

// Same result-instead-of-redirect shape as createProduct, for the same reason — the client form
// navigates away immediately and shows a pending status bar rather than waiting here.
export async function updateProduct(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()

  try {
    const productId = String(formData.get("id"))
    if (!productId) return { error: "Missing product id" }

    const [existingProduct] = await db.select({ stock: products.stock, soldAt: products.soldAt }).from(products).where(eq(products.id, productId))
    if (!existingProduct) return { error: "Product not found" }

    const data = parseProductFields(formData)
    const newImageUrls = mediaUrls(formData, "imageUrls")
    const newVideoUrl = mediaUrls(formData, "videoUrl")[0] ?? null
    const removeIds = formData.getAll("removeMediaIds").map(String).filter(Boolean)

    if (removeIds.length) {
      const removedRows = await db
        .select({ url: productMedia.url })
        .from(productMedia)
        .where(and(eq(productMedia.productId, productId), inArray(productMedia.id, removeIds)))
      await db.delete(productMedia).where(and(eq(productMedia.productId, productId), inArray(productMedia.id, removeIds)))
      await deleteMediaByUrls(removedRows.map((row) => row.url))
    }

    const existingImages = await db.select().from(productMedia).where(and(eq(productMedia.productId, productId), eq(productMedia.kind, "image"))).orderBy(asc(productMedia.sortOrder))
    const nextSortOrder = existingImages.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1

    const mediaRows = newImageUrls.map((url, index) => ({ id: crypto.randomUUID(), productId, url, kind: "image", sortOrder: nextSortOrder + index }))
    if (newVideoUrl) mediaRows.push({ id: crypto.randomUUID(), productId, url: newVideoUrl, kind: "video", sortOrder: 0 })
    if (mediaRows.length) await db.insert(productMedia).values(mediaRows)

    if (existingImages.length === 0 && newImageUrls.length === 0) return { error: "A product must keep at least one image" }

    const cover = existingImages[0] ?? (newImageUrls[0] ? { url: newImageUrls[0] } : null)

    // Track when the product actually became/stopped being sold out, independent of how stock
    // got there (checkout or a manual edit) — the sold-product storage cleanup cron measures its
    // grace period from this.
    const newlySoldOut = existingProduct.stock > 0 && data.stock <= 0
    const restocked = existingProduct.stock <= 0 && data.stock > 0

    await db.update(products).set({
      name: data.name,
      brand: data.brand,
      category: data.category,
      gender: data.gender,
      size: data.size,
      condition: data.condition,
      description: data.description ?? null,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      color: data.color,
      isFeatured: data.isFeatured ?? false,
      stock: data.stock,
      soldAt: newlySoldOut ? new Date() : restocked ? null : existingProduct.soldAt,
      updatedAt: new Date(),
      ...(cover ? { imageUrl: cover.url, imageAlt: data.name } : {}),
    }).where(eq(products.id, productId))

    revalidatePath("/admin")
    revalidatePath("/admin/products")
    revalidatePath("/shop")
    revalidateTag("product-facet-universe", "max")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't save this product. Please try again." }
  }
}

/**
 * Manual admin delete — mirrors the sold-out cleanup cron's cleanup order (storage first, then
 * DB rows) but runs immediately instead of after a grace period, since an admin deleting a
 * listing directly is an explicit, deliberate action. order_items keeps its own denormalized
 * copy of name/size/image so past orders are unaffected. Wishlist entries pointing at this
 * product are removed (they'd just be dangling); reviews are kept but unlinked, since a review's
 * text/photo is worth keeping even after the specific pair it was about is gone.
 */
export async function deleteProduct(productId: string): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()

  const [product] = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, productId))
  if (!product) return { error: "Product not found" }

  const media = await db.select({ url: productMedia.url }).from(productMedia).where(eq(productMedia.productId, productId))
  await deleteMediaByUrls([product.imageUrl, ...media.map((row) => row.url)])

  await db.delete(productMedia).where(eq(productMedia.productId, productId))
  await db.delete(wishlists).where(eq(wishlists.productId, productId))
  await db.update(reviews).set({ productId: null }).where(eq(reviews.productId, productId))
  await db.delete(products).where(eq(products.id, productId))

  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  revalidateTag("product-facet-universe", "max")
  return { success: true }
}

// For the admin offline-order product picker — unlike the public search, this only surfaces
// in-stock items, since picking something already sold makes no sense there.
export async function searchAdminProducts(query: string, limit = 8): Promise<Product[]> {
  await requireAdminAction()

  const q = query.trim()
  if (!q) return []

  const like = `%${q.toLowerCase()}%`
  return db
    .select()
    .from(products)
    .where(and(gt(products.stock, 0), sql`(lower(${products.name}) like ${like} or lower(${products.brand}) like ${like} or lower(${products.size}) like ${like})`))
    .orderBy(desc(products.createdAt))
    .limit(limit)
}

export async function updateProductPrice(productId: string, price: number) {
  await requireAdminAction()

  if (!Number.isInteger(price) || price <= 0) return { error: "Enter a valid price." }

  await db.update(products).set({ price, updatedAt: new Date() }).where(eq(products.id, productId))

  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  return { success: true }
}