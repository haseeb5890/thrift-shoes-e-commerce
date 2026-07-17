"use server"

import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"

export async function trackOrder(orderNumber: string, phone: string) {
  const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total, city: orders.city, trackingNumber: orders.trackingNumber, createdAt: orders.createdAt }).from(orders).where(and(eq(orders.orderNumber, orderNumber.trim().toUpperCase()), eq(orders.phone, phone.trim())))
  return order ?? null
}

// All orders linked to a profile (guest orders that were placed under this email,
// plus anything placed while logged in) — newest first.
export async function getOrdersForProfile(profileId: string) {
  return db
    .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, paymentStatus: orders.paymentStatus, total: orders.total, city: orders.city, trackingNumber: orders.trackingNumber, createdAt: orders.createdAt })
    .from(orders)
    .where(eq(orders.userId, profileId))
    .orderBy(desc(orders.createdAt))
}