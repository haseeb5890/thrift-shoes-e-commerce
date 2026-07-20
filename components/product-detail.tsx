"use client"

import { useEffect, useRef, useState, type TouchEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronLeft, Minus, Plus, ShieldCheck, Truck } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/components/store-provider"
import { useWhatsAppMessage } from "@/components/whatsapp-provider"
import { WishlistHeartButton } from "@/components/wishlist-heart-button"
import { ShareButton } from "@/components/share-button"
import { RelatedProductsCarousel } from "@/components/related-products-carousel"
import { ProductDescription } from "@/components/product-description"
import { ProductConditionGuide } from "@/components/product-condition-guide"
import { SizeChartDialog } from "@/components/size-chart-dialog"
import { fetchRelatedProducts } from "@/app/actions/related-products"
import { formatPKR, type Product } from "@/lib/store-data"

type Media = { id: string; url: string; kind: string }

export function ProductDetail({ product, media }: { product: Product; media: Media[] }) {
  const { addToCart } = useStore()
  const { setMessage } = useWhatsAppMessage()
  const soldOut = product.stock <= 0
  const gallery: Media[] = media.length ? media : [{ id: "cover", url: product.imageUrl, kind: "image" }]
  const [activeId, setActiveId] = useState(gallery[0].id)
  const active = gallery.find((item) => item.id === activeId) ?? gallery[0]
  const [related, setRelated] = useState<Product[]>([])
  const touchStartX = useRef<number | null>(null)

  function goToOffset(offset: number) {
    const index = gallery.findIndex((item) => item.id === active.id)
    const next = gallery[index + offset]
    if (next) setActiveId(next.id)
  }

  function onGalleryTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onGalleryTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 40) return
    goToOffset(delta < 0 ? 1 : -1)
  }

  useEffect(() => {
    setMessage(`Hi! I'm interested in the ${product.name} (Size: ${product.size}). Is it still available?`)
    return () => setMessage(null) // reset to the generic message once the visitor leaves this product
  }, [product.name, product.size, setMessage])

  useEffect(() => {
    let cancelled = false
    fetchRelatedProducts(product).then((rows) => {
      if (!cancelled) setRelated(rows)
    })
    return () => {
      cancelled = true
    }
  }, [product.id])

  function handleAddToCart() {
    const promise = new Promise<void>((resolve, reject) => {
      try {
        addToCart(product)
        resolve()
      } catch {
        reject(new Error("Couldn't add this pair to your bag. Please try again."))
      }
    })

    toast.promise(promise, {
      loading: "Adding to bag...",
      success: `${product.name} (${product.size}) added to your bag`,
      error: (err) => (err instanceof Error ? err.message : "Couldn't add this pair to your bag."),
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-14">
      <Link href="/shop" className="mb-6 flex items-center gap-2 text-sm font-bold">
        <ChevronLeft size={16} /> Back to shop
      </Link>
      <div className="grid gap-8 md:grid-cols-2 md:gap-14">
        <div>
          <div
            className="relative aspect-square touch-pan-y select-none bg-secondary"
            onTouchStart={onGalleryTouchStart}
            onTouchEnd={onGalleryTouchEnd}
          >
            {active.kind === "video" ? (
              <video src={active.url} controls className="size-full object-cover" />
            ) : (
              <Image src={active.url} alt={product.imageAlt} fill priority className="pointer-events-none object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  className={`relative size-16 shrink-0 overflow-hidden border-2 bg-secondary ${active.id === item.id ? "border-primary" : "border-transparent"}`}
                  aria-label="Show media"
                >
                  {item.kind === "video" ? (
                    <video src={item.url} className="size-full object-cover" />
                  ) : (
                    <Image src={item.url} alt="" fill className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{product.brand} · {soldOut ? "Sold" : "One pair only"}</p>
          <h1 className="mt-3 font-product text-2xl font-black leading-tight md:text-3xl md:leading-tight">{product.name}</h1>
          <p className="mt-5 text-2xl font-bold">
            {formatPKR(product.price)} {product.compareAtPrice && <span className="ml-2 text-base font-normal text-muted-foreground line-through">{formatPKR(product.compareAtPrice)}</span>}
          </p>
          {!soldOut && product.stock <= 1 && <p className="mt-2 text-xs font-bold uppercase tracking-wider text-destructive">Only 1 pair available in this size!</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm font-semibold text-foreground">
              Size <span className="font-normal text-muted-foreground">{product.size}</span>
              <span className="mx-2 text-border">·</span>
              Condition <span className="font-normal text-muted-foreground">{product.condition}</span>
            </p>
            <SizeChartDialog />
          </div>
          <div className="mt-8 flex items-center gap-4">
            <button onClick={handleAddToCart} disabled={soldOut} className="h-14 flex-1 bg-primary text-base font-bold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">
              {soldOut ? "Sold out" : "Add this pair to bag"}
            </button>
            <div className="flex size-14 items-center justify-center border border-border bg-card">
              <WishlistHeartButton product={product} />
            </div>
          </div>
          <ShareButton title={product.name} text={`Check out this ${product.brand} ${product.name} on Prime Soles`} path={`/shop/${product.slug}`} className="mt-4" />
          <details className="group mt-6 border-t border-border pt-6">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-widest">
              Description
              <span className="text-muted-foreground">
                <Plus size={14} className="group-open:hidden" />
                <Minus size={14} className="hidden group-open:block" />
              </span>
            </summary>
            <div className="mt-3">
              <ProductDescription description={product.description} />
            </div>
          </details>
          <details className="group mt-2 border-t border-border pt-6">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold uppercase tracking-widest">
              Condition guide
              <span className="text-muted-foreground">
                <Plus size={14} className="group-open:hidden" />
                <Minus size={14} className="hidden group-open:block" />
              </span>
            </summary>
            <div className="mt-3">
              <ProductConditionGuide condition={product.condition} />
            </div>
          </details>
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-sm">
            <p className="flex items-center gap-3"><ShieldCheck size={19} className="text-accent" /> Authenticity and condition checked</p>
            <p className="flex items-center gap-3"><Check size={19} className="text-accent" /> Deep-cleaned and deodorized</p>
            <p className="flex items-center gap-3"><Truck size={19} className="text-accent" /> City-based delivery across Pakistan</p>
          </div>
        </div>
      </div>
      <RelatedProductsCarousel products={related} />
    </section>
  )
}