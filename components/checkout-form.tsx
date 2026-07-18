"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { createOrder } from "@/app/actions/orders"
import { useStore } from "@/components/store-provider"
import { cities, formatPKR, shippingRates } from "@/lib/store-data"

const field = "h-12 border border-input bg-card px-3 text-sm outline-none focus:border-primary"
export function CheckoutForm() {
  const { cart, clearCart } = useStore()
  const [city, setCity] = useState("Karachi")
  const [payment, setPayment] = useState<"cod"|"bank">("cod")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ orderNumber: string; total: number; paymentMethod: string } | null>(null)
  const [error, setError] = useState("")
  const subtotal = cart.reduce((sum,item)=>sum+item.price,0)
  const shipping = shippingRates[city] ?? shippingRates.Other
  async function submit(formData: FormData) {
    setLoading(true); setError("")

    const orderPromise = createOrder({ customerName: String(formData.get("name")), email: String(formData.get("email")), phone: String(formData.get("phone")), city, addressLine: String(formData.get("address")), postalCode: String(formData.get("postal") ?? ""), paymentMethod: payment, notes: String(formData.get("notes") ?? ""), shippingFee: shipping, items: cart.map(({id,name,size,price,imageUrl})=>({id,name,size,price,imageUrl})) }).then((order) => {
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
      setResult(order)
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please check your details. Use a Pakistan mobile number such as 03001234567.")
    } finally {
      setLoading(false)
    }
  }
  if (result) { const message = encodeURIComponent(`Assalam o Alaikum, I have placed Prime Soles order ${result.orderNumber} for ${formatPKR(result.total)} and selected bank transfer. Please share the confirmation steps.`); return <div className="mx-auto max-w-2xl px-4 py-20 text-center"><p className="text-xs font-bold uppercase tracking-widest text-primary">Order received</p><h1 className="mt-3 text-5xl font-black">Your pair is reserved.</h1><p className="mt-5 text-muted-foreground">Order <strong className="text-foreground">{result.orderNumber}</strong> · {formatPKR(result.total)}</p><p className="mt-3 font-bold text-primary">Please check your email for order confirmation!</p>{result.paymentMethod === "bank" && <a href={`https://wa.me/923001234567?text=${message}`} target="_blank" rel="noreferrer" className="mx-auto mt-8 flex h-12 w-fit items-center bg-accent px-6 font-bold text-accent-foreground">Confirm on WhatsApp</a>}<Link href="/track" className="mt-6 block text-sm font-bold underline">Track your order</Link></div> }
  if (!cart.length) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-4xl font-black">Nothing to check out yet.</h1><Link href="/shop" className="mt-6 inline-flex h-12 items-center bg-primary px-6 font-bold text-primary-foreground">Browse unique pairs</Link></div>
  return <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1fr_0.75fr] md:px-6 md:py-16"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Secure checkout</p><h1 className="mt-2 text-5xl font-black">Delivery details</h1><form action={submit} className="mt-8 grid gap-4 sm:grid-cols-2"><input className={field} name="name" placeholder="Full name" required/><input className={field} name="phone" placeholder="03XXXXXXXXX" inputMode="tel" required/><input className={`${field} sm:col-span-2`} type="email" name="email" placeholder="Email address" required/><select className={field} value={city} onChange={(e)=>setCity(e.target.value)}>{cities.map((item)=><option key={item}>{item}</option>)}</select><input className={field} name="postal" placeholder="Postal code (optional)"/><textarea className="min-h-28 border border-input bg-card p-3 text-sm outline-none focus:border-primary sm:col-span-2" name="address" placeholder="Complete delivery address" required/><textarea className="min-h-20 border border-input bg-card p-3 text-sm outline-none focus:border-primary sm:col-span-2" name="notes" placeholder="Delivery notes (optional)"/><fieldset className="grid gap-3 sm:col-span-2"><legend className="mb-2 font-bold">Payment method</legend><label className={`border p-4 ${payment === "cod" ? "border-primary" : "border-border"}`}><input type="radio" className="mr-3" checked={payment === "cod"} onChange={()=>setPayment("cod")}/>Cash on delivery</label><label className={`border p-4 ${payment === "bank" ? "border-primary" : "border-border"}`}><input type="radio" className="mr-3" checked={payment === "bank"} onChange={()=>setPayment("bank")}/>Bank transfer · confirm via WhatsApp</label></fieldset>{error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}<button disabled={loading} className="h-14 bg-primary font-bold text-primary-foreground sm:col-span-2">{loading ? "Placing order..." : `Place order · ${formatPKR(subtotal + shipping)}`}</button></form></div><aside className="h-fit bg-secondary p-5 md:sticky md:top-24"><h2 className="font-serif text-2xl font-black">Order summary</h2><div className="mt-5 flex flex-col gap-4">{cart.map((item)=><div key={item.id} className="flex gap-3"><div className="relative size-20 bg-background"><Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover"/></div><div><p className="font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.size} · {item.condition}</p><p className="mt-2 text-sm font-bold">{formatPKR(item.price)}</p></div></div>)}</div><div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div><div className="flex justify-between"><span>Shipping to {city}</span><span>{formatPKR(shipping)}</span></div><div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span>{formatPKR(subtotal+shipping)}</span></div></div></aside></div>
}
