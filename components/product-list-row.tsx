"use client"

import Image from "next/image"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { formatPKR, type Product } from "@/lib/store-data"

export function ProductListRow({ product }: { product: Product }) {
  const { addToCart } = useStore()
  const soldOut = product.stock <= 0

  return (
    <article className="flex gap-5 border-b border-border pb-6">
      <Link href={`/shop/${product.slug}`} className="relative size-32 shrink-0 overflow-hidden bg-secondary sm:size-44">
        <Image src={product.imageUrl} alt={product.imageAlt} fill className={`object-cover ${soldOut ? "opacity-50 grayscale" : ""}`} sizes="176px" />
      </Link>
      <div className="flex flex-1 flex-col">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="font-product text-base font-bold sm:text-lg">{product.name}</h3>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          Size <span className="text-foreground">{product.size}</span>
          <span className="mx-1.5">·</span>
          Condition <span className="text-foreground">{product.condition}</span>
        </p>
        {product.description && (
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-base font-bold">
            {formatPKR(product.price)} {product.compareAtPrice && <span className="ml-2 text-sm font-normal text-muted-foreground line-through">{formatPKR(product.compareAtPrice)}</span>}
          </p>
          {!soldOut && (
            <button
              onClick={() => addToCart(product)}
              className="flex items-center gap-1.5 border border-foreground px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
