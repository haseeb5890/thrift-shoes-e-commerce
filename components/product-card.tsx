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
  return <article className="group"><div className="relative aspect-square overflow-hidden bg-secondary @container"><Link href={`/shop/${product.slug}`}><Image src={product.imageUrl} alt={product.imageAlt} fill className={`object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "opacity-50 grayscale" : ""}`} sizes="(max-width: 768px) 50vw, 25vw"/></Link>{soldOut && <span className="absolute left-[4cqw] top-[4cqw] rounded-sm bg-background/80 px-[2.5cqw] py-[1.3cqw] text-[clamp(9px,3cqw,11px)] font-bold uppercase tracking-wider">Sold</span>}<div className="absolute right-[4cqw] top-[4cqw]"><WishlistHeartButton product={product} className="flex size-[clamp(24px,9cqw,36px)] items-center justify-center rounded-full bg-background/75 transition-transform hover:scale-105" iconClassName="size-[55%]"/></div>{!soldOut && <button onClick={() => addToCart(product)} className="absolute bottom-[4cqw] right-[4cqw] flex size-[clamp(20px,7.5cqw,30px)] items-center justify-center rounded-full bg-accent/85 text-accent-foreground transition-transform hover:scale-105" aria-label={`Add ${product.name} to cart`}><Plus size="55%"/></button>}</div><Link href={`/shop/${product.slug}`} className="mt-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{product.brand} · {product.size} · {product.condition}</p><h3 className="mt-1 font-product text-base font-bold">{product.name}</h3><p className="mt-1 text-sm font-bold">{formatPKR(product.price)} {product.compareAtPrice && <span className="ml-1 font-normal text-muted-foreground line-through">{formatPKR(product.compareAtPrice)}</span>}</p></div><ArrowUpRight className="mt-1 shrink-0" size={18}/></Link></article>
}
