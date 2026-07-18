"use server"

import { z } from "zod"
import { and, eq, gt, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { orderItems, orders, products } from "@/lib/db/schema"
import { getSessionUser, getSessionProfile, requireAdminAction } from "@/lib/auth-helpers"
import { getOrCreateProfile } from "@/lib/profiles"
import { ORDER_STATUSES } from "@/lib/order-status"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { notifyNewOrder, notifyOrderConfirmed } from "@/lib/slack"

const CONFIRMATION_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const checkoutSchema = z.object({ customerName: z.string().min(2), email: z.email(), phone: z.string().regex(/^03\d{9}$/), city: z.string().min(2), addressLine: z.string().min(8), postalCode: z.string().optional(), paymentMethod: z.enum(["cod", "bank"]), notes: z.string().optional(), items: z.array(z.object({ id: z.string(), name: z.string(), size: z.string(), price: z.number().int().positive(), imageUrl: z.string() })).min(1), shippingFee: z.number().int().nonnegative() })

export async function createOrder(input: z.infer<typeof checkoutSchema>): Promise<{ error: string } | { orderNumber: string; total: number; paymentMethod: "cod" | "bank" }> {
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
        const [claimed] = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - 1` })
          .where(and(eq(products.id, item.id), gt(products.stock, 0)))
          .returning({ id: products.id })
        if (!claimed) throw new Error(`SOLD_OUT:${item.name} (${item.size})`)
      }
      await tx.insert(orders).values({ id, orderNumber, userId: profile.id, customerName: data.customerName, email: data.email, phone: data.phone, city: data.city, addressLine: data.addressLine, postalCode: data.postalCode, paymentMethod: data.paymentMethod, paymentStatus: "pending", status: "placed", isNew: true, subtotal, shippingFee: data.shippingFee, total: subtotal + data.shippingFee, notes: data.notes, confirmationToken, confirmationExpiresAt })
      await tx.insert(orderItems).values(data.items.map((item) => ({ id: crypto.randomUUID(), orderId: id, productId: item.id, productName: item.name, size: item.size, quantity: 1, unitPrice: item.price, imageUrl: item.imageUrl })))
    })
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SOLD_OUT:")) {
      return { error: `${err.message.slice(9)} just sold out — remove it from your bag and try again.` }
    }
    return { error: "We couldn't reach our servers to place your order. Please check your connection and try again in a moment." }
  }

  revalidatePath("/shop")
  revalidatePath("/admin/orders")

  await sendOrderConfirmationEmail({
    to: data.email,
    customerName: data.customerName,
    orderNumber,
    items: data.items.map((item) => ({ name: item.name, size: item.size, price: item.price, imageUrl: item.imageUrl })),
    subtotal,
    shippingFee: data.shippingFee,
    total: subtotal + data.shippingFee,
    confirmationToken,
  })

  await notifyNewOrder({
    orderNumber,
    customerName: data.customerName,
    city: data.city,
    total: subtotal + data.shippingFee,
    paymentMethod: data.paymentMethod,
    items: data.items.map((item) => ({ name: item.name, size: item.size, imageUrl: item.imageUrl })),
  })

  return { orderNumber, total: subtotal + data.shippingFee, paymentMethod: data.paymentMethod }
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

  const [order] = await db.select({ id: orders.id, userId: orders.userId, status: orders.status, createdAt: orders.createdAt }).from(orders).where(eq(orders.id, orderId))
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
    })
  } catch (err) {
    if (err instanceof Error && err.message === "STATUS_CHANGED") {
      return { error: "This order can no longer be cancelled — its status has already changed." }
    }
    throw err
  }

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
    .select({ status: orders.status, trackingNumber: orders.trackingNumber, orderNumber: orders.orderNumber, customerName: orders.customerName })
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
    }
  })

  if (status === "confirmed" && existing.status !== "confirmed") {
    await notifyOrderConfirmed({ orderNumber: existing.orderNumber, customerName: existing.customerName, via: "admin" })
  }

  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/shop")
  revalidatePath("/track")
  return { success: true }
}