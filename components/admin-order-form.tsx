"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Search, X } from "lucide-react"
import { createAdminOrder } from "@/app/actions/orders"
import { searchAdminProducts } from "@/app/actions/products"
import { cities, formatPKR } from "@/lib/store-data"
import type { Product } from "@/lib/store-data"

type SelectedItem = Product & { soldPrice: number }

const field = "h-11 border border-input bg-card px-3 text-sm outline-none focus:border-primary"

export function AdminOrderForm() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [items, setItems] = useState<SelectedItem[]>([])
  const [city, setCity] = useState("Karachi")
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("bank")
  const [shippingFee, setShippingFee] = useState("0")
  const [advancePaid, setAdvancePaid] = useState("0")
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchAdminProducts(query).then(setResults)
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function addItem(product: Product) {
    if (items.some((item) => item.id === product.id)) return
    setItems((prev) => [...prev, { ...product, soldPrice: product.price }])
    setQuery("")
    setResults([])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function updateItemPrice(id: string, price: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, soldPrice: Number(price) } : item)))
  }

  const subtotal = items.reduce((sum, item) => sum + item.soldPrice, 0)
  const total = subtotal + (Number(shippingFee) || 0)
  const balanceDue = total - (Number(advancePaid) || 0)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error("Add at least one product.")
      return
    }
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createAdminOrder({
        customerName: String(formData.get("name")),
        email: String(formData.get("email")),
        phone: String(formData.get("phone")),
        city,
        addressLine: String(formData.get("address")),
        postalCode: String(formData.get("postal") ?? ""),
        paymentMethod,
        notes: String(formData.get("notes") ?? ""),
        shippingFee: Number(shippingFee) || 0,
        advancePaid: Number(advancePaid) || 0,
        items: items.map(({ id, slug, name, size, imageUrl, soldPrice }) => ({ id, slug, name, size, price: soldPrice, imageUrl })),
      })
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`Order ${result.orderNumber} recorded`)
      router.push(`/admin/orders`)
    })
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-8 pb-10">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Products sold</p>
        <div className="relative">
          <div className="flex items-center gap-2 border border-input bg-card px-3">
            <Search size={16} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, brand, or size..."
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full border border-border bg-background shadow-lg">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addItem(product)}
                  className="flex w-full items-center gap-3 border-b border-border p-2 text-left last:border-0 hover:bg-secondary"
                >
                  <div className="relative size-12 shrink-0 bg-secondary">
                    <Image src={product.imageUrl} alt={product.imageAlt} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Size {product.size} · {formatPKR(product.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border border-border p-3">
                <div className="relative size-14 shrink-0 bg-secondary">
                  <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Size {item.size} · Listed {formatPKR(item.price)}</p>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sold for
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={item.soldPrice}
                    onChange={(e) => updateItemPrice(item.id, e.target.value)}
                    className="h-9 w-24 border border-input bg-card px-2 text-sm font-normal normal-case text-foreground outline-none focus:border-primary"
                  />
                </label>
                <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="text-muted-foreground hover:text-destructive">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Customer &amp; shipping details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className={field} name="name" placeholder="Full name" required />
          <input className={field} name="phone" placeholder="03XXXXXXXXX" inputMode="tel" required />
          <input className={`${field} sm:col-span-2`} type="email" name="email" placeholder="Email address" required />
          <select className={field} value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((item) => <option key={item}>{item}</option>)}
          </select>
          <input className={field} name="postal" placeholder="Postal code (optional)" />
          <textarea className="min-h-24 border border-input bg-card p-3 text-sm outline-none focus:border-primary sm:col-span-2" name="address" placeholder="Complete delivery address" required />
          <textarea className="min-h-20 border border-input bg-card p-3 text-sm outline-none focus:border-primary sm:col-span-2" name="notes" placeholder="Notes (optional) — e.g. sold via WhatsApp" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider">
          Payment method
          <select className={field} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "cod" | "bank")}>
            <option value="bank">Bank transfer</option>
            <option value="cod">Cash on delivery</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider">
          Shipping fee (Rs)
          <input type="number" min={0} step={1} value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider">
          Advance received (Rs)
          <input type="number" min={0} step={1} value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} className={field} />
        </label>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-5 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>{formatPKR(Number(shippingFee) || 0)}</span></div>
        <div className="flex justify-between"><span>Total</span><span>{formatPKR(total)}</span></div>
        {Number(advancePaid) > 0 && <div className="flex justify-between text-accent"><span>Advance received</span><span>−{formatPKR(Number(advancePaid))}</span></div>}
        <div className="mt-2 flex justify-between text-lg font-bold"><span>Balance due on parcel</span><span>{formatPKR(balanceDue)}</span></div>
      </div>

      <button disabled={isPending} className="h-14 bg-primary font-bold text-primary-foreground disabled:opacity-50">
        {isPending ? "Recording order..." : "Record order"}
      </button>
    </form>
  )
}
