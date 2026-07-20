"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateProductPrice } from "@/app/actions/products"
import { formatPKR } from "@/lib/store-data"

export function InlinePriceEditor({ productId, price }: { productId: string; price: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(price))
  const [isPending, startTransition] = useTransition()

  function save() {
    const next = Number(value)
    if (!Number.isInteger(next) || next <= 0) {
      toast.error("Enter a valid price.")
      setValue(String(price))
      setEditing(false)
      return
    }
    if (next === price) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const result = await updateProductPrice(productId, next)
      if (result && "error" in result) {
        toast.error(result.error)
        setValue(String(price))
      } else {
        toast.success("Price updated")
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <input
        type="number"
        min={1}
        autoFocus
        disabled={isPending}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save()
          if (e.key === "Escape") { setValue(String(price)); setEditing(false) }
        }}
        className="h-9 w-24 border border-primary bg-card px-2 text-sm font-bold outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="border-b border-dotted border-muted-foreground text-left font-bold transition-colors hover:border-foreground"
    >
      {formatPKR(price)}
    </button>
  )
}
