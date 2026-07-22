import type { Metadata } from "next"
import { ShopControls } from "@/components/shop-controls"
import { FilterAccordionSections } from "@/components/filter-accordion-sections"
import { ProductGrid } from "@/components/product-grid"
import { getFacetedFilterCounts, getProducts, type ProductFilters } from "@/lib/products"

export const metadata: Metadata = { title: "Shop all shoes" }

export default async function ShopPage({ searchParams }: { searchParams: Promise<ProductFilters> }) {
  const filters = await searchParams
  const [result, facets] = await Promise.all([getProducts(filters), getFacetedFilterCounts(filters)])
  const { products, total, totalPages } = result
  const view = filters.view === "list" ? "list" : "grid"

  return (
    <section className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 px-4 pb-12 pt-10 duration-500 md:px-6 md:py-16">
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">One-of-one pairs</p>
          <h1 className="mt-2 font-serif text-3xl font-black md:text-5xl">
            {filters.q ? `Results for "${filters.q}"` : filters.category ?? "Shop all shoes"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Every pair is individually inspected, cleaned and listed with its exact size and condition.
          </p>
        </div>
        <p className="text-sm font-bold">{total} unique pairs</p>
      </div>

      <ShopControls facets={facets} />

      <div className="flex flex-col gap-8 py-6 md:flex-row md:gap-10">
        <aside className="hidden md:block md:w-48 md:shrink-0">
          <FilterAccordionSections facets={facets} />
        </aside>

        <div className="flex-1">
          {products.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No pairs match these filters yet.</p>
          ) : (
            <ProductGrid initialProducts={products} filters={filters} totalPages={totalPages} view={view} />
          )}
        </div>
      </div>
    </section>
  )
}
