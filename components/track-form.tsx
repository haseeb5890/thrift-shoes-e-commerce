"use client"

import { useState } from "react"
import { trackOrder } from "@/app/actions/tracking"
import { OrderStatusTimeline } from "@/components/order-status-timeline"
import { formatPKR } from "@/lib/store-data"

type Result = Awaited<ReturnType<typeof trackOrder>>
export function TrackForm() {
  const [result,setResult] = useState<Result | undefined>()
  const [loading,setLoading] = useState(false)
  async function submit(formData: FormData) { setLoading(true); setResult(await trackOrder(String(formData.get("order")),String(formData.get("phone")))); setLoading(false) }
  return <section className="mx-auto max-w-2xl px-4 py-20 md:px-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">Pakistan-wide delivery</p><h1 className="mt-3 font-serif text-5xl font-black">Track your pair</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Enter the order number from your confirmation and the phone number used at checkout.</p><form action={submit} className="mt-8 flex flex-col gap-3 sm:flex-row"><input name="order" required placeholder="RLP-1234567" className="h-12 flex-1 border border-input bg-card px-3 uppercase outline-none focus:border-primary"/><input name="phone" required placeholder="03XXXXXXXXX" className="h-12 flex-1 border border-input bg-card px-3 outline-none focus:border-primary"/><button className="h-12 bg-primary px-6 font-bold text-primary-foreground">{loading ? "Checking..." : "Track order"}</button></form>{result === null && <p role="alert" className="mt-6 border border-destructive p-4 text-sm">We could not find an order matching those details.</p>}{result && <div className="mt-8 bg-secondary p-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">{result.orderNumber}</p><div className="mt-5"><OrderStatusTimeline status={result.status}/></div><div className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Payment</p><p className="font-bold capitalize">{result.paymentStatus}</p></div><div><p className="text-muted-foreground">Total</p><p className="font-bold">{formatPKR(result.total)}</p></div><div><p className="text-muted-foreground">Destination</p><p className="font-bold">{result.city}</p></div><div><p className="text-muted-foreground">Tracking</p><p className="font-bold">{result.trackingNumber ?? "Assigned after dispatch"}</p></div></div></div>}</section>
}