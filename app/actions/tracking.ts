"use server"

import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"

export async function trackOrder(orderNumber: string, phone: string) {
  const [order] = await db.select({ orderNumber: orders.orderNumber, status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total, city: orders.city, trackingNumber: orders.trackingNumber, createdAt: orders.createdAt }).from(orders).where(and(eq(orders.orderNumber, orderNumber.trim().toUpperCase()), eq(orders.phone, phone.trim())))
  return order ?? null
}
