import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) return NextResponse.redirect(`${origin}/order-confirm/error?reason=invalid`)

  const [order] = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, confirmationExpiresAt: orders.confirmationExpiresAt })
    .from(orders)
    .where(eq(orders.confirmationToken, token))

  if (!order) return NextResponse.redirect(`${origin}/order-confirm/error?reason=invalid`)
  if (order.status !== "placed") return NextResponse.redirect(`${origin}/order-confirm/error?reason=already-handled&order=${order.orderNumber}`)
  if (!order.confirmationExpiresAt || order.confirmationExpiresAt < new Date()) {
    return NextResponse.redirect(`${origin}/order-confirm/error?reason=expired&order=${order.orderNumber}`)
  }

  // Race-safe: only flips the row if it's still "placed" at the moment of the UPDATE,
  // mirroring the conditional-update pattern in cancelOrderAsCustomer (app/actions/orders.ts).
  const [updated] = await db
    .update(orders)
    .set({ status: "confirmed", confirmedAt: new Date(), confirmationToken: null, isNew: false, updatedAt: new Date() })
    .where(and(eq(orders.id, order.id), eq(orders.status, "placed")))
    .returning({ orderNumber: orders.orderNumber })

  if (!updated) return NextResponse.redirect(`${origin}/order-confirm/error?reason=already-handled&order=${order.orderNumber}`)

  revalidatePath("/admin/orders")
  revalidatePath("/track")
  return NextResponse.redirect(`${origin}/order-confirm/success?order=${updated.orderNumber}`)
}
