import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"
import { OrderStatusSelect } from "@/components/order-status-select"
import { ExportCsvButton } from "@/components/export-csv-button"

export default async function AdminOrdersPage() {
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt))
  return <section className="mx-auto max-w-7xl px-4 py-10 md:px-6"><div className="flex items-center justify-between"><h1 className="font-serif text-5xl font-black">Orders.</h1><ExportCsvButton target={{ type: "orders" }} filename={`orders-${new Date().toISOString().slice(0, 10)}.csv`} /></div><div className="mt-8 overflow-x-auto bg-background p-5"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-xs uppercase text-muted-foreground"><tr><th className="py-3">Order</th><th>Customer</th><th>City</th><th>Payment</th><th>Total</th><th className="text-right">Status</th></tr></thead><tbody>{orderRows.length===0?<tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Orders will appear here after checkout.</td></tr>:orderRows.map((order)=><tr key={order.id} className="border-b border-border"><td className="py-4 font-bold">{order.orderNumber}</td><td>{order.customerName}<p className="text-xs text-muted-foreground">{order.email}</p></td><td>{order.city}</td><td className="capitalize">{order.paymentMethod}</td><td className="font-bold">{formatPKR(order.total)}</td><td className="text-right"><OrderStatusSelect orderId={order.id} status={order.status} trackingNumber={order.trackingNumber}/></td></tr>)}</tbody></table></div></section>
}