import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, productMedia } from "@/lib/db/schema"
import { fallbackProducts, type Product } from "@/lib/store-data"

export type ProductFilters = { q?: string; category?: string; size?: string; gender?: string; brand?: string; condition?: string }

async function getAllProducts(): Promise<Product[]> {
  try {
    const rows = await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.createdAt))
    return rows.length ? rows : fallbackProducts
  } catch {
    return fallbackProducts
  }
}

function applyFilters(items: Product[], filters: ProductFilters): Product[] {
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false
    if (filters.size && item.size !== filters.size) return false
    if (filters.gender && item.gender !== filters.gender) return false
    if (filters.brand && item.brand !== filters.brand) return false
    if (filters.condition && item.condition !== filters.condition) return false
    if (filters.q) {
      const q = filters.q.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.size.toLowerCase().includes(q)) return false
    }
    return true
  })
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  return applyFilters(await getAllProducts(), filters)
}

export async function getProduct(slug: string) {
  const items = await getAllProducts()
  return items.find((item) => item.slug === slug)
}

export async function getProductById(id: string) {
  const rows = await db.select().from(products).where(eq(products.id, id))
  return rows[0]
}

export async function getProductMedia(productId: string) {
  return db.select().from(productMedia).where(eq(productMedia.productId, productId)).orderBy(asc(productMedia.sortOrder))
}

export async function getFilterFacets() {
  const all = await getAllProducts()
  return {
    brands: Array.from(new Set(all.map((item) => item.brand))).sort(),
    sizes: Array.from(new Set(all.map((item) => item.size))).sort(),
  }
}
