"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Filter as FilterIcon, LayoutGrid, Rows3 } from "lucide-react"

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
    <div className="flex items-center gap-2 border-b border-border py-4">
      <div className="flex flex-1 items-center md:hidden">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground"
        >
          <FilterIcon size={15} />
          Filter
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-5 md:mr-auto">
        <button
          type="button"
          onClick={() => updateParam("view", "list")}
          aria-label="List view"
          aria-pressed={view === "list"}
          className={`flex items-center transition-colors ${view === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Rows3 size={17} strokeWidth={view === "list" ? 2.75 : 2} />
        </button>
        <button
          type="button"
          onClick={() => updateParam("view", "grid")}
          aria-label="Grid view"
          aria-pressed={view === "grid"}
          className={`flex items-center transition-colors ${view === "grid" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <LayoutGrid size={17} strokeWidth={view === "grid" ? 2.75 : 2} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 justify-end md:flex-none">
        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="h-8 w-full min-w-0 max-w-28 cursor-pointer truncate border-0 bg-transparent text-xs font-bold uppercase tracking-wider text-foreground outline-none md:w-auto md:max-w-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
