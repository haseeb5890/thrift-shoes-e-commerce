"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { createOrder } from "@/app/actions/orders"
import { validatePromoCode } from "@/app/actions/promos"
import { useStore } from "@/components/store-provider"
import { trackPixelEvent } from "@/lib/meta-pixel"
import { cities, formatPKR, getDeliveryWindow, shippingRates } from "@/lib/store-data"

const field = "h-12 border border-input bg-card px-3 text-sm outline-none focus:border-primary"
export function CheckoutForm() {
  const { cart, clearCart } = useStore()
  const [city, setCity] = useState("Karachi")
  const [payment, setPayment] = useState<"cod"|"bank">("cod")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ orderNumber: string; total: number; paymentMethod: string } | null>(null)
  const [error, setError] = useState("")
  const [promoInput, setPromoInput] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number; discountAmount: number } | null>(null)
  const [promoError, setPromoError] = useState("")
  const [promoPending, startPromoTransition] = useTransition()
  const subtotal = cart.reduce((sum,item)=>sum+item.price*item.quantity,0)
  const shipping = shippingRates[city] ?? shippingRates.Other
  const discount = appliedPromo?.discountAmount ?? 0

  // Fires once per checkout visit, as soon as there's actually something to check out — a ref
  // guard rather than an empty-deps effect because the cart can still be loading on first paint.
  const firedInitiateCheckoutRef = useRef(false)
  useEffect(() => {
    if (firedInitiateCheckoutRef.current || cart.length === 0) return
    firedInitiateCheckoutRef.current = true
    trackPixelEvent("InitiateCheckout", {
      content_ids: cart.map((item) => item.id),
      contents: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
      num_items: cart.reduce((sum, item) => sum + item.quantity, 0),
      value: subtotal,
      currency: "PKR",
    })
  }, [cart, subtotal])

  function applyPromo() {
    setPromoError("")
    startPromoTransition(async () => {
      const promoResult = await validatePromoCode(promoInput, subtotal)
      if ("error" in promoResult) {
        setPromoError(promoResult.error)
        setAppliedPromo(null)
      } else {
        setAppliedPromo(promoResult)
        toast.success(`Promo ${promoResult.code} applied — ${promoResult.discountPercent}% off`)
      }
    })
  }

  function removePromo() {
    setAppliedPromo(null)
    setPromoInput("")
    setPromoError("")
  }

  async function submit(formData: FormData) {
    setLoading(true); setError("")

    const orderPromise = createOrder({ customerName: String(formData.get("name")), email: String(formData.get("email")), phone: String(formData.get("phone")), city, addressLine: String(formData.get("address")), postalCode: String(formData.get("postal") ?? ""), paymentMethod: payment, notes: String(formData.get("notes") ?? ""), shippingFee: shipping, promoCode: appliedPromo?.code, items: cart.map(({id,slug,name,size,price,imageUrl})=>({id,slug,name,size,price,imageUrl})) }).then((order) => {
      if ("error" in order) throw new Error(order.error)
      return order
    })

    toast.promise(orderPromise, {
      loading: "Processing your order...",
      success: (order) => `Order ${order.orderNumber} placed — your pair is reserved.`,
      error: (err) => (err instanceof Error ? err.message : "Please check your details and try again."),
    })

    try {
      const order = await orderPromise
      // Read cart items before clearCart() empties it — value/content_ids need to reflect what
      // was actually purchased. The order number as eventId lets the server-side Conversions
      // API call (sent from this same order in app/actions/orders.ts) dedupe against this one.
      trackPixelEvent(
        "Purchase",
        {
          content_ids: cart.map((item) => item.id),
          contents: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          num_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          value: order.total,
          currency: "PKR",
        },
        order.orderNumber,
      )
      setResult(order)
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please check your details. Use a Pakistan mobile number such as 03001234567.")
    } finally {
      setLoading(false)
    }
  }
  if (result) { const message = encodeURIComponent(`Assalam o Alaikum, I have placed PrimeSoles order ${result.orderNumber} for ${formatPKR(result.total)} and selected bank transfer. Please share the confirmation steps.`); return <div className="animate-in fade-in-0 slide-in-from-bottom-2 mx-auto max-w-2xl px-4 py-20 text-center duration-300"><p className="text-xs font-bold uppercase tracking-widest text-primary">Order received</p><h1 className="mt-3 font-serif text-3xl font-black md:text-5xl">Your pair is reserved.</h1><p className="mt-5 text-muted-foreground">Order <strong className="text-foreground">{result.orderNumber}</strong> · {formatPKR(result.total)}</p><p className="mt-2 text-sm font-bold text-primary">Delivered by: {getDeliveryWindow(new Date())}</p>{result.paymentMethod === "bank" && <a href={`https://wa.me/923413907007?text=${message}`} target="_blank" rel="noreferrer" className="mx-auto mt-8 flex h-12 w-fit items-center bg-accent px-6 font-bold text-accent-foreground">Confirm on WhatsApp</a>}<Link href="/track" className="mt-6 block text-sm font-bold underline">Track your order</Link></div> }
  if (!cart.length) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-4xl font-black">Nothing to check out yet.</h1><Link href="/shop" className="mt-6 inline-flex h-12 items-center bg-primary px-6 font-bold text-primary-foreground">Browse unique pairs</Link></div>
  return <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1fr_0.75fr] md:px-6 md:py-16"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Secure checkout</p><h1 className="mt-2 font-serif text-3xl font-black md:text-5xl">Delivery details</h1><div className="relative"><form action={submit} className="mt-8 grid gap-4 sm:grid-cols-2"><fieldset disabled={loading} className="contents"><input className={field} name="name" placeholder="Full name" required/><input className={field} name="phone" placeholder="03XXXXXXXXX" inputMode="tel" required/><input className={`${field} sm:col-span-2`} type="email" name="email" placeholder="Email address" required/><select className={field} value={city} onChange={(e)=>setCity(e.target.value)}>{cities.map((item)=><option key={item}>{item}</option>)}</select><input className={field} name="postal" placeholder="Postal code (optional)"/><textarea className="min-h-28 border border-input bg-card p-3 text-sm outline-none focus:border-primary sm:col-span-2" name="address" placeholder="Complete delivery address" required/><textarea className="min-h-20 border border-input bg-card p-3 text-sm outline-none focus:border-primary sm:col-span-2" name="notes" placeholder="Delivery notes (optional)"/><fieldset className="grid gap-3 sm:col-span-2"><legend className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Payment method</legend><label className={`border p-4 ${payment === "cod" ? "border-primary" : "border-border"}`}><input type="radio" className="mr-3 accent-primary" checked={payment === "cod"} onChange={()=>setPayment("cod")}/>Cash on delivery</label><label className={`border p-4 ${payment === "bank" ? "border-primary" : "border-border"}`}><input type="radio" className="mr-3 accent-primary" checked={payment === "bank"} onChange={()=>setPayment("bank")}/>Bank transfer · confirm via WhatsApp</label></fieldset>{error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}<button disabled={loading} className="h-14 bg-primary font-bold text-primary-foreground sm:col-span-2">{loading ? "Placing order..." : `Place order · ${formatPKR(subtotal + shipping - discount)}`}</button></fieldset></form>{loading && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm"><span className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" /><p className="text-sm font-bold uppercase tracking-widest text-primary">Checking out...</p><p className="text-xs text-muted-foreground">Reserving your pair, please don&apos;t close this page.</p></div>}</div></div><aside className="h-fit bg-secondary p-5 md:sticky md:top-24"><h2 className="font-serif text-2xl font-black">Order summary</h2><div className="mt-5 flex flex-col gap-4">{cart.map((item)=><div key={item.id} className="flex gap-3"><div className="relative size-20 bg-background"><Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover"/></div><div><p className="font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.size} · {item.condition}</p><p className="mt-2 text-sm font-bold">{formatPKR(item.price)}</p></div></div>)}</div><div className="mt-6 border-t border-border pt-5">{appliedPromo ? <div className="flex items-center justify-between bg-background px-3 py-2 text-sm"><span className="font-bold text-accent">{appliedPromo.code} applied · {appliedPromo.discountPercent}% off</span><button type="button" onClick={removePromo} className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline">Remove</button></div> : <div className="flex gap-2"><input className={`${field} h-11 flex-1 uppercase`} placeholder="Promo code" value={promoInput} onChange={(e)=>{setPromoInput(e.target.value); setPromoError("")}} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault(); applyPromo()}}}/><button type="button" disabled={promoPending || !promoInput.trim()} onClick={applyPromo} className="h-11 shrink-0 bg-foreground px-4 text-xs font-bold uppercase tracking-wider text-background disabled:opacity-50">{promoPending ? "Checking..." : "Apply"}</button></div>}{promoError && <p role="alert" className="mt-2 text-xs text-destructive">{promoError}</p>}</div><div className="mt-4 flex flex-col gap-2 border-t border-border pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div><div className="flex justify-between"><span>Shipping to {city}</span><span>{formatPKR(shipping)}</span></div>{appliedPromo && <div className="flex justify-between text-accent"><span>Discount ({appliedPromo.code})</span><span>−{formatPKR(discount)}</span></div>}<div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatPKR(subtotal+shipping-discount)}</span></div></div></aside></div>
}
