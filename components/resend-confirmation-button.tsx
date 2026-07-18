"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { resendOrderConfirmationEmail } from "@/app/actions/orders"

export function ResendConfirmationButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()

  function resend() {
    startTransition(async () => {
      const result = await resendOrderConfirmationEmail(orderId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("Confirmation email resent.")
    })
  }

  return (
    <button onClick={resend} disabled={pending} className="mt-2 text-xs font-bold uppercase tracking-wider text-primary underline disabled:opacity-50">
      {pending ? "Sending..." : "Resend confirmation email"}
    </button>
  )
}
