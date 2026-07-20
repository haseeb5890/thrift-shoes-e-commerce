import { desc } from "drizzle-orm"
import Link from "next/link"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { ExportCsvButton } from "@/components/export-csv-button"
import { InlinePriceEditor } from "@/components/inline-price-editor"

export default async function AdminProductsPage() {
  const productRows = await db.select().from(products).orderBy(desc(products.createdAt))
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-5xl font-black">Inventory.</h1>
        <div className="flex items-center gap-3">
          <ExportCsvButton target={{ type: "products" }} filename={`products-${new Date().toISOString().slice(0, 10)}.csv`} />
          <Link href="/admin/products/new" className="flex h-12 items-center bg-primary px-6 font-bold text-primary-foreground">Add product</Link>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto bg-background p-5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Brand</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Size</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {productRows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No products yet.</td></tr>
            ) : (
              productRows.map((product) => (
                <tr key={product.id} className="border-b border-border">
                  <td className="px-3 py-4 font-bold">{product.name}</td>
                  <td className="px-3 py-4">{product.brand}</td>
                  <td className="px-3 py-4">{product.category}</td>
                  <td className="px-3 py-4">{product.size}</td>
                  <td className="px-3 py-4"><InlinePriceEditor productId={product.id} price={product.price} /></td>
                  <td className="px-3 py-4">{product.stock}</td>
                  <td className="px-3 py-4">
                    <span className={`text-xs font-bold uppercase ${product.stock ? "text-accent" : "text-destructive"}`}>{product.stock ? "Live" : "Sold"}</span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-xs font-bold uppercase tracking-widest underline">Edit</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
