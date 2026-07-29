import Link from "next/link"
import { and, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"
import { ORDER_STATUSES } from "@/lib/order-status"
import { OrderStatusSelect } from "@/components/order-status-select"
import { AdvancePaymentEditor } from "@/components/advance-payment-editor"
import { ExportCsvButton } from "@/components/export-csv-button"

const PAGE_SIZE = 20

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; page?: string }>
}) {
  const { q, status, from, to, page: pageParam } = await searchParams
  const query = q?.trim() ?? ""
  const page = Math.max(1, Number(pageParam) || 1)

  const conditions: (SQL | undefined)[] = []
  // Customers only type the numeric part of an order number — RLP- is implied, so a
  // fully-numeric search also matches against "RLP-<query>" in addition to a plain substring match.
  if (query) {
    conditions.push(
      or(
        ilike(orders.orderNumber, `%${query}%`),
        ilike(orders.customerName, `%${query}%`),
        /^\d+$/.test(query) ? ilike(orders.orderNumber, `%RLP-${query}%`) : undefined,
      ),
    )
  }
  if (status) conditions.push(eq(orders.status, status))
  if (from) conditions.push(gte(orders.createdAt, new Date(`${from}T00:00:00`)))
  if (to) conditions.push(lte(orders.createdAt, new Date(`${to}T23:59:59`)))
  const where = conditions.length ? and(...conditions) : undefined

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
  const hasFilters = Boolean(query || status || from || to)

  function pageHref(targetPage: number) {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (status) params.set("status", status)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (targetPage > 1) params.set("page", String(targetPage))
    const qs = params.toString()
    return `/admin/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-black md:text-5xl">Orders.</h1>
        <div className="flex items-center gap-3">
          <ExportCsvButton target={{ type: "orders" }} filename={`orders-${new Date().toISOString().slice(0, 10)}.csv`} />
          <Link href="/admin/orders/new" className="flex h-12 items-center bg-primary px-6 font-bold text-primary-foreground">Record offline sale</Link>
        </div>
      </div>

      <form action="/admin/orders" className="mt-6 flex flex-wrap items-end gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by customer name or order number"
          className="h-11 w-full max-w-sm border border-border bg-card px-3 text-sm outline-none focus:border-primary"
        />
        <select name="status" defaultValue={status ?? ""} className="h-11 border border-border bg-card px-3 text-sm capitalize outline-none focus:border-primary">
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          From
          <input type="date" name="from" defaultValue={from ?? ""} className="h-11 border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          To
          <input type="date" name="to" defaultValue={to ?? ""} className="h-11 border border-border bg-card px-3 text-sm outline-none focus:border-primary" />
        </label>
        <button type="submit" className="h-11 border border-foreground px-5 text-xs font-bold uppercase tracking-wider">Filter</button>
        {hasFilters && (
          <Link href="/admin/orders" className="flex h-11 items-center px-4 text-xs font-bold uppercase tracking-wider underline">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto bg-background p-5">
        <table className="w-full min-w-150 text-left text-sm md:min-w-245">
          <thead className="border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Order</th>
              <th className="px-3 py-3">Customer</th>
              <th className="hidden px-3 py-3 md:table-cell">Address</th>
              <th className="hidden px-3 py-3 md:table-cell">Products</th>
              <th className="px-3 py-3">Payment</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  {hasFilters ? "No orders match these filters." : "Orders will appear here after checkout."}
                </td>
              </tr>
            ) : (
              orderRows.map((order) => {
                const orderItemRows = itemsByOrder.get(order.id) ?? []
                return (
                  <tr key={order.id} className="border-b border-border align-top odd:bg-secondary/60">
                    <td className="px-3 py-4 font-bold">
                      <Link href={`/admin/orders/${order.id}`} className="underline">{order.orderNumber}</Link>
                    </td>
                    <td className="px-3 py-4">
                      <span className="flex items-center gap-1.5">
                        {order.customerName}
                        {order.source === "admin" && <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Offline</span>}
                      </span>
                      <p className="text-xs text-muted-foreground">{order.email}</p>
                      <p className="text-xs text-muted-foreground">{order.phone}</p>
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
                    <td className="px-3 py-4 text-xs">
                      <p className="font-semibold capitalize">{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}</p>
                      <p className="capitalize text-muted-foreground">{order.paymentStatus}</p>
                      <div className="mt-1">
                        <AdvancePaymentEditor orderId={order.id} total={order.total} advancePaid={order.advancePaid} />
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-bold">{formatPKR(order.total)}</p>
                      {order.advancePaid > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">Due: {formatPKR(order.total - order.advancePaid)}</p>
                      )}
                    </td>
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
