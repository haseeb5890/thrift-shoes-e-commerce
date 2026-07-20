"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deletePromoCode, togglePromoActive } from "@/app/actions/promos"

export function PromoRowActions({ promoId, isActive }: { promoId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      const result = await togglePromoActive(promoId, !isActive)
      if ("error" in result) toast.error(result.error)
      else toast.success(isActive ? "Promo disabled" : "Promo enabled")
    })
  }

  function handleDelete() {
    if (!confirm("Delete this promo code? This cannot be undone.")) return
    startTransition(async () => {
      const result = await deletePromoCode(promoId)
      if ("error" in result) toast.error(result.error)
      else toast.success("Promo code deleted")
    })
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <button disabled={isPending} onClick={handleToggle} className="text-xs font-bold uppercase tracking-wider underline disabled:opacity-50">
        {isActive ? "Disable" : "Enable"}
      </button>
      <button disabled={isPending} onClick={handleDelete} className="text-xs font-bold uppercase tracking-wider text-destructive underline disabled:opacity-50">
        Delete
      </button>
    </div>
  )
}
