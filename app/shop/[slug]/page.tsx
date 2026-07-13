import { notFound } from "next/navigation"
import { StoreShell } from "@/components/store-shell"
import { ProductDetail } from "@/components/product-detail"
import { getProduct } from "@/lib/products"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  return <StoreShell><ProductDetail product={product}/></StoreShell>
}
