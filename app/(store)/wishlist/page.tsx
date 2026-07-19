"use client"

import Link from "next/link"
import { useWishlist } from "@/components/wishlist-provider"
import { ProductCard } from "@/components/product-card"
import { formatPKR } from "@/lib/store-data"

export default function WishlistPage() {
  const { items, isSignedIn, loading } = useWishlist()

  if (loading) {
    return <section className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-muted-foreground">Loading your wishlist...</section>
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Saved pairs</p>
      <h1 className="mt-2 font-serif text-5xl font-black">Your wishlist.</h1>

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
