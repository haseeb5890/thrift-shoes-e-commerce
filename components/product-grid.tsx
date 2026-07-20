"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { ProductCard } from "@/components/product-card"
import { ProductListRow } from "@/components/product-list-row"
import { loadMoreProducts } from "@/app/actions/shop-products"
import type { Product } from "@/lib/store-data"
import type { ProductFilters } from "@/lib/products"

export function ProductGrid({
  initialProducts,
  filters,
  totalPages,
  view,
}: {
  initialProducts: Product[]
  filters: ProductFilters
  totalPages: number
  view: "grid" | "list"
}) {
  const [items, setItems] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // A fresh set of initialProducts means the filters/sort/search changed upstream — restart pagination.
  useEffect(() => {
    setItems(initialProducts)
    setPage(1)
    setHasMore(totalPages > 1)
  }, [initialProducts, totalPages])

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isPending) {
          startTransition(async () => {
            const nextPage = page + 1
            const result = await loadMoreProducts(filters, nextPage)
            setItems((prev) => [...prev, ...result.products])
            setPage(nextPage)
            setHasMore(result.hasMore)
          })
        }
      },
      { rootMargin: "600px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isPending, page, filters])

  return (
    <>
      <div className={view === "list" ? "flex flex-col gap-6" : "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-6"}>
        {items.map((product) =>
          view === "list" ? <ProductListRow key={product.id} product={product} /> : <ProductCard key={product.id} product={product} />,
        )}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="mt-10 flex items-center justify-center gap-3 py-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {isPending && (
            <>
              <span className="size-3 animate-spin rounded-full border-2 border-border border-t-foreground" />
              Loading more pairs...
            </>
          )}
        </div>
      )}
    </>
  )
}
