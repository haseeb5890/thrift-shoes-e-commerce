"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { eq, and, asc, inArray } from "drizzle-orm"
import { requireAdminAction } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { products, productMedia } from "@/lib/db/schema"

const productSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  category: z.string().min(1),
  gender: z.string().min(1),
  size: z.string().min(1),
  condition: z.string().min(1),
  conditionNotes: z.string().min(1),
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
    category: formData.get("category"),
    gender: formData.get("gender"),
    size: formData.get("size"),
    condition: formData.get("condition"),
    conditionNotes: formData.get("conditionNotes"),
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

export async function createProduct(formData: FormData) {
  await requireAdminAction()

  const data = parseProductFields(formData)
  const imageUrls = mediaUrls(formData, "imageUrls")
  if (imageUrls.length === 0) throw new Error("At least one product image is required")
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
    conditionNotes: data.conditionNotes,
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
  redirect("/admin/products")
}

export async function updateProduct(formData: FormData) {
  await requireAdminAction()

  const productId = String(formData.get("id"))
  if (!productId) throw new Error("Missing product id")

  const data = parseProductFields(formData)
  const newImageUrls = mediaUrls(formData, "imageUrls")
  const newVideoUrl = mediaUrls(formData, "videoUrl")[0] ?? null
  const removeIds = formData.getAll("removeMediaIds").map(String).filter(Boolean)

  if (removeIds.length) {
    await db.delete(productMedia).where(and(eq(productMedia.productId, productId), inArray(productMedia.id, removeIds)))
  }

  const existingImages = await db.select().from(productMedia).where(and(eq(productMedia.productId, productId), eq(productMedia.kind, "image"))).orderBy(asc(productMedia.sortOrder))
  const nextSortOrder = existingImages.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1

  const mediaRows = newImageUrls.map((url, index) => ({ id: crypto.randomUUID(), productId, url, kind: "image", sortOrder: nextSortOrder + index }))
  if (newVideoUrl) mediaRows.push({ id: crypto.randomUUID(), productId, url: newVideoUrl, kind: "video", sortOrder: 0 })
  if (mediaRows.length) await db.insert(productMedia).values(mediaRows)

  if (existingImages.length === 0 && newImageUrls.length === 0) throw new Error("A product must keep at least one image")

  const cover = existingImages[0] ?? (newImageUrls[0] ? { url: newImageUrls[0] } : null)

  await db.update(products).set({
    name: data.name,
    brand: data.brand,
    category: data.category,
    gender: data.gender,
    size: data.size,
    condition: data.condition,
    conditionNotes: data.conditionNotes,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    color: data.color,
    isFeatured: data.isFeatured ?? false,
    stock: data.stock,
    updatedAt: new Date(),
    ...(cover ? { imageUrl: cover.url, imageAlt: data.name } : {}),
  }).where(eq(products.id, productId))

  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidatePath("/shop")
  redirect("/admin/products")
}
