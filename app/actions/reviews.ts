"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { z } from "zod"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"
import { requireAdminAction } from "@/lib/auth-helpers"

const BUCKET = "review-photos"
const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB

// Self-contained service-role client for the photo upload — customer submissions can be
// fully unauthenticated, so this can't ride on the user's own Supabase session/RLS.
function storageClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function uploadReviewPhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Photo must be under 5MB.")
  if (!file.type.startsWith("image/")) throw new Error("Photo must be an image file.")

  const supabase = storageClient()
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: file.type })
  if (error) throw new Error(`Photo upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const submitReviewSchema = z.object({
  customerName: z.string().min(2, "Please enter your name."),
  submittedEmail: z.email("Please enter a valid email."),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10, "Please write at least a few words.").max(1000),
  productId: z.string().optional(),
})

/**
 * Public, unauthenticated review submission. Always lands as status "pending" — never shown
 * on the homepage until an admin approves it via moderateReview.
 */
export async function submitReview(formData: FormData): Promise<{ error: string } | { success: true }> {
  const parsed = submitReviewSchema.safeParse({
    customerName: formData.get("customerName"),
    submittedEmail: formData.get("submittedEmail"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    productId: formData.get("productId") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details and try again." }
  }

  const photoFile = formData.get("photo") as File | null
  let photoUrl: string | null = null

  try {
    if (photoFile && photoFile.size > 0) photoUrl = await uploadReviewPhoto(photoFile)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't upload your photo. Please try again." }
  }

  await db.insert(reviews).values({
    id: crypto.randomUUID(),
    customerName: parsed.data.customerName,
    rating: parsed.data.rating,
    body: parsed.data.body,
    photoUrl,
    productId: parsed.data.productId ?? null,
    source: "customer",
    status: "pending",
    submittedEmail: parsed.data.submittedEmail,
  })

  revalidatePath("/admin/reviews")
  return { success: true }
}

/** Approved reviews for public display (homepage section). */
export async function getApprovedReviews(limit = 12) {
  return db.select().from(reviews).where(eq(reviews.status, "approved")).orderBy(desc(reviews.createdAt)).limit(limit)
}

/** Admin: every review regardless of status, for the moderation queue. */
export async function listAllReviews() {
  await requireAdminAction()
  return db.select().from(reviews).orderBy(desc(reviews.createdAt))
}

export async function moderateReview(reviewId: string, status: "approved" | "rejected"): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()
  await db.update(reviews).set({ status }).where(eq(reviews.id, reviewId))
  revalidatePath("/admin/reviews")
  revalidatePath("/")
  return { success: true }
}

export async function deleteReview(reviewId: string): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()
  await db.delete(reviews).where(eq(reviews.id, reviewId))
  revalidatePath("/admin/reviews")
  revalidatePath("/")
  return { success: true }
}

const adminReviewSchema = z.object({
  customerName: z.string().min(2),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(5).max(1000),
  productId: z.string().optional(),
})

/** Admin-authored review — auto-approved since it's curated by the store owner directly. */
export async function addAdminReview(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()

  const parsed = adminReviewSchema.safeParse({
    customerName: formData.get("customerName"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    productId: formData.get("productId") || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the details." }

  const photoFile = formData.get("photo") as File | null
  let photoUrl: string | null = null
  try {
    if (photoFile && photoFile.size > 0) photoUrl = await uploadReviewPhoto(photoFile)
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't upload the photo." }
  }

  await db.insert(reviews).values({
    id: crypto.randomUUID(),
    customerName: parsed.data.customerName,
    rating: parsed.data.rating,
    body: parsed.data.body,
    photoUrl,
    productId: parsed.data.productId ?? null,
    source: "admin",
    status: "approved",
  })

  revalidatePath("/admin/reviews")
  revalidatePath("/")
  return { success: true }
}