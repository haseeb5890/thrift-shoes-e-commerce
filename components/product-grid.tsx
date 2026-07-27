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
const LAST_CLICKED_STORAGE_KEY = "shop-grid-last-clicked"

type SavedList = { key: string; items: Product[]; page: number; hasMore: boolean; savedAt: number }
type SavedScroll = { key: string; scrollY: number }
type LastClicked = { key: string; productId: string }

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

function readLastClickedProductId(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(LAST_CLICKED_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as LastClicked
    return saved.key === key ? saved.productId : null
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

  const [items, setItems] = useState(initialProducts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(totalPages > 1)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const prevKeyRef = useRef(key)
  // Blocks list/scroll persistence until the restore effect below has fully resolved — see that
  // effect for why this can't just be "skip the first effect commit": React 18 StrictMode's dev
  // double-invocation of effects runs entirely within the same commit, before any setState from
  // the first pass has flushed to a new render, so a simple one-shot skip still ends up
  // persisting stale pre-restore state on its second pass.
  const restoreDoneRef = useRef(false)

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
  // not on every scroll frame. Held off until the restore effect below has resolved, so it never
  // writes the plain SSR page-1 state over a legitimately larger saved list before that effect
  // gets a chance to apply it.
  useEffect(() => {
    if (!restoreDoneRef.current) return
    try {
      sessionStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ key, items, page, hasMore, savedAt: Date.now() }))
    } catch {
      // sessionStorage unavailable (private browsing etc.) — silently no-op.
    }
  }, [key, items, page, hasMore])

  // Restore a saved list/scroll position once, after mount — deliberately in an effect rather
  // than as the useState initializer above. Seeding state from sessionStorage in the initializer
  // means the client's very first render doesn't match the server-rendered HTML (the server has
  // no access to sessionStorage and always renders page 1) — a hydration mismatch, which forces
  // React to discard and redo that render. Restoring post-hydration avoids that entirely, and the
  // scroll-to-saved-Y here happens after the (possibly larger) restored list has actually applied.
  useEffect(() => {
    const saved = readSavedList(key)
    if (saved) {
      setItems(saved.items)
      setPage(saved.page)
      setHasMore(saved.hasMore)
    }
    const scrollY = saved ? readSavedScrollY(key) : null
    // The specific card the visitor clicked into, if any — preferred over the raw scrollY below
    // because it's immune to pixel drift (see the comment on the settle loop for why that drift
    // is unavoidable). scrollY only serves as a fallback for saved state from before this anchor
    // existed, or the rare case the clicked card itself isn't in the restored list anymore.
    const clickedProductId = saved ? readLastClickedProductId(key) : null

    // Applying scrollTo on the next frame isn't enough: right after a back-navigation, Next's
    // own internal scroll handling is still actively adjusting the page (confirmed by tracing —
    // it fires several incremental native 'scroll' events of its own), and the just-restored
    // (possibly much taller) item list hasn't necessarily been laid out yet either. Wait for
    // document height to stop changing across consecutive frames — i.e. layout has actually
    // settled, which also means Next's own scrolling has stopped moving things — and only then
    // apply the saved position, so we're the last thing to touch scroll rather than racing to be
    // first. restoreDoneRef additionally blocks the scroll-persist effect below from treating
    // Next's own in-flight adjustments as a real user scroll and saving over the correct value.
    let lastHeight = -1
    let stableFrames = 0
    let frame = 0
    function settleThenScroll() {
      const h = document.documentElement.scrollHeight
      stableFrames = h === lastHeight ? stableFrames + 1 : 0
      lastHeight = h
      frame++
      if (stableFrames >= 3 || frame > 60) {
        const target = clickedProductId && document.querySelector(`[data-product-id="${CSS.escape(clickedProductId)}"]`)
        if (target) target.scrollIntoView({ block: "center" })
        else window.scrollTo(0, scrollY ?? 0)
        restoreDoneRef.current = true
        return
      }
      requestAnimationFrame(settleThenScroll)
    }
    requestAnimationFrame(settleThenScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cheap per-scroll-frame write — just a key + number, not the product list. Deliberately does
  // NOT persist immediately on mount, and ignores scroll events until restoreDoneRef flips true:
  // right after a back-navigation, Next's own internal scroll handling fires several native
  // 'scroll' events of its own while it (and this component's restore effect) are still settling
  // the page — persisting those would capture Next's in-flight, not-yet-final position and
  // clobber the correct saved one before the restore effect gets to read it.
  useEffect(() => {
    function persistScroll() {
      if (!restoreDoneRef.current) return
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify({ key, scrollY: window.scrollY }))
      } catch {
        // sessionStorage unavailable — silently no-op.
      }
    }
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

  // Records which card was clicked so the restore effect above can scroll straight back to it —
  // delegated on the container rather than passed into ProductCard/ProductListRow individually.
  function handleGridClick(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-product-id]")
    if (!target?.dataset.productId) return
    try {
      sessionStorage.setItem(LAST_CLICKED_STORAGE_KEY, JSON.stringify({ key, productId: target.dataset.productId }))
    } catch {
      // sessionStorage unavailable — silently no-op.
    }
  }

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
      <div className={`transition-opacity duration-150 ${navPending ? "pointer-events-none opacity-40" : ""}`} onClick={handleGridClick}>
        <div className={view === "list" ? "flex flex-col gap-6" : "grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 md:gap-x-6 md:gap-y-5"}>
          {items.map((product) => (
            <div key={product.id} data-product-id={product.id}>
              {view === "list" ? <ProductListRow product={product} /> : <ProductCard product={product} />}
            </div>
          ))}
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
