"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateOrderAdvancePayment } from "@/app/actions/orders"
import { formatPKR } from "@/lib/store-data"

export function AdvancePaymentEditor({ orderId, total, advancePaid }: { orderId: string; total: number; advancePaid: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(advancePaid))
  const [isPending, startTransition] = useTransition()

  function save() {
    const next = Number(value)
    if (!Number.isInteger(next) || next < 0 || next > total) {
      toast.error("Enter a valid advance amount.")
      setValue(String(advancePaid))
      setEditing(false)
      return
    }
    if (next === advancePaid) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const result = await updateOrderAdvancePayment(orderId, next)
      if ("error" in result) {
        toast.error(result.error)
        setValue(String(advancePaid))
      } else {
        toast.success("Advance payment updated")
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        max={total}
        autoFocus
        disabled={isPending}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save()
          if (e.key === "Escape") { setValue(String(advancePaid)); setEditing(false) }
        }}
        className="h-8 w-24 border border-primary bg-card px-2 text-xs font-bold outline-none"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="border-b border-dotted border-muted-foreground text-left text-xs transition-colors hover:border-foreground"
    >
      {advancePaid > 0 ? `Advance: ${formatPKR(advancePaid)}` : "Add advance"}
    </button>
  )
}
