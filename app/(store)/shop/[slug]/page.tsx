import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product-detail"
import { getProduct, getProductMedia } from "@/lib/products"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  const media = await getProductMedia(product.id)
  return <ProductDetail product={product} media={media}/>
}
