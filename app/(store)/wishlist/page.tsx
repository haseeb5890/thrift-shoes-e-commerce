"use client"

import Link from "next/link"
import { useWishlist } from "@/components/wishlist-provider"
import { ProductCard } from "@/components/product-card"
import { formatPKR } from "@/lib/store-data"

export default function WishlistPage() {
  const { items, isSignedIn, loading } = useWishlist()

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 md:px-6 md:py-16">
        <div className="h-3 w-24 animate-pulse bg-secondary" />
        <div className="mt-2 h-9 w-56 animate-pulse bg-secondary md:h-12" />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-secondary" />
              <div className="mt-4 h-3 w-20 bg-secondary" />
              <div className="mt-2 h-5 w-32 bg-secondary" />
              <div className="mt-2 h-4 w-16 bg-secondary" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 px-4 pb-12 pt-10 duration-500 md:px-6 md:py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Saved pairs</p>
      <h1 className="mt-2 font-serif text-3xl font-black md:text-5xl">Your wishlist.</h1>

      {!isSignedIn && items.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Saved on this device only.{" "}
          <Link href="/sign-in" className="font-bold text-foreground underline">Sign in</Link> to keep it across devices and get notified of price drops.
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Nothing saved yet. Tap the heart on any pair to add it here.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {items.map((item) => (
            <div key={item.id}>
              {isSignedIn && item.priceAtAdd > item.price && (
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent">Price dropped from {formatPKR(item.priceAtAdd)}</p>
              )}
              <ProductCard product={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
