"use client"

import { useState, useTransition } from "react"
import { updateOrderStatus } from "@/app/actions/orders"

const STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"] as const

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [value, setValue] = useState(status)
  const [pending, startTransition] = useTransition()

  function onChange(next: string) {
    setValue(next)
    startTransition(async () => {
      await updateOrderStatus(orderId, next as (typeof STATUSES)[number])
    })
  }

  return (
    <select value={value} disabled={pending} onChange={(e) => onChange(e.target.value)} className="h-9 border border-border bg-card px-2 text-xs font-bold uppercase tracking-wider capitalize">
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
