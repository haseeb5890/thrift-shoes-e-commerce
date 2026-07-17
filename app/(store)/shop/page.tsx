import type { Metadata } from "next"
import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { ShopFilters } from "@/components/shop-filters"
import { getFilterFacets, getProducts, type ProductFilters } from "@/lib/products"

export const metadata: Metadata = { title: "Shop all shoes" }

export default async function ShopPage({ searchParams }: { searchParams: Promise<ProductFilters> }) {
  const filters = await searchParams
  const [result, facets] = await Promise.all([getProducts(filters), getFilterFacets()])
  const { products, total, page, totalPages } = result

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value && key !== "page") params.set(key, String(value))
    }
    if (targetPage > 1) params.set("page", String(targetPage))
    const qs = params.toString()
    return `/shop${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">One-of-one pairs</p>
          <h1 className="mt-2 font-serif text-5xl font-black">
            {filters.q ? `Results for "${filters.q}"` : filters.category ?? "Shop all shoes"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Every pair is individually inspected, cleaned and listed with its exact size and condition.
          </p>
        </div>
        <p className="text-sm font-bold">{total} unique pairs</p>
      </div>

      <div className="flex flex-col gap-8 py-6 md:flex-row md:gap-10">
        <ShopFilters brands={facets.brands} sizes={facets.sizes} />

        <div className="flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-6">
            {products.length === 0 ? (
              <p className="col-span-full py-16 text-center text-muted-foreground">No pairs match these filters yet.</p>
            ) : (
              products.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>

          {totalPages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              <Link
                href={pageHref(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`flex h-10 min-w-10 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-foreground"}`}
              >
                Prev
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  className={`flex h-10 min-w-10 items-center justify-center border px-3 text-xs font-bold ${p === page ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                >
                  {p}
                </Link>
              ))}
              <Link
                href={pageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`flex h-10 min-w-10 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-foreground"}`}
              >
                Next
              </Link>
            </nav>
          )}
        </div>
      </div>
    </section>
  )
}