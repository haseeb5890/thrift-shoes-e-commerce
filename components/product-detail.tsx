"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronLeft, ShieldCheck, Truck } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { formatPKR, type Product } from "@/lib/store-data"

type Media = { id: string; url: string; kind: string }

export function ProductDetail({ product, media }: { product: Product; media: Media[] }) {
  const { addToCart } = useStore()
  const gallery: Media[] = media.length ? media : [{ id: "cover", url: product.imageUrl, kind: "image" }]
  const [activeId, setActiveId] = useState(gallery[0].id)
  const active = gallery.find((item) => item.id === activeId) ?? gallery[0]

  return <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-14"><Link href="/shop" className="mb-6 flex items-center gap-2 text-sm font-bold"><ChevronLeft size={16}/> Back to shop</Link><div className="grid gap-8 md:grid-cols-2 md:gap-14"><div><div className="relative aspect-square bg-secondary">{active.kind === "video" ? <video src={active.url} controls className="size-full object-cover"/> : <Image src={active.url} alt={product.imageAlt} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw"/>}</div>{gallery.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto">{gallery.map((item) => <button key={item.id} onClick={() => setActiveId(item.id)} className={`relative size-16 shrink-0 overflow-hidden border-2 bg-secondary ${active.id === item.id ? "border-primary" : "border-transparent"}`} aria-label="Show media">{item.kind === "video" ? <video src={item.url} className="size-full object-cover"/> : <Image src={item.url} alt="" fill className="object-cover"/>}</button>)}</div>}</div><div className="flex flex-col justify-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{product.brand} · One pair only</p><h1 className="mt-3 font-serif text-5xl font-black leading-none">{product.name}</h1><p className="mt-5 text-2xl font-bold">{formatPKR(product.price)} {product.compareAtPrice && <span className="ml-2 text-base font-normal text-muted-foreground line-through">{formatPKR(product.compareAtPrice)}</span>}</p><div className="mt-7 grid grid-cols-2 gap-3"><div className="border border-border p-4"><p className="text-xs uppercase text-muted-foreground">Exact size</p><p className="mt-1 font-bold">{product.size}</p></div><div className="border border-border p-4"><p className="text-xs uppercase text-muted-foreground">Condition</p><p className="mt-1 font-bold">{product.condition}</p></div><div className="border border-border p-4"><p className="text-xs uppercase text-muted-foreground">Type</p><p className="mt-1 font-bold">{product.category}</p></div><div className="border border-border p-4"><p className="text-xs uppercase text-muted-foreground">Fit</p><p className="mt-1 font-bold">{product.gender}</p></div></div><div className="mt-6 border-l-2 border-primary pl-4"><p className="text-xs font-bold uppercase tracking-widest">Condition notes</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{product.conditionNotes}</p></div><button onClick={() => addToCart(product)} className="mt-8 h-14 bg-primary text-base font-bold text-primary-foreground">Add this pair to bag</button><div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-sm"><p className="flex items-center gap-3"><ShieldCheck size={19} className="text-accent"/> Authenticity and condition checked</p><p className="flex items-center gap-3"><Check size={19} className="text-accent"/> Deep-cleaned and deodorized</p><p className="flex items-center gap-3"><Truck size={19} className="text-accent"/> City-based delivery across Pakistan</p></div></div></div></section>
}
