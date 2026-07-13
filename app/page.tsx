import { StoreShell } from "@/components/store-shell"
import { HomePage } from "@/components/home-page"
import { getProducts } from "@/lib/products"

export default async function Page() {
  const products = await getProducts()
  return <StoreShell><HomePage products={products}/></StoreShell>
}
