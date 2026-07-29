"use server"

import { z } from "zod"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { orderItems, orders, products, promoCodes } from "@/lib/db/schema"
import { getSessionUser, getSessionProfile, requireAdminAction } from "@/lib/auth-helpers"
import { getOrCreateProfile } from "@/lib/profiles"
import { ORDER_STATUSES } from "@/lib/order-status"
import { sendOrderConfirmationEmail, sendOrderConfirmedEmail, sendOrderCancelledEmail } from "@/lib/email"
import { notifyNewOrder, notifyOrderConfirmed } from "@/lib/slack"
import { sendConversionEvent } from "@/lib/meta-conversions-api"
import { toCsv } from "@/lib/csv"

const CONFIRMATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const checkoutSchema = z.object({ customerName: z.string().min(2), email: z.email(), phone: z.string().regex(/^03\d{9}$/), city: z.string().min(2), addressLine: z.string().min(8), postalCode: z.string().optional(), paymentMethod: z.enum(["cod", "bank"]), notes: z.string().optional(), items: z.array(z.object({ id: z.string(), slug: z.string(), name: z.string(), size: z.string(), price: z.number().int().positive(), imageUrl: z.string() })).min(1), shippingFee: z.number().int().nonnegative(), promoCode: z.string().optional() })

export async function createOrder(
  input: z.infer<typeof checkoutSchema>,
  opts?: { source?: "customer" | "admin" },
): Promise<{ error: string } | { orderNumber: string; total: number; paymentMethod: "cod" | "bank" }> {
  let data: z.infer<typeof checkoutSchema>
  try {
    data = checkoutSchema.parse(input)
  } catch {
    return { error: "Please check your details. Use a Pakistan mobile number such as 03001234567." }
  }

  const sessionUser = await getSessionUser().catch(() => null)
  const id = crypto.randomUUID()
  const orderNumber = `RLP-${Date.now().toString().slice(-7)}`
  const subtotal = data.items.reduce((sum, item) => sum + item.price, 0)
  const confirmationToken = crypto.randomUUID()
  const confirmationExpiresAt = new Date(Date.now() + CONFIRMATION_TOKEN_TTL_MS)
  let discountAmount = 0
  let appliedPromoCode: string | null = null

  try {
    await db.transaction(async (tx) => {
      // Resolve (or create) the profile for this email first — this is the same path
      // for guests and logged-in users, so orders always link to a stable profile id
      // rather than directly to a Supabase auth id.
      const isCurrentSessionEmail = sessionUser?.email?.toLowerCase() === data.email.trim().toLowerCase()
      const profile = await getOrCreateProfile(tx,{
        email: data.email,
        fullName: data.customerName,
        phone: data.phone,
        authUserId: isCurrentSessionEmail ? sessionUser!.id : null,
      })

      for (const item of data.items) {
        // Stamps soldAt the instant stock actually hits 0 — this is what the sold-product
        // storage-cleanup cron (app/api/cron/cleanup-sold-products) measures its grace period from.
        const [claimed] = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - 1`, soldAt: sql`case when ${products.stock} - 1 <= 0 then now() else ${products.soldAt} end` })
          .where(and(eq(products.id, item.id), gt(products.stock, 0)))
          .returning({ id: products.id })
        if (!claimed) throw new Error(`SOLD_OUT:${item.name} (${item.size})`)
      }

      // Same atomic "claim under a WHERE guard" pattern as the stock decrement above — the
      // UPDATE only succeeds if a ticket is still available, so two concurrent checkouts can
      // never both redeem the last one.
      if (data.promoCode?.trim()) {
        const normalizedCode = data.promoCode.trim().toUpperCase()
        const [claimed] = await tx
          .update(promoCodes)
          .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
          .where(and(eq(promoCodes.code, normalizedCode), eq(promoCodes.isActive, true), sql`${promoCodes.usedCount} < ${promoCodes.maxUses}`))
          .returning({ discountPercent: promoCodes.discountPercent })
        if (!claimed) throw new Error(`PROMO_INVALID:${normalizedCode}`)
        discountAmount = Math.round((subtotal * claimed.discountPercent) / 100)
        appliedPromoCode = normalizedCode
      }

      const total = subtotal + data.shippingFee - discountAmount
      await tx.insert(orders).values({ id, orderNumber, userId: profile.id, customerName: data.customerName, email: data.email, phone: data.phone, city: data.city, addressLine: data.addressLine, postalCode: data.postalCode, paymentMethod: data.paymentMethod, paymentStatus: "pending", status: "placed", isNew: true, source: opts?.source ?? "customer", subtotal, shippingFee: data.shippingFee, promoCode: appliedPromoCode, discountAmount, total, notes: data.notes, confirmationToken, confirmationExpiresAt })
      await tx.insert(orderItems).values(data.items.map((item) => ({ id: crypto.randomUUID(), orderId: id, productId: item.id, productSlug: item.slug, productName: item.name, size: item.size, quantity: 1, unitPrice: item.price, imageUrl: item.imageUrl })))
    })
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SOLD_OUT:")) {
      return { error: `${err.message.slice(9)} just sold out — remove it from your bag and try again.` }
    }
    if (err instanceof Error && err.message.startsWith("PROMO_INVALID:")) {
      return { error: "That promo code is invalid or has been fully redeemed. Remove it and try again." }
    }
    return { error: "We couldn't reach our servers to place your order. Please check your connection and try again in a moment." }
  }

  const total = subtotal + data.shippingFee - discountAmount

  revalidatePath("/shop")
  revalidatePath("/admin/orders")

  const requestHeaders = await headers()

  // The order is already committed — email + Slack + the Meta Conversions API call are side
  // effects, not required for the response, so run them concurrently instead of stacking their
  // latency onto the checkout. This Purchase event is the server-side half of the pair with the
  // browser Pixel's own Purchase call in checkout-form.tsx — they share `orderNumber` as the
  // event_id so Meta dedupes them into one instead of double-counting the sale.
  await Promise.all([
    sendOrderConfirmationEmail({
      to: data.email,
      customerName: data.customerName,
      orderNumber,
      items: data.items.map((item) => ({ name: item.name, size: item.size, price: item.price, imageUrl: item.imageUrl })),
      subtotal,
      shippingFee: data.shippingFee,
      total,
      discountAmount,
      promoCode: appliedPromoCode,
      confirmationToken,
    }),
    notifyNewOrder({
      orderNumber,
      customerName: data.customerName,
      city: data.city,
      total,
      paymentMethod: data.paymentMethod,
      items: data.items.map((item) => ({ slug: item.slug, name: item.name, size: item.size, imageUrl: item.imageUrl })),
    }),
    sendConversionEvent({
      eventName: "Purchase",
      eventId: orderNumber,
      eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout`,
      userAgent: requestHeaders.get("user-agent"),
      email: data.email,
      phone: data.phone,
      value: total,
      currency: "PKR",
    }),
  ])

  return { orderNumber, total, paymentMethod: data.paymentMethod }
}

