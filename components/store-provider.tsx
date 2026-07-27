"use client"

import { createContext, useContext, useMemo, useState } from "react"
import { trackPixelEvent } from "@/lib/meta-pixel"
import type { Product } from "@/lib/store-data"

type CartItem = Product & { quantity: number }
type StoreContextValue = { cart: CartItem[]; addToCart: (product: Product) => void; removeFromCart: (id: string) => void; clearCart: () => void; cartCount: number; cartOpen: boolean; setCartOpen: (open: boolean) => void }
const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const value = useMemo(() => ({
    cart,
    addToCart: (product: Product) => {
      // Checked against this render's `cart` (addToCart is recreated whenever cart changes, so
      // this is fresh) rather than inside the setCart updater — React 18 StrictMode double-
      // invokes updater functions in dev, which would double-fire a side effect placed there.
      if (!cart.some((item) => item.id === product.id)) {
        trackPixelEvent("AddToCart", { content_ids: [product.id], content_name: product.name, content_type: "product", value: product.price, currency: "PKR" })
      }
      setCart((items) => (items.some((item) => item.id === product.id) ? items : [...items, { ...product, quantity: 1 }]))
      setCartOpen(true)
    },
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
