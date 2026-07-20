import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { formatPKR, getDeliveryWindow } from "@/lib/store-data"
import { getSessionProfile } from "@/lib/auth-helpers"
import { OrderStatusTimeline } from "@/components/order-status-timeline"
import { CancelOrderButton } from "@/components/cancel-order-button"

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" }
const CANCELLABLE_WINDOW_MS = 2 * 60 * 60 * 1000 // 2 hours — mirrors app/actions/orders.ts

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await getSessionProfile()
  if (!profile) notFound()

  const [order] = await db.select().from(orders).where(eq(orders.id, id))
  if (!order || order.userId !== profile.id) notFound()

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))

  const canCancel = order.status === "placed" && Date.now() - new Date(order.createdAt).getTime() <= CANCELLABLE_WINDOW_MS
  const showDeliveryEstimate = order.status !== "cancelled" && order.status !== "delivered"

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <Link href="/track" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Your orders
      </Link>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">{order.orderNumber}</p>
        <h1 className="mt-1 font-serif text-4xl font-black">{formatPKR(order.total)}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleString("en-PK", DATE_FORMAT)}</p>
        {showDeliveryEstimate && (
          <p className="mt-2 text-sm font-bold text-primary">Delivered by: {getDeliveryWindow(new Date(order.createdAt))}</p>
        )}
      </div>

      <OrderStatusTimeline status={order.status} className="mt-8" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-secondary p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment</p>
          <p className="mt-1 text-sm font-bold capitalize">{order.paymentStatus}</p>
        </div>
        <div className="bg-secondary p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Delivery address</p>
          <p className="mt-1 text-sm font-bold">{order.addressLine}, {order.city}</p>
        </div>
        <div className="bg-secondary p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracking</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">{order.trackingNumber ?? "Assigned after dispatch"}</p>
            {order.trackingNumber && (
              <a
                href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(order.trackingNumber)}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Track shipment on courier site"
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary underline"
              >
                Track <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
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

      {canCancel && (
        <div className="mt-6 border-t border-border pt-4">
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
    </section>
  )
}