/**
 * Admin buys a product from their own catalog (e.g. taking personal stock, a write-off, or
 * recording an offline sale). Reuses createOrder entirely — same profile linking, stock claim
 * (including the soldAt stamp the cleanup cron depends on), confirmation email, Slack alert,
 * and Meta Conversions API Purchase event — so it's indistinguishable from a real order except
 * for `source: "admin"`, which drives the badge in /admin/orders and is included in Analytics
 * revenue/order-count per product decision.
 *
 * Note: this also fires a Meta Purchase conversion event like any other order. If that's not
 * desired for internal purchases (it will affect ad-performance reporting), flag it and this
 * can be made conditional on source.
 */
export async function createAdminOrder(
  productId: string,
  pricePaid: number,
  notes?: string,
): Promise<{ error: string } | { orderNumber: string; total: number; paymentMethod: "cod" | "bank" }> {
  const admin = await requireAdminAction()

  const [product] = await db.select().from(products).where(eq(products.id, productId))
  if (!product) return { error: "Product not found." }
  if (product.stock <= 0) return { error: "This product is already sold." }
  if (!Number.isInteger(pricePaid) || pricePaid <= 0) return { error: "Enter a valid amount." }

  return createOrder(
    {
      customerName: (admin.user_metadata?.name as string | undefined) ?? "Store Admin",
      email: admin.email!,
      phone: "03000000000", // internal transaction — not a real customer phone
      city: "Karachi",
      addressLine: "Admin self-purchase",
      paymentMethod: "cod",
      notes: notes || "Recorded via Buy as Admin",
      shippingFee: 0,
      items: [{ id: product.id, slug: product.slug, name: product.name, size: product.size, price: pricePaid, imageUrl: product.imageUrl }],
    },
    { source: "admin" },
  )
}

