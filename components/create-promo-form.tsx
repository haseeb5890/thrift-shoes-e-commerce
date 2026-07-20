"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { createPromoCode } from "@/app/actions/promos"

const field = "h-11 border border-border bg-card px-3 text-sm outline-none focus:border-primary"

export function CreatePromoForm() {
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createPromoCode(formData)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Promo code created")
        ;(document.getElementById("create-promo-form") as HTMLFormElement)?.reset()
      }
    })
  }

  return (
    <form id="create-promo-form" action={submit} className="mt-5 flex flex-col gap-3">
      <input className={`${field} uppercase`} name="code" placeholder="Code, e.g. EID25" required maxLength={24} />
      <input className={field} name="discountPercent" type="number" min={1} max={100} placeholder="Discount %" required />
      <input className={field} name="maxUses" type="number" min={1} placeholder="No. of promo tickets" required />
      <button disabled={isPending} className="h-11 bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
        {isPending ? "Creating..." : "Create promo code"}
      </button>
    </form>
  )
}
