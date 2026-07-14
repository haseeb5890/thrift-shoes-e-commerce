"use server"

import { z } from "zod"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { getSessionUser, requireAdminAction } from "@/lib/auth-helpers"

const checkoutSchema = z.object({ customerName: z.string().min(2), email: z.email(), phone: z.string().regex(/^03\d{9}$/), city: z.string().min(2), addressLine: z.string().min(8), postalCode: z.string().optional(), paymentMethod: z.enum(["cod", "bank"]), notes: z.string().optional(), items: z.array(z.object({ id: z.string(), name: z.string(), size: z.string(), price: z.number().int().positive(), imageUrl: z.string() })).min(1), shippingFee: z.number().int().nonnegative() })

export async function createOrder(input: z.infer<typeof checkoutSchema>) {
  const data = checkoutSchema.parse(input)
  const user = await getSessionUser()
  const id = crypto.randomUUID()
  const orderNumber = `RLP-${Date.now().toString().slice(-7)}`
  const subtotal = data.items.reduce((sum, item) => sum + item.price, 0)
  await db.insert(orders).values({ id, orderNumber, userId: user?.id ?? null, customerName: data.customerName, email: data.email, phone: data.phone, city: data.city, addressLine: data.addressLine, postalCode: data.postalCode, paymentMethod: data.paymentMethod, paymentStatus: "pending", status: "placed", subtotal, shippingFee: data.shippingFee, total: subtotal + data.shippingFee, notes: data.notes })
  await db.insert(orderItems).values(data.items.map((item) => ({ id: crypto.randomUUID(), orderId: id, productId: item.id, productName: item.name, size: item.size, quantity: 1, unitPrice: item.price, imageUrl: item.imageUrl })))
  return { orderNumber, total: subtotal + data.shippingFee, paymentMethod: data.paymentMethod }
}

const ORDER_STATUSES = ["placed", "processing", "shipped", "delivered", "cancelled"] as const

export async function updateOrderStatus(orderId: string, status: (typeof ORDER_STATUSES)[number]) {
  await requireAdminAction()
  if (!ORDER_STATUSES.includes(status)) throw new Error("Invalid status")
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId))
  revalidatePath("/admin")
  revalidatePath("/admin/orders")
}
