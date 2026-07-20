import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { formatPKR } from "@/lib/store-data"
import { OrderStatusTimeline } from "@/components/order-status-timeline"
import { OrderStatusSelect } from "@/components/order-status-select"
import { ResendConfirmationButton } from "@/components/resend-confirmation-button"

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" }

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order) notFound()

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{order.orderNumber}</p>
          <h1 className="mt-1 font-serif text-4xl font-black">{order.customerName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString("en-PK", DATE_FORMAT)}</p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.status} trackingNumber={order.trackingNumber} />
      </div>

      <OrderStatusTimeline status={order.status} className="mt-8" />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer</h2>
          <p className="mt-2 text-sm font-bold">{order.customerName}</p>
          <p className="text-sm">{order.email}</p>
          <p className="text-sm">{order.phone}</p>
        </div>

        <div className="bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Shipping address</h2>
          <p className="mt-2 text-sm">{order.addressLine}</p>
          <p className="text-sm">{order.city}{order.postalCode ? `, ${order.postalCode}` : ""}</p>
        </div>

        <div className="bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment</h2>
          <p className="mt-2 text-sm capitalize">{order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod}</p>
          <p className="text-sm capitalize text-muted-foreground">{order.paymentStatus}</p>
        </div>

        <div className="bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirmation</h2>
          <p className="mt-2 text-sm">
            {order.confirmedAt
              ? `Confirmed ${new Date(order.confirmedAt).toLocaleString("en-PK", DATE_FORMAT)}`
              : "Not yet confirmed by customer"}
          </p>
          {order.status === "placed" && <ResendConfirmationButton orderId={order.id} />}
          {order.trackingNumber && <p className="mt-1 text-sm text-muted-foreground">Tracking: {order.trackingNumber}</p>}
        </div>
      </div>

      {order.notes && (
        <div className="mt-6 bg-background p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</h2>
          <p className="mt-2 text-sm">{order.notes}</p>
        </div>
      )}

      <div className="mt-6 bg-background p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Items</h2>
        <div className="mt-4 flex flex-col divide-y divide-border">
          {items.map((item) => {
            const itemContent = (
              <>
                <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="size-16 shrink-0 border border-border object-cover" />
                <div className="flex-1">
                  <p className={`text-sm font-bold ${item.productSlug ? "underline" : ""}`}>{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Size {item.size} · Qty {item.quantity}</p>
                </div>
              </>
            )
            return (
              <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                {item.productSlug ? (
                  <Link href={`/shop/${item.productSlug}`} className="flex flex-1 items-center gap-4 hover:opacity-80">
                    {itemContent}
                  </Link>
                ) : (
                  <div className="flex flex-1 items-center gap-4">{itemContent}</div>
                )}
                <p className="text-sm font-bold">{formatPKR(item.unitPrice * item.quantity)}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPKR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{formatPKR(order.shippingFee)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-accent">
              <span>Discount {order.promoCode ? `(${order.promoCode})` : ""}</span>
              <span>−{formatPKR(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPKR(order.total)}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
