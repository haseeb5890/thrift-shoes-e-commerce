"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cancelOrderAsCustomer } from "@/app/actions/orders"

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      const promise = cancelOrderAsCustomer(orderId).then((result) => {
        if ("error" in result) throw new Error(result.error)
        return result
      })

      toast.promise(promise, {
        loading: "Cancelling order...",
        success: "Order cancelled — the pair is back in stock.",
        error: (err) => (err instanceof Error ? err.message : "Couldn't cancel this order."),
      })

      try {
        await promise
        router.refresh() // re-fetch this order's status server-side so the button disappears
      } catch {
        // error toast already shown by toast.promise above
      } finally {
        setConfirming(false)
      }
    })
  }

  if (confirming) {
    return (
      <div className="animate-in fade-in-0 slide-in-from-left-1 flex items-center gap-3 duration-150">
        <span className="text-xs text-muted-foreground">Cancel this order?</span>
        <button onClick={handleCancel} disabled={isPending} className="text-xs font-bold uppercase tracking-wider text-destructive underline disabled:opacity-50">
          Yes, cancel
        </button>
        <button onClick={() => setConfirming(false)} disabled={isPending} className="text-xs font-bold uppercase tracking-wider underline disabled:opacity-50">
          Never mind
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs font-bold uppercase tracking-wider text-destructive underline">
      Cancel order
    </button>
  )
}