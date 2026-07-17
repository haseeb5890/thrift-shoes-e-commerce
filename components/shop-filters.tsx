"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { TYPES, GENDERS, CONDITIONS } from "@/lib/product-options"

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
]

export function ShopFilters({ brands, sizes }: { brands: string[]; sizes: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "")

  function updateParams(updates: Record<string, string>, options: { resetPage?: boolean } = { resetPage: true }) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    if (options.resetPage) params.delete("page")
    router.push(`/shop?${params.toString()}`)
  }

  function updateParam(key: string, value: string) {
    updateParams({ [key]: value })
  }

  function applyPriceRange() {
    updateParams({ minPrice, maxPrice })
  }

  function clearAll() {
    setMinPrice("")
    setMaxPrice("")
    router.push("/shop")
  }

  const select = "h-11 w-full border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider"
  const label = "mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground"

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-border pb-8 md:w-56 md:shrink-0 md:border-b-0 md:border-r md:pb-0 md:pr-6">
      <div>
        <label className={label}>Sort by</label>
        <select
          className={select}
          value={searchParams.get("sort") ?? "latest"}
          onChange={(e) => updateParam("sort", e.target.value === "latest" ? "" : e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Type</label>
        <select className={select} value={searchParams.get("category") ?? ""} onChange={(e) => updateParam("category", e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div>
        <label className={label}>Gender</label>
        <select className={select} value={searchParams.get("gender") ?? ""} onChange={(e) => updateParam("gender", e.target.value)}>
          <option value="">All genders</option>
          {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label className="block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Condition</label>
          <Link href="/condition-guide" className="text-[10px] font-bold uppercase tracking-wider text-primary underline underline-offset-2">
            What do these mean?
          </Link>
        </div>
        <select className={select} value={searchParams.get("condition") ?? ""} onChange={(e) => updateParam("condition", e.target.value)}>
          <option value="">All conditions</option>
          {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
        </select>
      </div>

      <div>
        <label className={label}>Brand</label>
        <select className={select} value={searchParams.get("brand") ?? ""} onChange={(e) => updateParam("brand", e.target.value)}>
          <option value="">All brands</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>
      </div>

      <div>
        <label className={label}>Size</label>
        <select className={select} value={searchParams.get("size") ?? ""} onChange={(e) => updateParam("size", e.target.value)}>
          <option value="">All sizes</option>
          {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>

      <div>
        <label className={label}>Price range (PKR)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
            className="h-11 w-full border border-border bg-card px-3 text-xs"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={applyPriceRange}
            onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
            className="h-11 w-full border border-border bg-card px-3 text-xs"
          />
        </div>
      </div>

      {searchParams.toString() && (
        <button onClick={clearAll} className="h-11 border border-foreground px-4 text-xs font-bold uppercase tracking-wider">
          Clear all
        </button>
      )}
    </aside>
  )
}