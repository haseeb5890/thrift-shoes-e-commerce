"use client"

import { useState, useTransition } from "react"
import { updateOrderStatus } from "@/app/actions/orders"
import { ORDER_STATUSES } from "@/lib/order-status"

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [value, setValue] = useState(status)
  const [pending, startTransition] = useTransition()

  function onChange(next: string) {
    setValue(next)
    startTransition(async () => {
      await updateOrderStatus(orderId, next as (typeof ORDER_STATUSES)[number])
    })
  }

  return (
    <select value={value} disabled={pending} onChange={(e) => onChange(e.target.value)} className="h-9 border border-border bg-card px-2 text-xs font-bold uppercase tracking-wider capitalize">
      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}