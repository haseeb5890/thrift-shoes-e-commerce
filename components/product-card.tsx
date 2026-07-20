"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Plus } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { WishlistHeartButton } from "@/components/wishlist-heart-button"
import { formatPKR, type Product } from "@/lib/store-data"

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore()
  const soldOut = product.stock <= 0
  return <article className="group"><div className="relative aspect-square overflow-hidden bg-secondary"><Link href={`/shop/${product.slug}`}><Image src={product.imageUrl} alt={product.imageAlt} fill className={`object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "opacity-50 grayscale" : ""}`} sizes="(max-width: 768px) 50vw, 25vw"/></Link><span className="absolute left-3 top-3 bg-background px-2 py-1 text-[10px] font-bold uppercase tracking-wider">{soldOut ? "Sold" : product.condition}</span><div className="absolute right-3 top-3"><WishlistHeartButton product={product}/></div>{!soldOut && <button onClick={() => addToCart(product)} className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105" aria-label={`Add ${product.name} to cart`}><Plus size={18}/></button>}</div><Link href={`/shop/${product.slug}`} className="mt-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.brand} · {product.size}</p><h3 className="mt-1 font-product text-base font-bold">{product.name}</h3><p className="mt-1 text-sm font-bold">{formatPKR(product.price)} {product.compareAtPrice && <span className="ml-1 font-normal text-muted-foreground line-through">{formatPKR(product.compareAtPrice)}</span>}</p></div><ArrowUpRight className="mt-1 shrink-0" size={18}/></Link></article>
}
