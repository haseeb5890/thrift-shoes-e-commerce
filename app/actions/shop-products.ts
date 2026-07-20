"use server"

import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { getProducts, type ProductFilters } from "@/lib/products"
import { fallbackProducts, type Product } from "@/lib/store-data"

export async function loadMoreProducts(filters: ProductFilters, page: number) {
  const result = await getProducts({ ...filters, page: String(page) })
  return { products: result.products, hasMore: page < result.totalPages }
}

export async function searchProductsPreview(query: string, limit = 3): Promise<{ products: Product[]; total: number }> {
  const q = query.trim()
  if (!q) return { products: [], total: 0 }

  try {
    const like = `%${q.toLowerCase()}%`
    const where = and(
      eq(products.isActive, true),
      sql`(lower(${products.name}) like ${like} or lower(${products.brand}) like ${like} or lower(${products.size}) like ${like})`,
    )
    const [rows, totalRows] = await Promise.all([
      db.select().from(products).where(where).orderBy(desc(products.createdAt)).limit(limit),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
    ])
    if (totalRows[0]?.count) return { products: rows, total: totalRows[0].count }
  } catch {
    // fall through to in-memory fallback below
  }

  const ql = q.toLowerCase()
  const matches = fallbackProducts.filter((p) => p.name.toLowerCase().includes(ql) || p.brand.toLowerCase().includes(ql) || p.size.toLowerCase().includes(ql))
  return { products: matches.slice(0, limit), total: matches.length }
}

export async function getPopularProducts(limit = 4): Promise<Product[]> {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit)
    if (rows.length) return rows
  } catch {
    // fall through to in-memory fallback below
  }
  return fallbackProducts.filter((p) => p.isFeatured).slice(0, limit)
}
