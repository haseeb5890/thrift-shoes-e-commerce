import Link from "next/link"
import { and, count, desc, ilike, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"
import { OrderStatusSelect } from "@/components/order-status-select"

const PAGE_SIZE = 20

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; order?: string; page?: string }> }) {
  const { q, order: orderQuery, page: pageParam } = await searchParams
  const nameFilter = q?.trim() ?? ""
  const orderFilter = orderQuery?.trim() ?? ""
  const hasFilters = Boolean(nameFilter || orderFilter)

  const conditions = []
  if (nameFilter) conditions.push(ilike(orders.customerName, `%${nameFilter}%`))
  if (orderFilter) conditions.push(ilike(orders.orderNumber, `%${orderFilter}%`))
  const where = conditions.length ? and(...conditions) : undefined

  const [{ total }] = await db.select({ total: count() }).from(orders).where(where)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages)

  const orderRows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)

  const itemRows = orderRows.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderRows.map((order) => order.id)))
    : []
  const itemsByOrderId = new Map<string, typeof itemRows>()
  for (const item of itemRows) {
    const existing = itemsByOrderId.get(item.orderId)
    if (existing) existing.push(item)
    else itemsByOrderId.set(item.orderId, [item])
  }

  function pageHref(target: number) {
    const params = new URLSearchParams()
    if (nameFilter) params.set("q", nameFilter)
    if (orderFilter) params.set("order", orderFilter)
    if (target > 1) params.set("page", String(target))
    const qs = params.toString()
    return `/admin/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-5xl font-black">Orders.</h1>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer name</span>
          <input
            type="text"
            name="q"
            defaultValue={nameFilter}
            placeholder="Search by name"
            className="h-10 border border-input bg-card px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order number</span>
          <div className="flex h-10 items-center border border-input bg-card focus-within:border-primary">
            <span className="pl-3 text-sm text-muted-foreground">RLP-</span>
            <input type="text" name="order" defaultValue={orderFilter} placeholder="1234567" className="h-full w-32 bg-transparent px-2 text-sm outline-none" />
          </div>
        </label>
        <button type="submit" className="h-10 bg-primary px-5 text-xs font-bold uppercase tracking-wider text-primary-foreground">Search</button>
        {hasFilters && (
          <Link href="/admin/orders" className="flex h-10 items-center px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto bg-background p-5">
        <table className="w-full min-w-240 text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-3">Order</th>
              <th>Customer</th>
              <th>Products</th>
              <th>Address</th>
              <th>Payment</th>
              <th>Total</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">
                  {hasFilters ? "No orders match your search." : "Orders will appear here after checkout."}
                </td>
              </tr>
            ) : (
              orderRows.map((order) => {
                const items = itemsByOrderId.get(order.id) ?? []
                return (
                  <tr key={order.id} className="border-b border-border align-top">
                    <td className="py-4 font-bold">
                      <Link href={`/admin/orders/${order.id}`} className="underline">{order.orderNumber}</Link>
                    </td>
                    <td>{order.customerName}<p className="text-xs text-muted-foreground">{order.email}</p></td>
                    <td className="max-w-55">
                      {items.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <>
                          {items[0].productName} <span className="text-xs text-muted-foreground">({items[0].size})</span>
                          {items.length > 1 && <span className="block text-xs text-muted-foreground">+{items.length - 1} more</span>}
                        </>
                      )}
                    </td>
                    <td className="max-w-55">
                      {order.addressLine}, {order.city}
                      {order.postalCode && <span className="text-xs text-muted-foreground"> {order.postalCode}</span>}
                    </td>
                    <td className="capitalize">{order.paymentMethod}</td>
                    <td className="font-bold">{formatPKR(order.total)}</td>
                    <td className="text-right"><OrderStatusSelect orderId={order.id} status={order.status} trackingNumber={order.trackingNumber}/></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-muted-foreground">Page {page} of {totalPages} · {total} orders</span>
          <div className="flex gap-4">
            {page > 1 ? <Link href={pageHref(page - 1)} className="underline">Previous</Link> : <span className="text-muted-foreground/50">Previous</span>}
            {page < totalPages ? <Link href={pageHref(page + 1)} className="underline">Next</Link> : <span className="text-muted-foreground/50">Next</span>}
          </div>
        </div>
      )}
    </section>
  )
}
