"use client"

import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { useStore } from "@/components/store-provider"
import { formatPKR } from "@/lib/store-data"

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart } = useStore()
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0)
  if (!cartOpen) return null
  return <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-foreground/40" onClick={() => setCartOpen(false)} aria-label="Close cart"/><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Your rotation</p><h2 className="font-serif text-3xl font-black">Shopping bag</h2></div><button onClick={() => setCartOpen(false)} aria-label="Close cart"><X/></button></div><div className="flex flex-1 flex-col gap-4 overflow-y-auto py-5">{cart.length === 0 ? <div className="m-auto text-center"><p className="font-serif text-2xl font-bold">Your bag is empty</p><button onClick={() => setCartOpen(false)} className="mt-4 text-sm font-bold underline">Keep browsing</button></div> : cart.map((item) => <div key={item.id} className="flex gap-4"><div className="relative size-24 shrink-0 bg-secondary"><Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover"/></div><div className="flex flex-1 flex-col"><p className="text-xs uppercase text-muted-foreground">{item.brand} · {item.size}</p><p className="font-serif text-lg font-bold">{item.name}</p><p className="mt-auto text-sm font-bold">{formatPKR(item.price)}</p></div><button onClick={() => removeFromCart(item.id)} className="self-start text-xs underline">Remove</button></div>)}</div>{cart.length > 0 && <div className="border-t border-border pt-5"><div className="mb-4 flex justify-between font-bold"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div><p className="mb-4 text-xs text-muted-foreground">Shipping is calculated from your city at checkout.</p><Link href="/checkout" onClick={() => setCartOpen(false)} className="flex h-12 items-center justify-center bg-primary font-bold text-primary-foreground">Checkout securely</Link></div>}</aside></div>
}
