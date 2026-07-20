"use client"

import { useState } from "react"
import { FilterBar } from "@/components/filter-bar"
import { FilterDrawer } from "@/components/filter-drawer"
import type { FacetCounts } from "@/lib/products"

export function ShopControls({ facets }: { facets: FacetCounts }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <FilterBar onOpenFilters={() => setDrawerOpen(true)} />
      <FilterDrawer open={drawerOpen} onOpenChange={setDrawerOpen} facets={facets} />
    </>
  )
}