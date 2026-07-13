import type { Metadata } from "next"
import { StoreShell } from "@/components/store-shell"
import { ProductCard } from "@/components/product-card"
import { getProducts } from "@/lib/products"

export const metadata: Metadata = { title: "Shop all shoes" }
export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const products = await getProducts()
  const filtered = category ? products.filter((product) => product.category === category) : products
  return <StoreShell><section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16"><div className="flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">One-of-one pairs</p><h1 className="mt-2 font-serif text-5xl font-black">{category ?? "Shop all shoes"}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Every pair is individually inspected, cleaned and listed with its exact size and condition.</p></div><p className="text-sm font-bold">{filtered.length} unique pairs</p></div><div className="flex gap-3 overflow-x-auto py-6 text-xs font-bold uppercase tracking-wider"><a href="/shop" className="border border-foreground px-4 py-2">All</a>{["Runners","Court","Trail"].map((item)=><a key={item} href={`/shop?category=${item}`} className="border border-border px-4 py-2">{item}</a>)}</div><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">{filtered.map((product)=><ProductCard key={product.id} product={product}/>)}</div></section></StoreShell>
}
