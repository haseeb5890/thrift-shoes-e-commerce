"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deleteProduct } from "@/app/actions/products"

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${productName}"? This removes it and its photos/video permanently — this cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteProduct(productId)
      if ("error" in result) toast.error(result.error)
      else toast.success("Product deleted")
    })
  }

  return (
    <button disabled={isPending} onClick={handleDelete} className="text-xs font-bold uppercase tracking-widest text-destructive underline disabled:opacity-50">
      {isPending ? "Deleting..." : "Delete"}
    </button>
  )
}
