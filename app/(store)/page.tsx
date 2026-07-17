import { HomePage } from "@/components/home-page"
import { getProducts } from "@/lib/products"

// Forces Next.js to fetch fresh database data on every visit 
export const dynamic = "force-dynamic";

export default async function Page() {
  const productsResult = await getProducts()
  
  // Extract the actual array of products from the returned object
  const products = productsResult && typeof productsResult === 'object' && 'products' in productsResult && Array.isArray(productsResult.products)
    ? productsResult.products 
    : (Array.isArray(productsResult) ? productsResult : [])

  return <HomePage products={products}/>
}