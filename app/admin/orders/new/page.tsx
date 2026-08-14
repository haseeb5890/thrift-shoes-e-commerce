import { AdminOrderForm } from "@/components/admin-order-form"

export default function NewAdminOrderPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-10 md:px-6">
      <h1 className="font-serif text-3xl font-black md:text-5xl">Record offline sale.</h1>
      <p className="mt-2 text-sm text-muted-foreground">For a sale made via WhatsApp or in person — this records a real order with shipping details, just like checkout.</p>
      <AdminOrderForm />
    </section>
  )
}
