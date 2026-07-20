import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/store-data"

export function RelatedProductsCarousel({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="font-serif text-3xl font-black">You might also like</h2>
      <p className="mt-1 text-sm text-muted-foreground">Other pairs in the same size or from the same brand.</p>
      <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {products.map((product) => (
          <div key={product.id} className="w-[45vw] shrink-0 snap-start sm:w-56">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
