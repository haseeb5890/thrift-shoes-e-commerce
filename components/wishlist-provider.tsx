"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Product } from "@/lib/store-data"
import { getSessionWishlist, toggleWishlistItem, syncGuestWishlist } from "@/app/actions/wishlist"

const STORAGE_KEY = "relace-guest-wishlist"

type WishlistItem = Product & { priceAtAdd: number }

type WishlistContextValue = {
  items: WishlistItem[]
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (product: Product) => void
  isSignedIn: boolean
  loading: boolean
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

function readGuestWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WishlistItem[]) : []
  } catch {
    return []
  }
}

function writeGuestWishlist(items: WishlistItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage unavailable (private browsing etc.) — silently no-op.
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const guestItems = readGuestWishlist()
      const sessionWishlist = await getSessionWishlist()
      if (cancelled) return

      if (sessionWishlist === null) {
        setItems(guestItems)
        setIsSignedIn(false)
      } else {
        const merged = guestItems.length
          ? await syncGuestWishlist(guestItems.map((item) => ({ productId: item.id, priceAtAdd: item.priceAtAdd })))
          : sessionWishlist
        if (cancelled) return
        setItems((merged ?? sessionWishlist) as WishlistItem[])
        setIsSignedIn(true)
        writeGuestWishlist([]) // now merged into the account — clear the local guest copy
      }
      setLoading(false)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  function isWishlisted(productId: string) {
    return items.some((item) => item.id === productId)
  }

  function toggleWishlist(product: Product) {
    const alreadyIn = isWishlisted(product.id)

    if (isSignedIn) {
      // Optimistic update, reconciled against the server response.
      setItems((current) => (alreadyIn ? current.filter((item) => item.id !== product.id) : [...current, { ...product, priceAtAdd: product.price }]))
      toggleWishlistItem(product.id, product.price).then((result) => {
        if ("error" in result) {
          setItems((current) =>
            alreadyIn ? [...current, { ...product, priceAtAdd: product.price }] : current.filter((item) => item.id !== product.id),
          )
        }
      })
    } else {
      setItems((current) => {
        const next = alreadyIn ? current.filter((item) => item.id !== product.id) : [...current, { ...product, priceAtAdd: product.price }]
        writeGuestWishlist(next)
        return next
      })
    }
  }

  const value = useMemo(() => ({ items, isWishlisted, toggleWishlist, isSignedIn, loading }), [items, isSignedIn, loading])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used within WishlistProvider")
  return context
}
