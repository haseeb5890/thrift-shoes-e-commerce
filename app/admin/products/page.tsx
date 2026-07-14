import { desc } from "drizzle-orm"
import Link from "next/link"
import { requireAdminPage } from "@/lib/auth-helpers"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"

export default async function AdminProductsPage() {
  await requireAdminPage()
  const productRows = await db.select().from(products).orderBy(desc(products.createdAt))
  return <main className="min-h-svh bg-secondary"><header className="border-b border-border bg-foreground text-background"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6"><Link href="/admin" className="font-serif text-2xl font-black">ReLace.</Link><div className="text-xs font-bold uppercase tracking-widest">Manage packages</div></div></header><section className="mx-auto max-w-7xl px-4 py-10 md:px-6"><div className="flex items-center justify-between"><h1 className="font-serif text-5xl font-black">Inventory.</h1><Link href="/admin/products/new" className="flex h-12 items-center bg-primary px-6 font-bold text-primary-foreground">Add product</Link></div><div className="mt-8 overflow-x-auto bg-background p-5"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3">Name</th><th>Brand</th><th>Type</th><th>Size</th><th>Stock</th><th>Status</th><th className="text-right">Edit</th></tr></thead><tbody>{productRows.length===0?<tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No products yet.</td></tr>:productRows.map((product)=><tr key={product.id} className="border-b border-border"><td className="py-4 font-bold">{product.name}</td><td>{product.brand}</td><td>{product.category}</td><td>{product.size}</td><td>{product.stock}</td><td><span className={`text-xs font-bold uppercase ${product.stock?"text-accent":"text-destructive"}`}>{product.stock?"Live":"Sold"}</span></td><td className="text-right"><Link href={`/admin/products/${product.id}/edit`} className="text-xs font-bold uppercase tracking-widest underline">Edit</Link></td></tr>)}</tbody></table></div></section></main>
}
