import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, productMedia } from "@/lib/db/schema"
import { fallbackProducts, type Product } from "@/lib/store-data"

export const PAGE_SIZE = 12

export type SortOption = "latest" | "price-asc" | "price-desc"

export type ProductFilters = {
  q?: string
  category?: string
  size?: string
  gender?: string
  brand?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sort?: SortOption
  page?: string
}

export type ProductsResult = {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

async function getAllProducts(): Promise<Product[]> {
  try {
    const rows = await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.createdAt))
    return rows.length ? rows : fallbackProducts
  } catch {
    return fallbackProducts
  }
}

// Used only for the in-memory fallback path (when the DB is unreachable/empty).
function applyFiltersInMemory(items: Product[], filters: ProductFilters): Product[] {
  const min = filters.minPrice ? Number(filters.minPrice) : undefined
  const max = filters.maxPrice ? Number(filters.maxPrice) : undefined

  const indexed = items.map((item, index) => ({ item, index }))

  const filtered = indexed.filter(({ item }) => {
    if (filters.category && item.category !== filters.category) return false
    if (filters.size && item.size !== filters.size) return false
    if (filters.gender && item.gender !== filters.gender) return false
    if (filters.brand && item.brand !== filters.brand) return false
    if (filters.condition && item.condition !== filters.condition) return false
    if (min !== undefined && item.price < min) return false
    if (max !== undefined && item.price > max) return false
    if (filters.q) {
      const q = filters.q.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.size.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Thrift priority: sold (stock <= 0) always last, regardless of sort.
  // "Latest" has no createdAt on the fallback Product type, so we fall back to
  // reverse array order (fallbackProducts is authored oldest-first) as a stand-in for recency.
  const sorted = filtered.sort((a, b) => {
    const aSold = a.item.stock <= 0 ? 1 : 0
    const bSold = b.item.stock <= 0 ? 1 : 0
    if (aSold !== bSold) return aSold - bSold

    switch (filters.sort) {
      case "price-asc":
        return a.item.price - b.item.price
      case "price-desc":
        return b.item.price - a.item.price
      default:
        return b.index - a.index
    }
  })

  return sorted.map(({ item }) => item)
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResult> {
  const page = Math.max(1, Number(filters.page) || 1)

  try {
    const conditions: SQL[] = [eq(products.isActive, true)]

    if (filters.category) conditions.push(eq(products.category, filters.category))
    if (filters.size) conditions.push(eq(products.size, filters.size))
    if (filters.gender) conditions.push(eq(products.gender, filters.gender))
    if (filters.brand) conditions.push(eq(products.brand, filters.brand))
    if (filters.condition) conditions.push(eq(products.condition, filters.condition))
    if (filters.minPrice) conditions.push(gte(products.price, Number(filters.minPrice)))
    if (filters.maxPrice) conditions.push(lte(products.price, Number(filters.maxPrice)))
    if (filters.q) {
      const q = `%${filters.q.toLowerCase()}%`
      conditions.push(sql`(lower(${products.name}) like ${q} or lower(${products.size}) like ${q})`)
    }

    const where = and(...conditions)

    // Thrift priority: in-stock items first (0), sold items last (1), then the chosen sort within each group.
    const soldLast = sql`case when ${products.stock} <= 0 then 1 else 0 end`
    const sortColumn =
      filters.sort === "price-asc" ? asc(products.price) : filters.sort === "price-desc" ? desc(products.price) : desc(products.createdAt)

    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(products)
        .where(where)
        .orderBy(soldLast, sortColumn)
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
    ])

    const total = totalRows[0]?.count ?? 0

    if (total === 0 && rows.length === 0) {
      // Nothing in the DB matches (or DB is empty) — fall back to mock data so the shop isn't blank in dev.
      const allFallback = await getAllProducts()
      if (allFallback === fallbackProducts) {
        const filteredFallback = applyFiltersInMemory(allFallback, filters)
        const start = (page - 1) * PAGE_SIZE
        return {
          products: filteredFallback.slice(start, start + PAGE_SIZE),
          total: filteredFallback.length,
          page,
          totalPages: Math.max(1, Math.ceil(filteredFallback.length / PAGE_SIZE)),
        }
      }
    }

    return { products: rows, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
  } catch {
    const filtered = applyFiltersInMemory(fallbackProducts, filters)
    const start = (page - 1) * PAGE_SIZE
    return {
      products: filtered.slice(start, start + PAGE_SIZE),
      total: filtered.length,
      page,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    }
  }
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