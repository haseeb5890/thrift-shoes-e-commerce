import Link from "next/link"
import { desc, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"
import { OrderStatusSelect } from "@/components/order-status-select"

export default async function AdminOrdersPage() {
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt))

  const itemRows = orderRows.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderRows.map((order) => order.id)))
    : []
  const itemsByOrderId = new Map<string, typeof itemRows>()
  for (const item of itemRows) {
    const existing = itemsByOrderId.get(item.orderId)
    if (existing) existing.push(item)
    else itemsByOrderId.set(item.orderId, [item])
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-5xl font-black">Orders.</h1>
      <div className="mt-8 overflow-x-auto bg-background p-5">
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
                <td colSpan={7} className="py-10 text-center text-muted-foreground">Orders will appear here after checkout.</td>
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
    </section>
  )
}
