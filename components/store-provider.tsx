"use client"

import { createContext, useContext, useMemo, useState } from "react"
import type { Product } from "@/lib/store-data"

type CartItem = Product & { quantity: number }
type StoreContextValue = { cart: CartItem[]; addToCart: (product: Product) => void; removeFromCart: (id: string) => void; clearCart: () => void; cartCount: number; cartOpen: boolean; setCartOpen: (open: boolean) => void }
const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const value = useMemo(() => ({
    cart,
    addToCart: (product: Product) => { setCart((items) => items.some((item) => item.id === product.id) ? items : [...items, { ...product, quantity: 1 }]); setCartOpen(true) },
    removeFromCart: (id: string) => setCart((items) => items.filter((item) => item.id !== id)),
    clearCart: () => setCart([]),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    cartOpen,
    setCartOpen,
  }), [cart, cartOpen])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}
