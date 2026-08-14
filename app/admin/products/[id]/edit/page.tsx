import { notFound } from "next/navigation"
import { requireAdminPage } from "@/lib/auth-helpers"
import { getProductById, getProductMedia } from "@/lib/products"
import { AdminProductForm } from "@/components/admin-product-form"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage()
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()
  const media = await getProductMedia(id)

  return (
    <main className="min-h-svh bg-secondary">
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h1 className="font-serif text-4xl font-black">{product.name}</h1>
        <AdminProductForm mode="edit" product={product} media={media} />
      </section>
    </main>
  )
}
