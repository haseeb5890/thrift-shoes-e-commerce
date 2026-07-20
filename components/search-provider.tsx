"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type SearchContextValue = {
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  return <SearchContext.Provider value={{ searchOpen, setSearchOpen }}>{children}</SearchContext.Provider>
}

export function useSearchPanel() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error("useSearchPanel must be used within SearchProvider")
  return ctx
}
