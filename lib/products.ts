import { and, asc, desc, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, productMedia } from "@/lib/db/schema"
import { fallbackProducts, type Product } from "@/lib/store-data"

export const PAGE_SIZE = 18

export type SortOption = "latest" | "price-asc" | "price-desc"
export type ViewOption = "grid" | "list"

export type ProductFilters = {
  q?: string
  category?: string
  gender?: string
  size?: string // comma-separated, e.g. "US 9,US 10"
  brand?: string // comma-separated
  condition?: string // comma-separated
  minPrice?: string
  maxPrice?: string
  sort?: SortOption
  view?: ViewOption
  page?: string
}

export type ProductsResult = {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

export type FacetCounts = {
  sizes: { value: string; count: number }[]
  brands: { value: string; count: number }[]
  conditions: { value: string; count: number }[]
  genders: { value: string; count: number }[]
  priceBounds: { min: number; max: number }
}

function parseList(value?: string): string[] {
  return value ? value.split(",").filter(Boolean) : []
}

async function getAllProducts(): Promise<Product[]> {
  try {
    const rows = await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.createdAt))
    return rows.length ? rows : fallbackProducts
  } catch {
    return fallbackProducts
  }
}

// Fallback path (DB unreachable/empty) — in-memory filtering/sorting/pagination for dev safety.
function applyFiltersInMemory(items: Product[], filters: ProductFilters): Product[] {
  const min = filters.minPrice ? Number(filters.minPrice) : undefined
  const max = filters.maxPrice ? Number(filters.maxPrice) : undefined
  const sizes = parseList(filters.size)
  const brands = parseList(filters.brand)
  const conditions = parseList(filters.condition)

  const indexed = items.map((item, index) => ({ item, index }))

  const filtered = indexed.filter(({ item }) => {
    if (filters.category && item.category !== filters.category) return false
    if (filters.gender && item.gender !== filters.gender) return false
    if (sizes.length && !sizes.includes(item.size)) return false
    if (brands.length && !brands.includes(item.brand)) return false
    if (conditions.length && !conditions.includes(item.condition)) return false
    if (min !== undefined && item.price < min) return false
    if (max !== undefined && item.price > max) return false
    if (filters.q) {
      const q = filters.q.toLowerCase()
      if (!item.name.toLowerCase().includes(q) && !item.size.toLowerCase().includes(q)) return false
    }
    return true
  })

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
  const sizes = parseList(filters.size)
  const brands = parseList(filters.brand)
  const conditions = parseList(filters.condition)

  try {
    const conditionsList: SQL[] = [eq(products.isActive, true)]

    if (filters.category) conditionsList.push(eq(products.category, filters.category))
    if (filters.gender) conditionsList.push(eq(products.gender, filters.gender))
    if (sizes.length) conditionsList.push(inArray(products.size, sizes))
    if (brands.length) conditionsList.push(inArray(products.brand, brands))
    if (conditions.length) conditionsList.push(inArray(products.condition, conditions))
    if (filters.minPrice) conditionsList.push(gte(products.price, Number(filters.minPrice)))
    if (filters.maxPrice) conditionsList.push(lte(products.price, Number(filters.maxPrice)))
    if (filters.q) {
      const q = `%${filters.q.toLowerCase()}%`
      conditionsList.push(sql`(lower(${products.name}) like ${q} or lower(${products.size}) like ${q})`)
    }

    const where = and(...conditionsList)

    // Thrift priority: in-stock items first, sold items last, then the chosen sort within each group.
    const soldLast = sql`case when ${products.stock} <= 0 then 1 else 0 end`
    const sortColumn =
      filters.sort === "price-asc" ? asc(products.price) : filters.sort === "price-desc" ? desc(products.price) : desc(products.createdAt)

    const [rows, totalRows] = await Promise.all([
      db.select().from(products).where(where).orderBy(soldLast, sortColumn).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
    ])

    const total = totalRows[0]?.count ?? 0

    if (total === 0 && rows.length === 0) {
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

/**
 * Faceted filter counts for the sidebar/drawer.
 *
 * For each dimension (size/brand/condition), the count query includes every OTHER active
 * filter (cross-category narrowing: selecting a size narrows brand/condition counts) but
 * excludes that dimension's OWN selections (same-category OR: selecting "Adidas" doesn't
 * zero out "Nike"'s count). Only in-stock (stock > 0), active products count.
 *
 * The value universe (which sizes/brands/conditions exist at all) is queried separately from
 * counts, so a value never disappears from the UI just because its current count is 0 —
 * it shows up grayed out/disabled instead, per thrift one-of-one inventory requirements.
 */
export async function getFacetedFilterCounts(filters: ProductFilters = {}): Promise<FacetCounts> {
  const sizes = parseList(filters.size)
  const brands = parseList(filters.brand)
  const conditions = parseList(filters.condition)

  try {
    function otherConditions(exclude: "size" | "brand" | "condition" | "gender"): SQL {
      const list: SQL[] = [eq(products.isActive, true), sql`${products.stock} > 0`]
      if (exclude !== "size" && sizes.length) list.push(inArray(products.size, sizes))
      if (exclude !== "brand" && brands.length) list.push(inArray(products.brand, brands))
      if (exclude !== "condition" && conditions.length) list.push(inArray(products.condition, conditions))
      if (exclude !== "gender" && filters.gender) list.push(eq(products.gender, filters.gender))
      if (filters.category) list.push(eq(products.category, filters.category))
      if (filters.minPrice) list.push(gte(products.price, Number(filters.minPrice)))
      if (filters.maxPrice) list.push(lte(products.price, Number(filters.maxPrice)))
      return and(...list)!
    }

    const [sizeUniverse, brandUniverse, conditionUniverse, genderUniverse, sizeCounts, brandCounts, conditionCounts, genderCounts, priceRow] = await Promise.all([
      db.selectDistinct({ value: products.size }).from(products).where(eq(products.isActive, true)),
      db.selectDistinct({ value: products.brand }).from(products).where(eq(products.isActive, true)),
      db.selectDistinct({ value: products.condition }).from(products).where(eq(products.isActive, true)),
      db.selectDistinct({ value: products.gender }).from(products).where(eq(products.isActive, true)),
      db.select({ value: products.size, count: sql<number>`count(*)::int` }).from(products).where(otherConditions("size")).groupBy(products.size),
      db.select({ value: products.brand, count: sql<number>`count(*)::int` }).from(products).where(otherConditions("brand")).groupBy(products.brand),
      db
        .select({ value: products.condition, count: sql<number>`count(*)::int` })
        .from(products)
        .where(otherConditions("condition"))
        .groupBy(products.condition),
      db.select({ value: products.gender, count: sql<number>`count(*)::int` }).from(products).where(otherConditions("gender")).groupBy(products.gender),
      db.select({ min: sql<number>`min(${products.price})::int`, max: sql<number>`max(${products.price})::int` }).from(products).where(eq(products.isActive, true)),
    ])

    function merge(universe: { value: string }[], counts: { value: string; count: number }[]) {
      const map = new Map(counts.map((c) => [c.value, c.count]))
      return universe.map((u) => ({ value: u.value, count: map.get(u.value) ?? 0 })).sort((a, b) => a.value.localeCompare(b.value))
    }

    return {
      sizes: merge(sizeUniverse, sizeCounts),
      brands: merge(brandUniverse, brandCounts),
      conditions: merge(conditionUniverse, conditionCounts),
      genders: merge(genderUniverse, genderCounts),
      priceBounds: { min: priceRow[0]?.min ?? 0, max: priceRow[0]?.max ?? 0 },
    }
  } catch {
    function tally(key: "size" | "brand" | "condition" | "gender") {
      const counts = new Map<string, number>()
      for (const p of fallbackProducts) counts.set(p[key], (counts.get(p[key]) ?? 0) + (p.stock > 0 ? 1 : 0))
      return Array.from(counts.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value))
    }
    const prices = fallbackProducts.map((p) => p.price)
    return { sizes: tally("size"), brands: tally("brand"), conditions: tally("condition"), genders: tally("gender"), priceBounds: { min: Math.min(...prices), max: Math.max(...prices) } }
  }
}

/**
 * Related products for the PDP. Since inventory is one-of-one, "frequently bought together"
 * doesn't apply — instead, prioritize other in-stock pairs in the exact same size (highest
 * purchase-intent overlap), then same brand, excluding the current product.
 */
export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  try {
    const sameSizeFirst = sql`case when ${products.size} = ${product.size} then 0 else 1 end`
    const rows = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`${products.stock} > 0`,
          sql`${products.id} != ${product.id}`,
          or(eq(products.size, product.size), eq(products.brand, product.brand)),
        ),
      )
      .orderBy(sameSizeFirst, desc(products.createdAt))
      .limit(limit)
    return rows
  } catch {
    return fallbackProducts
      .filter((p) => p.id !== product.id && p.stock > 0 && (p.size === product.size || p.brand === product.brand))
      .slice(0, limit)
  }
}
