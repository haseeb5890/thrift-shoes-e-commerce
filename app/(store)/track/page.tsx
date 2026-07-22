import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { getSessionProfile } from "@/lib/auth-helpers"
import { getOrdersForProfile } from "@/app/actions/tracking"
import { TrackForm } from "@/components/track-form"
import { OrderStatusTimeline } from "@/components/order-status-timeline"
import { CancelOrderButton } from "@/components/cancel-order-button"
import { formatPKR, getDeliveryWindow } from "@/lib/store-data"

const CANCELLABLE_WINDOW_MS = 2 * 60 * 60 * 1000 // 2 hours — mirrors app/actions/orders.ts

export default async function TrackPage() {
  const profile = await getSessionProfile()

  // Not logged in (or no profile linked yet) — fall back to guest lookup by order number + phone.
  if (!profile) return <TrackForm />

  const myOrders = await getOrdersForProfile(profile.id)

  return (
    <section className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 px-4 pb-20 pt-10 duration-500 md:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Signed in as {profile.email}</p>
      <h1 className="mt-3 font-serif text-3xl font-black md:text-5xl">Your orders</h1>

      {myOrders.length === 0 ? (
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          No orders found yet for this account. Once you place one, it'll show up here automatically.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {myOrders.map((order) => (
            <div key={order.id} className="relative bg-secondary p-6 transition-colors hover:bg-secondary/70">
              <Link href={`/track/${order.id}`} className="absolute inset-0" aria-label={`View order ${order.orderNumber}`} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{order.orderNumber}</p>
                <p className="text-sm font-bold">{formatPKR(order.total)}</p>
              </div>

              <OrderStatusTimeline status={order.status} className="mt-6" />

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
                <div>
                  <p className="text-muted-foreground">Payment</p>
                  <p className="font-bold capitalize">{order.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p className="font-bold">{order.city}</p>
                </div>
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <div>
                    <p className="text-muted-foreground">Delivery</p>
                    <p className="font-bold text-primary">Delivered by: {getDeliveryWindow(new Date(order.createdAt))}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Tracking</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{order.trackingNumber ?? "Assigned after dispatch"}</p>
                    {order.trackingNumber && (
                      <a
                        href={`https://parcelsapp.com/en/tracking/${encodeURIComponent(order.trackingNumber)}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Track shipment on courier site"
                        className="relative z-10 text-primary"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Placed</p>
                  <p className="font-bold">{new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" })}</p>
                </div>
              </div>

              {order.status === "placed" && Date.now() - new Date(order.createdAt).getTime() <= CANCELLABLE_WINDOW_MS && (
                <div className="relative z-10 mt-5 border-t border-border pt-4">
                  <CancelOrderButton orderId={order.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}