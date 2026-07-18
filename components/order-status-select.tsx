"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateOrderStatus } from "@/app/actions/orders"
import { ORDER_STATUSES } from "@/lib/order-status"

const STATUS_COLORS: Record<string, string> = {
  placed: "border-amber-300 bg-amber-100 text-amber-900",
  confirmed: "border-sky-300 bg-sky-100 text-sky-900",
  processing: "border-violet-300 bg-violet-100 text-violet-900",
  shipped: "border-indigo-300 bg-indigo-100 text-indigo-900",
  delivered: "border-emerald-300 bg-emerald-100 text-emerald-900",
  cancelled: "border-red-300 bg-red-100 text-red-900",
}

const STATUS_OPTION_COLORS: Record<string, string> = {
  placed: "#fef3c7",
  confirmed: "#e0f2fe",
  processing: "#ede9fe",
  shipped: "#e0e7ff",
  delivered: "#d1fae5",
  cancelled: "#fee2e2",
}

export function OrderStatusSelect({ orderId, status, trackingNumber }: { orderId: string; status: string; trackingNumber: string | null }) {
  const [value, setValue] = useState(status)
  const [pending, startTransition] = useTransition()
  const [awaiting, setAwaiting] = useState<"tracking" | "cancelPin" | null>(null)
  const [tracking, setTracking] = useState(trackingNumber ?? "")
  const [cancelPin, setCancelPin] = useState("")

  function commit(next: (typeof ORDER_STATUSES)[number], opts?: { trackingNumber?: string; cancelPin?: string }) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next, opts)
      if (result && "error" in result) {
        toast.error(result.error)
        return
      }
      setValue(next)
      setAwaiting(null)
      setCancelPin("")
    })
  }

  function onChange(next: string) {
    if (next === "shipped" && !trackingNumber) {
      setAwaiting("tracking")
      return
    }
    if (next === "cancelled" && status !== "cancelled") {
      setAwaiting("cancelPin")
      return
    }
    commit(next as (typeof ORDER_STATUSES)[number])
  }

  if (awaiting === "tracking") {
    return (
      <div className="flex items-center justify-end gap-2">
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Tracking number"
          disabled={pending}
          className="h-9 w-32 border border-border bg-card px-2 text-xs"
        />
        <button
          onClick={() => (tracking.trim() ? commit("shipped", { trackingNumber: tracking.trim() }) : toast.error("Enter a tracking number to mark this order as shipped."))}
          disabled={pending}
          className="text-xs font-bold uppercase tracking-wider underline disabled:opacity-50"
        >
          Save
        </button>
        <button onClick={() => setAwaiting(null)} disabled={pending} className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline disabled:opacity-50">
          Cancel
        </button>
      </div>
    )
  }

  if (awaiting === "cancelPin") {
    return (
      <div className="flex items-center justify-end gap-2">
        <input
          value={cancelPin}
          onChange={(e) => setCancelPin(e.target.value)}
          placeholder="PIN"
          inputMode="numeric"
          maxLength={4}
          disabled={pending}
          className="h-9 w-16 border border-border bg-card px-2 text-xs"
        />
        <button onClick={() => commit("cancelled", { cancelPin })} disabled={pending} className="text-xs font-bold uppercase tracking-wider text-destructive underline disabled:opacity-50">
          Confirm cancel
        </button>
        <button onClick={() => { setAwaiting(null); setCancelPin("") }} disabled={pending} className="text-xs font-bold uppercase tracking-wider text-muted-foreground underline disabled:opacity-50">
          Never mind
        </button>
      </div>
    )
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 border px-2 text-xs font-bold uppercase tracking-wider capitalize ${STATUS_COLORS[value] ?? "border-border bg-card"}`}
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s} style={{ backgroundColor: STATUS_OPTION_COLORS[s] }}>
          {s}
        </option>
      ))}
    </select>
  )
}
