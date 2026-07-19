"use client"

import { Heart } from "lucide-react"
import { toast } from "sonner"
import { useWishlist } from "@/components/wishlist-provider"
import type { Product } from "@/lib/store-data"

export function WishlistHeartButton({ product, className = "" }: { product: Product; className?: string }) {
  const { isWishlisted, toggleWishlist, isSignedIn } = useWishlist()
  const active = isWishlisted(product.id)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    if (!isSignedIn) {
      toast(active ? "Removed from wishlist" : "Saved on this device — sign in to keep it across devices", { duration: 3500 })
    } else {
      toast.success(active ? "Removed from wishlist" : "Added to wishlist")
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      className={`flex size-9 items-center justify-center rounded-full bg-background/90 backdrop-blur transition-transform hover:scale-105 ${className}`}
    >
      <Heart size={17} className={active ? "fill-primary text-primary" : "text-foreground"} />
    </button>
  )
}
