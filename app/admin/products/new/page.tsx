import { requireAdminPage } from "@/lib/auth-helpers"
import { AdminProductForm } from "@/components/admin-product-form"
import { Logo } from "@/components/logo"

export default async function NewProductPage() {
  await requireAdminPage()
  return (
    <main className="min-h-svh bg-secondary">
      <header className="border-b border-border bg-foreground text-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 md:px-6">
          <Logo href="/admin" />
          <div className="text-xs font-bold uppercase tracking-widest">Add product</div>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h1 className="font-serif text-4xl font-black">List a new pair.</h1>
        <AdminProductForm mode="create" />
      </section>
    </main>
  )
}
