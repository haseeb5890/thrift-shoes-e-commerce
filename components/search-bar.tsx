"use client"

import { Search } from "lucide-react"
import { useSearchPanel } from "@/components/search-provider"

export function SearchBar() {
  const { setSearchOpen } = useSearchPanel()
  return <button onClick={() => setSearchOpen(true)} aria-label="Search products by name or size"><Search size={20} /></button>
}
