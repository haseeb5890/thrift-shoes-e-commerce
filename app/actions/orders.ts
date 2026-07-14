"use server"

import { z } from "zod"
import { and, eq, gt, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { orderItems, orders, products } from "@/lib/db/schema"
import { getSessionUser, requireAdminAction } from "@/lib/auth-helpers"

const checkoutSchema = z.object({ customerName: z.string().min(2), email: z.email(), phone: z.string().regex(/^03\d{9}$/), city: z.string().min(2), addressLine: z.string().min(8), postalCode: z.string().optional(), paymentMethod: z.enum(["cod", "bank"]), notes: z.string().optional(), items: z.array(z.object({ id: z.string(), name: z.string(), size: z.string(), price: z.number().int().positive(), imageUrl: z.string() })).min(1), shippingFee: z.number().int().nonnegative() })

export async function createOrder(input: z.infer<typeof checkoutSchema>): Promise<{ error: string } | { orderNumber: string; total: number; paymentMethod: "cod" | "bank" }> {
  const data = checkoutSchema.parse(input)
  const user = await getSessionUser()
  const id = crypto.randomUUID()
  const orderNumber = `RLP-${Date.now().toString().slice(-7)}`
  const subtotal = data.items.reduce((sum, item) => sum + item.price, 0)

  try {
    await db.transaction(async (tx) => {
      for (const item of data.items) {
        const [claimed] = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - 1` })
          .where(and(eq(products.id, item.id), gt(products.stock, 0)))
          .returning({ id: products.id })
        if (!claimed) throw new Error(`SOLD_OUT:${item.name} (${item.size})`)
      }
      await tx.insert(orders).values({ id, orderNumber, userId: user?.id ?? null, customerName: data.customerName, email: data.email, phone: data.phone, city: data.city, addressLine: data.addressLine, postalCode: data.postalCode, paymentMethod: data.paymentMethod, paymentStatus: "pending", status: "placed", subtotal, shippingFee: data.shippingFee, total: subtotal + data.shippingFee, notes: data.notes })
      await tx.insert(orderItems).values(data.items.map((item) => ({ id: crypto.randomUUID(), orderId: id, productId: item.id, productName: item.name, size: item.size, quantity: 1, unitPrice: item.price, imageUrl: item.imageUrl })))
    })
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SOLD_OUT:")) {
      return { error: `${err.message.slice(9)} just sold out — remove it from your bag and try again.` }
    }
    throw err
  }

  revalidatePath("/shop")
  return { orderNumber, total: subtotal + data.shippingFee, paymentMethod: data.paymentMethod }
}

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"] as const

export async function updateOrderStatus(orderId: string, status: (typeof ORDER_STATUSES)[number]) {
  await requireAdminAction()
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status")

  const [existing] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId))
  if (!existing) throw new Error("Order not found")

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId))
    if (status === "cancelled" && existing.status !== "cancelled") {
      const items = await tx.select({ productId: orderItems.productId }).from(orderItems).where(eq(orderItems.orderId, orderId))
      for (const item of items) {
        await tx.update(products).set({ stock: sql`${products.stock} + 1` }).where(eq(products.id, item.productId))
      }
    }
  })

  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/shop")
}