const CANCELLABLE_WINDOW_MS = 2 * 60 * 60 * 1000 // 2 hours

/**
 * Customer-initiated order cancellation.
 *
 * Security-critical: this must not trust a "check then act" pattern, since an admin could
 * change the order's status in the gap between a SELECT and a subsequent UPDATE. Instead,
 * the status transition itself is atomic — the UPDATE's WHERE clause requires status = "placed",
 * and we only proceed with the stock reversion if that UPDATE actually affected a row. This
 * guarantees a customer can never cancel (and never trigger a stock revert for) an order the
 * admin has already moved to processing/shipped/delivered/cancelled, even under concurrent access.
 */
export async function cancelOrderAsCustomer(orderId: string): Promise<{ error: string } | { success: true }> {
  const profile = await getSessionProfile()
  if (!profile) return { error: "You must be signed in to cancel an order." }

  const [order] = await db
    .select({ id: orders.id, userId: orders.userId, status: orders.status, createdAt: orders.createdAt, orderNumber: orders.orderNumber, customerName: orders.customerName, email: orders.email, promoCode: orders.promoCode })
    .from(orders)
    .where(eq(orders.id, orderId))
  if (!order) return { error: "Order not found." }

  // Ownership check — never let a customer touch an order that isn't theirs, regardless of status/timing.
  if (order.userId !== profile.id) return { error: "You don't have permission to cancel this order." }

  if (Date.now() - new Date(order.createdAt).getTime() > CANCELLABLE_WINDOW_MS) {
    return { error: "This order can only be cancelled within 2 hours of placing it." }
  }

  try {
    await db.transaction(async (tx) => {
      const [cancelled] = await tx
        .update(orders)
        .set({ status: "cancelled", isNew: false, updatedAt: new Date() })
        .where(and(eq(orders.id, orderId), eq(orders.status, "placed")))
        .returning({ id: orders.id })

      // No row returned means the status changed (e.g. admin marked it processing) between
      // our check above and this statement — treat as no longer cancellable, don't touch stock.
      if (!cancelled) throw new Error("STATUS_CHANGED")

      const items = await tx.select({ productId: orderItems.productId }).from(orderItems).where(eq(orderItems.orderId, orderId))
      for (const item of items) {
        await tx.update(products).set({ stock: sql`${products.stock} + 1` }).where(eq(products.id, item.productId))
      }
      if (order.promoCode) {
        await tx.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} - 1` }).where(eq(promoCodes.code, order.promoCode))
      }
    })
  } catch (err) {
    if (err instanceof Error && err.message === "STATUS_CHANGED") {
      return { error: "This order can no longer be cancelled — its status has already changed." }
    }
    throw err
  }

  await sendOrderCancelledEmail({ to: order.email, customerName: order.customerName, orderNumber: order.orderNumber })

  revalidatePath("/track")
  revalidatePath("/admin/orders")
  revalidatePath("/shop")
  return { success: true }
}

export async function resendOrderConfirmationEmail(orderId: string): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) return { error: "Order not found." }
  if (order.status !== "placed") return { error: "Only orders awaiting confirmation can have their confirmation email resent." }

  const confirmationToken = crypto.randomUUID()
  const confirmationExpiresAt = new Date(Date.now() + CONFIRMATION_TOKEN_TTL_MS)
  await db.update(orders).set({ confirmationToken, confirmationExpiresAt, updatedAt: new Date() }).where(eq(orders.id, orderId))

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  await sendOrderConfirmationEmail({
    to: order.email,
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    items: items.map((item) => ({ name: item.productName, size: item.size, price: item.unitPrice, imageUrl: item.imageUrl })),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    confirmationToken,
  })

  return { success: true }
}

export async function updateOrderStatus(
  orderId: string,
  status: (typeof ORDER_STATUSES)[number],
  opts?: { trackingNumber?: string; cancelPin?: string }
): Promise<{ error: string } | { success: true }> {
  await requireAdminAction()
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status")

  const [existing] = await db
    .select({
      status: orders.status,
      trackingNumber: orders.trackingNumber,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      email: orders.email,
      subtotal: orders.subtotal,
      shippingFee: orders.shippingFee,
      total: orders.total,
      promoCode: orders.promoCode,
      discountAmount: orders.discountAmount,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
  if (!existing) throw new Error("Order not found")

  // Cancelled is terminal — stock has already been reverted, so allowing a further
  // transition out of it would let the order's status and inventory drift out of sync.
  if (existing.status === "cancelled") return { error: "This order is cancelled and can no longer be changed." }

  const trackingNumber = opts?.trackingNumber?.trim()
  if (status === "shipped" && !existing.trackingNumber && !trackingNumber) {
    return { error: "Enter a tracking number to mark this order as shipped." }
  }

  if (status === "cancelled" && existing.status !== "cancelled") {
    if (!process.env.ADMIN_CANCEL_PIN || opts?.cancelPin !== process.env.ADMIN_CANCEL_PIN) return { error: "Incorrect PIN." }
  }

  await db.transaction(async (tx) => {
    const patch: Partial<typeof orders.$inferInsert> = { status, isNew: false, updatedAt: new Date() }
    if (trackingNumber) patch.trackingNumber = trackingNumber
    if (status === "confirmed" && existing.status !== "confirmed") {
      patch.confirmedAt = new Date()
      patch.confirmationToken = null
    }
    await tx.update(orders).set(patch).where(eq(orders.id, orderId))
    if (status === "cancelled" && existing.status !== "cancelled") {
      const items = await tx.select({ productId: orderItems.productId }).from(orderItems).where(eq(orderItems.orderId, orderId))
      for (const item of items) {
        await tx.update(products).set({ stock: sql`${products.stock} + 1` }).where(eq(products.id, item.productId))
      }
      if (existing.promoCode) {
        await tx.update(promoCodes).set({ usedCount: sql`${promoCodes.usedCount} - 1` }).where(eq(promoCodes.code, existing.promoCode))
      }
    }
  })

  if (status === "confirmed" && existing.status !== "confirmed") {
    const confirmedItems = await db
      .select({ slug: orderItems.productSlug, name: orderItems.productName, size: orderItems.size, imageUrl: orderItems.imageUrl, unitPrice: orderItems.unitPrice })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
    await Promise.all([
      notifyOrderConfirmed({ orderNumber: existing.orderNumber, customerName: existing.customerName, via: "admin", items: confirmedItems }),
      sendOrderConfirmedEmail({
        to: existing.email,
        customerName: existing.customerName,
        orderNumber: existing.orderNumber,
        items: confirmedItems.map((item) => ({ name: item.name, size: item.size, price: item.unitPrice, imageUrl: item.imageUrl })),
        subtotal: existing.subtotal,
        shippingFee: existing.shippingFee,
        total: existing.total,
        discountAmount: existing.discountAmount,
        promoCode: existing.promoCode,
      }),
    ])
  }

  if (status === "cancelled" && existing.status !== "cancelled") {
    await sendOrderCancelledEmail({ to: existing.email, customerName: existing.customerName, orderNumber: existing.orderNumber })
  }

  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/shop")
  revalidatePath("/track")
  return { success: true }
}
export async function exportOrdersCsv(): Promise<string> {
  await requireAdminAction()
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt))
  return toCsv(rows, [
    { key: "orderNumber", label: "Order Number" },
    { key: "customerName", label: "Customer" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "paymentStatus", label: "Payment Status" },
    { key: "status", label: "Status" },
    { key: "subtotal", label: "Subtotal" },
    { key: "shippingFee", label: "Shipping Fee" },
    { key: "total", label: "Total" },
    { key: "trackingNumber", label: "Tracking Number" },
    { key: "confirmedAt", label: "Confirmed At" },
    { key: "createdAt", label: "Placed At" },
  ])
}