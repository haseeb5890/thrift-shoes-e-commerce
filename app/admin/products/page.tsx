import { desc, sql } from "drizzle-orm"
import Link from "next/link"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { ExportCsvButton } from "@/components/export-csv-button"
import { InlinePriceEditor } from "@/components/inline-price-editor"
import { DeleteProductButton } from "@/components/delete-product-button"
import { AdminUploadStatusBar } from "@/components/admin-upload-status-bar"

const PAGE_SIZE = 20

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [productRows, [{ count }]] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(products),
  ])
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-black md:text-5xl">Inventory.</h1>
        <div className="flex items-center gap-3">
          <ExportCsvButton target={{ type: "products" }} filename={`products-${new Date().toISOString().slice(0, 10)}.csv`} />
          <Link href="/admin/products/new" className="flex h-12 items-center bg-primary px-6 font-bold text-primary-foreground">Add product</Link>
        </div>
      </div>
      <div className="mt-8">
        <AdminUploadStatusBar />
      </div>
      <div className="overflow-x-auto bg-background p-5">
        <table className="w-full min-w-95 text-left text-sm md:min-w-180">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="hidden px-3 py-3 md:table-cell">Brand</th>
              <th className="hidden px-3 py-3 md:table-cell">Type</th>
              <th className="hidden px-3 py-3 md:table-cell">Size</th>
              <th className="px-3 py-3">Price</th>
              <th className="hidden px-3 py-3 md:table-cell">Stock</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {productRows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">No products yet.</td></tr>
            ) : (
              productRows.map((product) => (
                <tr key={product.id} className="border-b border-border">
                  <td className="px-3 py-4 font-bold">{product.name}</td>
                  <td className="hidden px-3 py-4 md:table-cell">{product.brand}</td>
                  <td className="hidden px-3 py-4 md:table-cell">{product.category.join(", ")}</td>
                  <td className="hidden px-3 py-4 md:table-cell">{product.size}</td>
                  <td className="px-3 py-4"><InlinePriceEditor productId={product.id} price={product.price} /></td>
                  <td className="hidden px-3 py-4 md:table-cell">{product.stock}</td>
                  <td className="px-3 py-4">
                    <span className={`text-xs font-bold uppercase ${product.stock ? "text-accent" : "text-destructive"}`}>{product.stock ? "Live" : "Sold"}</span>
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link href={`/admin/products/${product.id}/edit`} className="text-xs font-bold uppercase tracking-widest underline">Edit</Link>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
          <Link
            href={`/admin/products?page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`flex h-9 min-w-9 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-foreground"}`}
          >
            Prev
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}`}
              className={`flex h-9 min-w-9 items-center justify-center border px-3 text-xs font-bold ${p === page ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
            >
              {p}
            </Link>
          ))}
          <Link
            href={`/admin/products?page=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={`flex h-9 min-w-9 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-foreground"}`}
          >
            Next
          </Link>
        </nav>
      )}
    </section>
  )
}
