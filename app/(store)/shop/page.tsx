import type { Metadata } from "next"
import { ProductCard } from "@/components/product-card"
import { ShopFilters } from "@/components/shop-filters"
import { getFilterFacets, getProducts, type ProductFilters } from "@/lib/products"

export const metadata: Metadata = { title: "Shop all shoes" }
export default async function ShopPage({ searchParams }: { searchParams: Promise<ProductFilters> }) {
  const filters = await searchParams
  const [products, facets] = await Promise.all([getProducts(filters), getFilterFacets()])
  return <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16"><div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">One-of-one pairs</p><h1 className="mt-2 font-serif text-5xl font-black">{filters.q ? `Results for "${filters.q}"` : filters.category ?? "Shop all shoes"}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Every pair is individually inspected, cleaned and listed with its exact size and condition.</p></div><p className="text-sm font-bold">{products.length} unique pairs</p></div><ShopFilters brands={facets.brands} sizes={facets.sizes}/><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">{products.length === 0 ? <p className="col-span-full py-16 text-center text-muted-foreground">No pairs match these filters yet.</p> : products.map((product) => <ProductCard key={product.id} product={product}/>)}</div></section>
}
