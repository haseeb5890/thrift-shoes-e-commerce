"use client"

import { createContext, useContext, useTransition, type ReactNode, type TransitionStartFunction } from "react"

const ShopPendingContext = createContext<{ isPending: boolean; startShopTransition: TransitionStartFunction } | null>(null)

export function ShopPendingProvider({ children }: { children: ReactNode }) {
  const [isPending, startShopTransition] = useTransition()
  return <ShopPendingContext.Provider value={{ isPending, startShopTransition }}>{children}</ShopPendingContext.Provider>
}

// Sort/filter controls live in a different subtree than the product grid, so this context is
// what lets clicking "Price: Low to High" show a loading state in the grid the instant it's
// clicked, instead of the grid just sitting frozen until the new page finishes rendering.
export function useShopPending() {
  const ctx = useContext(ShopPendingContext)
  if (!ctx) throw new Error("useShopPending must be used within ShopPendingProvider")
  return ctx
}
