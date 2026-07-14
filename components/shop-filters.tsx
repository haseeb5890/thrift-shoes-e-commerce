"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { TYPES, GENDERS, CONDITIONS } from "@/lib/product-options"

export function ShopFilters({ brands, sizes }: { brands: string[]; sizes: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/shop?${params.toString()}`)
  }

  const select = "h-11 border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider"
  return (
    <div className="flex flex-wrap items-center gap-3 py-6">
      <select className={select} value={searchParams.get("category") ?? ""} onChange={(e) => updateParam("category", e.target.value)}>
        <option value="">All types</option>
        {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select className={select} value={searchParams.get("gender") ?? ""} onChange={(e) => updateParam("gender", e.target.value)}>
        <option value="">All genders</option>
        {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
      </select>
      <select className={select} value={searchParams.get("condition") ?? ""} onChange={(e) => updateParam("condition", e.target.value)}>
        <option value="">All conditions</option>
        {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
      </select>
      <select className={select} value={searchParams.get("brand") ?? ""} onChange={(e) => updateParam("brand", e.target.value)}>
        <option value="">All brands</option>
        {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
      </select>
      <select className={select} value={searchParams.get("size") ?? ""} onChange={(e) => updateParam("size", e.target.value)}>
        <option value="">All sizes</option>
        {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
      </select>
      {searchParams.toString() && <button onClick={() => router.push("/shop")} className="h-11 border border-foreground px-4 text-xs font-bold uppercase tracking-wider">Clear</button>}
    </div>
  )
}
