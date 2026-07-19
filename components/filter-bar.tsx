"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { SlidersHorizontal, LayoutGrid, Rows3 } from "lucide-react"

const SORT_OPTIONS = [
  { value: "latest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
]

export function FilterBar({ onOpenFilters }: { onOpenFilters: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view = searchParams.get("view") === "list" ? "list" : "grid"
  const sort = searchParams.get("sort") ?? "latest"

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && !(key === "sort" && value === "latest") && !(key === "view" && value === "grid")) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-4">
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex h-10 items-center gap-2 border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider md:hidden"
      >
        <SlidersHorizontal size={15} />
        Filter
      </button>

      <div className="flex items-center gap-1 border border-border p-0.5">
        <button
          type="button"
          onClick={() => updateParam("view", "list")}
          aria-label="List view"
          aria-pressed={view === "list"}
          className={`flex size-9 items-center justify-center transition-colors ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Rows3 size={16} />
        </button>
        <button
          type="button"
          onClick={() => updateParam("view", "grid")}
          aria-label="Grid view"
          aria-pressed={view === "grid"}
          className={`flex size-9 items-center justify-center transition-colors ${view === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid size={16} />
        </button>
      </div>

      <select
        value={sort}
        onChange={(e) => updateParam("sort", e.target.value)}
        className="h-10 border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}