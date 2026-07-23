"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { ProductListRow } from "@/components/product-list-row"
import { useShopPending } from "@/components/shop-pending-provider"
import { loadMoreProducts } from "@/app/actions/shop-products"
import type { Product } from "@/lib/store-data"
import type { ProductFilters } from "@/lib/products"

// A saved list older than this is treated as stale rather than restored — otherwise a visitor
// who left a shop tab open and comes back later would see whatever was loaded at the time they
// left (missing newly-added products at the top) instead of the freshly server-fetched list.
const SAVED_LIST_TTL_MS = 5 * 60 * 1000

// Split into two keys so the per-scroll-frame write only ever touches a tiny {key, scrollY}
// payload — re-stringifying the (potentially large, ever-growing) loaded product list on every
// scroll tick would be real main-thread work at the exact moment you don't want it.
const LIST_STORAGE_KEY = "shop-grid-list-state"
const SCROLL_STORAGE_KEY = "shop-grid-scroll-y"

type SavedList = { key: string; items: Product[]; page: number; hasMore: boolean; savedAt: number }
type SavedScroll = { key: string; scrollY: number }

function readSavedList(key: string): SavedList | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(LIST_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedList
    if (saved.key !== key) return null
    if (Date.now() - saved.savedAt > SAVED_LIST_TTL_MS) return null
    return saved
  } catch {
    return null
  }
}

function readSavedScrollY(key: string): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedScroll
    return saved.key === key ? saved.scrollY : null
  } catch {
    return null
  }
}

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = `${pathname}?${searchParams.toString()}`
  const { isPending: navPending } = useShopPending()

  // Read once, on first render for this key — this is what lets a back-navigation to the exact
  // same filters restore the already-loaded items instead of snapping back to page 1.
  const savedListRef = useRef<SavedList | null | undefined>(undefined)
  if (savedListRef.current === undefined) savedListRef.current = readSavedList(key)
  const savedList = savedListRef.current

  const [items, setItems] = useState(savedList?.items ?? initialProducts)
  const [page, setPage] = useState(savedList?.page ?? 1)
  const [hasMore, setHasMore] = useState(savedList?.hasMore ?? totalPages > 1)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevKeyRef = useRef(key)

  // A fresh set of initialProducts means the filters/sort/search actually changed — restart
  // pagination. Skipped on the very first mount so a restored back-navigation isn't immediately
  // clobbered by the freshly server-fetched page 1 for the same key.
  useEffect(() => {
    if (prevKeyRef.current === key) return
    prevKeyRef.current = key
    setItems(initialProducts)
    setPage(1)
    setHasMore(totalPages > 1)
  }, [key, initialProducts, totalPages])

  // Persist the list only when it actually changes (after each infinite-scroll batch loads),
  // not on every scroll frame.
  useEffect(() => {
    try {
      sessionStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ key, items, page, hasMore, savedAt: Date.now() }))
    } catch {
      // sessionStorage unavailable (private browsing etc.) — silently no-op.
    }
  }, [key, items, page, hasMore])

  // Restore scroll position once, after the restored items have had a chance to lay out.
  useEffect(() => {
    if (savedList) {
      const scrollY = readSavedScrollY(key)
      if (scrollY !== null) requestAnimationFrame(() => window.scrollTo(0, scrollY))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cheap per-scroll-frame write — just a key + number, not the product list.
  useEffect(() => {
    function persistScroll() {
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify({ key, scrollY: window.scrollY }))
      } catch {
        // sessionStorage unavailable — silently no-op.
      }
    }
    persistScroll()
    let ticking = false
    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        persistScroll()
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [key])

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
      <div className={`transition-opacity duration-150 ${navPending ? "pointer-events-none opacity-40" : ""}`}>
        <div className={view === "list" ? "flex flex-col gap-6" : "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-6"}>
          {items.map((product) =>
            view === "list" ? <ProductListRow key={product.id} product={product} /> : <ProductCard key={product.id} product={product} />,
          )}
        </div>
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
