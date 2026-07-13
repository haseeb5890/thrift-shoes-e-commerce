import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { fallbackProducts, type Product } from "@/lib/store-data"

export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.createdAt))
    return rows.length ? rows : fallbackProducts
  } catch {
    return fallbackProducts
  }
}

export async function getProduct(slug: string) {
  const items = await getProducts()
  return items.find((item) => item.slug === slug)
}
