import { desc, gt, sql } from "drizzle-orm"
import Link from "next/link"
import { db } from "@/lib/db"
import { orders, products } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"

export default async function AdminPage() {
  const [[stats], [{ livePairs }], recentOrders, recentProducts] = await Promise.all([
    db
      .select({
        orderCount: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${orders.total}),0)::int`,
        pendingPaymentChecks: sql<number>`count(*) filter (where ${orders.paymentMethod} = 'bank' and ${orders.paymentStatus} = 'pending')::int`,
      })
      .from(orders),
    db.select({ livePairs: sql<number>`count(*)::int` }).from(products).where(gt(products.stock, 0)),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    db.select().from(products).orderBy(desc(products.createdAt)).limit(8),
  ])

  return <section className="mx-auto max-w-7xl px-4 py-10 md:px-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">Operations overview</p><h1 className="mt-2 font-serif text-3xl font-black md:text-5xl">The day at a glance.</h1><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">{[["Orders",stats.orderCount],["Revenue",formatPKR(stats.revenue)],["Live pairs",livePairs],["Payment checks",stats.pendingPaymentChecks]].map(([label,value])=><div key={label} className="bg-background p-5"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-3 font-serif text-xl font-black md:text-3xl">{value}</p></div>)}</div><div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]"><div className="bg-background p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-2xl font-black md:text-3xl">Recent orders</h2><Link href="/admin/orders" className="text-xs font-bold uppercase tracking-widest underline">Manage all orders</Link></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-70 text-left text-sm md:min-w-155"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-3">Order</th><th className="hidden px-3 py-3 md:table-cell">Customer</th><th className="hidden px-3 py-3 md:table-cell">City</th><th className="hidden px-3 py-3 md:table-cell">Payment</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Total</th></tr></thead><tbody>{recentOrders.length===0?<tr><td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">Orders will appear here after checkout.</td></tr>:recentOrders.map(order=><tr key={order.id} className="border-b border-border"><td className="px-3 py-4 font-bold">{order.orderNumber}</td><td className="hidden px-3 py-4 md:table-cell">{order.customerName}</td><td className="hidden px-3 py-4 md:table-cell">{order.city}</td><td className="hidden px-3 py-4 capitalize md:table-cell">{order.paymentMethod}</td><td className="px-3 py-4 capitalize">{order.status}</td><td className="px-3 py-4 text-right font-bold">{formatPKR(order.total)}</td></tr>)}</tbody></table></div></div><div className="bg-background p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-2xl font-black md:text-3xl">Inventory</h2><Link href="/admin/products" className="text-xs font-bold uppercase tracking-widest underline">Manage products</Link></div><div className="mt-5 flex flex-col gap-3">{recentProducts.map(product=><Link key={product.id} href={`/admin/products/${product.id}/edit`} className="flex items-center justify-between border-b border-border pb-3"><div><p className="font-bold">{product.name}</p><p className="text-xs text-muted-foreground">{product.size} · {product.condition}</p></div><span className={`text-xs font-bold uppercase ${product.stock?"text-accent":"text-destructive"}`}>{product.stock?"Live":"Sold"}</span></Link>)}</div><Link href="/admin/products/new" className="mt-5 block text-center text-xs font-bold uppercase tracking-widest underline">Add product</Link></div></div></section>
}
