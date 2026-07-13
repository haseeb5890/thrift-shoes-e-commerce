"use server"

import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { uploadProductImage } from "@/lib/supabase/storage-admin"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"

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

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    throw new Error("Not authorized")
  }
}

export async function createProduct(formData: FormData) {
  await assertAdmin()

  const data = productSchema.parse({
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

  const image = formData.get("image")
  if (!(image instanceof File) || image.size === 0) throw new Error("Product image is required")

  const imageUrl = await uploadProductImage(image)
  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`

  await db.insert(products).values({
    id: crypto.randomUUID(),
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
    imageUrl,
    imageAlt: data.name,
    color: data.color,
    isFeatured: data.isFeatured ?? false,
    stock: data.stock,
  })

  revalidatePath("/admin")
  revalidatePath("/shop")
  redirect("/admin")
}
