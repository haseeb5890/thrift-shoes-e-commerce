"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createAdminOrder } from "@/app/actions/orders"

export function AdminBuyButton({ productId, productName }: { productId: string; productName: string }) {
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState("")
  const [notes, setNotes] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    const amount = Number(price)
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error("Enter a valid amount.")
      return
    }

    startTransition(async () => {
      const promise = createAdminOrder(productId, amount, notes || undefined).then((result) => {
        if ("error" in result) throw new Error(result.error)
        return result
      })

      toast.promise(promise, {
        loading: "Recording purchase...",
        success: (order) => `Recorded — order ${order.orderNumber}`,
        error: (err) => (err instanceof Error ? err.message : "Couldn't record this purchase."),
      })

      try {
        await promise
        setOpen(false)
        setPrice("")
        setNotes("")
      } catch {
        // error toast already shown
      }
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold uppercase tracking-widest underline">
        Buy as admin
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2 border border-border bg-card p-3">
      <p className="w-full text-left text-xs font-bold">{productName}</p>
      <input
        type="number"
        min={1}
        placeholder="Price paid (PKR)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-9 w-40 border border-border bg-background px-2 text-xs"
      />
      <input
        type="text"
        placeholder="Note (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="h-9 w-40 border border-border bg-background px-2 text-xs"
      />
      <div className="flex gap-3">
        <button type="button" onClick={() => setOpen(false)} disabled={isPending} className="text-[10px] font-bold uppercase tracking-wider underline disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={isPending} className="text-[10px] font-bold uppercase tracking-wider text-primary underline disabled:opacity-50">
          {isPending ? "Saving..." : "Confirm"}
        </button>
      </div>
    </div>
  )
}