"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateOrderStatus } from "@/app/actions/orders"
import { ORDER_STATUSES } from "@/lib/order-status"

type Status = (typeof ORDER_STATUSES)[number]

export function OrderStatusSelect({ orderId, status, trackingNumber }: { orderId: string; status: string; trackingNumber?: string | null }) {
  const [value, setValue] = useState(status)
  const [pending, startTransition] = useTransition()
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null)
  const [trackingInput, setTrackingInput] = useState(trackingNumber ?? "")
  const [pinInput, setPinInput] = useState("")

  const needsTracking = pendingStatus === "shipped" && !trackingNumber
  const needsPin = pendingStatus === "cancelled"

  function onSelectChange(next: string) {
    const nextStatus = next as Status
    if (nextStatus === status) return

    // Shipped (without an existing tracking number) and Cancelled both need extra input
    // before we actually call the server action — hold the change in a pending state.
    if ((nextStatus === "shipped" && !trackingNumber) || nextStatus === "cancelled") {
      setPendingStatus(nextStatus)
      return
    }

    submit(nextStatus)
  }

  function submit(nextStatus: Status, opts?: { trackingNumber?: string; cancelPin?: string }) {
    const previous = value
    setValue(nextStatus)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus, opts)
      if ("error" in result) {
        toast.error(result.error)
        setValue(previous)
      } else {
        toast.success(`Order marked ${nextStatus}`)
        setPendingStatus(null)
        setPinInput("")
      }
    })
  }

  function confirmPending() {
    if (!pendingStatus) return
    if (needsTracking && !trackingInput.trim()) {
      toast.error("Enter a tracking number to mark this order as shipped.")
      return
    }
    if (needsPin && !pinInput.trim()) {
      toast.error("Enter the admin PIN to cancel this order.")
      return
    }
    submit(pendingStatus, { trackingNumber: trackingInput.trim() || undefined, cancelPin: needsPin ? pinInput.trim() : undefined })
  }

  function cancelPending() {
    setPendingStatus(null)
    setPinInput("")
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        value={pendingStatus ?? value}
        disabled={pending}
        onChange={(e) => onSelectChange(e.target.value)}
        className="h-9 border border-border bg-card px-2 text-xs font-bold uppercase tracking-wider capitalize disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {pendingStatus && (
        <div className="flex flex-col items-end gap-2 border border-border bg-card p-3">
          {needsTracking && (
            <input
              type="text"
              placeholder="Tracking number"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="h-9 w-44 border border-border bg-background px-2 text-xs"
            />
          )}
          {needsPin && (
            <input
              type="password"
              placeholder="Admin PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="h-9 w-44 border border-border bg-background px-2 text-xs"
            />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={cancelPending} disabled={pending} className="text-[10px] font-bold uppercase tracking-wider underline disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={confirmPending} disabled={pending} className="text-[10px] font-bold uppercase tracking-wider text-primary underline disabled:opacity-50">
              {pending ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}