import Link from "next/link"
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"
import { OrderStatusSelect } from "@/components/order-status-select"
import { ExportCsvButton } from "@/components/export-csv-button"

const PAGE_SIZE = 20

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ""
  const page = Math.max(1, Number(pageParam) || 1)

  // Customers only type the numeric part of an order number — RLP- is implied, so a
  // fully-numeric search also matches against "RLP-<query>" in addition to a plain substring match.
  const where = query
    ? or(
        ilike(orders.orderNumber, `%${query}%`),
        ilike(orders.customerName, `%${query}%`),
        /^\d+$/.test(query) ? ilike(orders.orderNumber, `%RLP-${query}%`) : undefined,
      )
    : undefined

  const [orderRows, [{ count }]] = await Promise.all([
    db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
  ])

  const orderIds = orderRows.map((order) => order.id)
  const items = orderIds.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)) : []
  const itemsByOrder = new Map<string, typeof items>()
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? []
    list.push(item)
    itemsByOrder.set(item.orderId, list)
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (targetPage > 1) params.set("page", String(targetPage))
    const qs = params.toString()
    return `/admin/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-black md:text-5xl">Orders.</h1>
        <ExportCsvButton target={{ type: "orders" }} filename={`orders-${new Date().toISOString().slice(0, 10)}.csv`} />
      </div>

      <form action="/admin/orders" className="mt-6 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by customer name or order number"
          className="h-11 flex-1 max-w-sm border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <button type="submit" className="h-11 border border-foreground px-5 text-xs font-bold uppercase tracking-wider">Search</button>
        {query && (
          <Link href="/admin/orders" className="flex h-11 items-center px-4 text-xs font-bold uppercase tracking-wider underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto bg-background p-5">
        <table className="w-full min-w-130 text-left text-sm md:min-w-225">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Order</th>
              <th className="px-3 py-3">Customer</th>
              <th className="hidden px-3 py-3 md:table-cell">Address</th>
              <th className="hidden px-3 py-3 md:table-cell">Products</th>
              <th className="hidden px-3 py-3 md:table-cell">Payment</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  {query ? `No orders match "${query}".` : "Orders will appear here after checkout."}
                </td>
              </tr>
            ) : (
              orderRows.map((order) => {
                const orderItemRows = itemsByOrder.get(order.id) ?? []
                return (
                  <tr key={order.id} className="border-b border-border align-top">
                    <td className="px-3 py-4 font-bold">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/orders/${order.id}`} className="underline">{order.orderNumber}</Link>
                        {order.source === "admin" && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {order.customerName}
                      <p className="text-xs text-muted-foreground">{order.email}</p>
                    </td>
                    <td className="hidden px-3 py-4 text-xs text-muted-foreground md:table-cell">
                      {order.addressLine}
                      <p>{order.city}{order.postalCode ? `, ${order.postalCode}` : ""}</p>
                    </td>
                    <td className="hidden px-3 py-4 text-xs md:table-cell">
                      {orderItemRows.length === 0
                        ? <span className="text-muted-foreground">—</span>
                        : (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold">{orderItemRows[0].productName} · Size {orderItemRows[0].size}</span>
                            {orderItemRows.length > 1 && (
                              <span className="text-muted-foreground">+{orderItemRows.length - 1} more</span>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="hidden px-3 py-4 capitalize md:table-cell">{order.paymentMethod}</td>
                    <td className="px-3 py-4 font-bold">{formatPKR(order.total)}</td>
                    <td className="px-3 py-4 text-right">
                      <OrderStatusSelect orderId={order.id} status={order.status} trackingNumber={order.trackingNumber} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`flex h-9 min-w-9 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider ${page <= 1 ? "pointer-events-none opacity-40" : "hover:border-foreground"}`}
          >
            Prev
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`flex h-9 min-w-9 items-center justify-center border px-3 text-xs font-bold ${p === page ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
            >
              {p}
            </Link>
          ))}
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
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