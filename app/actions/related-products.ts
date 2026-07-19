"use server"

import { getRelatedProducts } from "@/lib/products"
import type { Product } from "@/lib/store-data"

export async function fetchRelatedProducts(product: Product, limit = 8) {
  return getRelatedProducts(product, limit)
}
