"use server"

import { and, eq, gte, lte, ne, sql, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { requireAdminAction } from "@/lib/auth-helpers"
import { ORDER_STATUSES } from "@/lib/order-status"
import { toCsv } from "@/lib/csv"
import { resolveDateRange, type AnalyticsPeriod } from "@/lib/date-range"

export type OrderStatusFilter = "all" | (typeof ORDER_STATUSES)[number]

export type OrderAnalytics = {
  revenue: number
  orderCount: number
  statusBreakdown: Record<(typeof ORDER_STATUSES)[number], number>
  from: string
  to: string
}

/**
 * Order + revenue analytics for the admin dashboard.
 *
 * Status label mapping (real orders.status values kept as-is, per product decision):
 *   Pending   -> "placed"
 *   Completed -> "delivered"
 *   Cancelled -> "cancelled"
 *   Returned  -> no matching status exists yet; always returns 0 until that status is introduced.
 *
 * Revenue excludes cancelled orders when no specific status filter is applied (cancelled orders
 * aren't real revenue). If a specific status is selected — including "cancelled" — revenue reflects
 * exactly that status's order totals (useful for seeing revenue lost to cancellations).
 */
export async function getOrderAnalytics(input: {
  period: AnalyticsPeriod
  from?: string
  to?: string
  status?: OrderStatusFilter
}): Promise<OrderAnalytics> {
  await requireAdminAction()

  const { from, to } = resolveDateRange(input.period, input.from, input.to)
  const dateCondition = and(gte(orders.createdAt, from), lte(orders.createdAt, to))

  const hasStatusFilter = input.status && input.status !== "all"
  const revenueCondition = hasStatusFilter
    ? and(dateCondition, eq(orders.status, input.status as (typeof ORDER_STATUSES)[number]))
    : and(dateCondition, ne(orders.status, "cancelled"))

  const [[revenueRow], breakdownRows] = await Promise.all([
    db
      .select({
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(revenueCondition),
    db
      .select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders)
      .where(dateCondition)
      .groupBy(orders.status),
  ])

  const statusBreakdown = ORDER_STATUSES.reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as OrderAnalytics["statusBreakdown"],
  )
  for (const row of breakdownRows) {
    if ((ORDER_STATUSES as readonly string[]).includes(row.status)) {
      statusBreakdown[row.status as (typeof ORDER_STATUSES)[number]] = row.count
    }
  }

  return {
    revenue: revenueRow?.revenue ?? 0,
    orderCount: revenueRow?.orderCount ?? 0,
    statusBreakdown,
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

export async function exportAnalyticsCsv(input: { period: AnalyticsPeriod; from?: string; to?: string; status?: OrderStatusFilter }): Promise<string> {
  await requireAdminAction()
  const { from, to } = resolveDateRange(input.period, input.from, input.to)
  const dateCondition = and(gte(orders.createdAt, from), lte(orders.createdAt, to))
  const hasStatusFilter = input.status && input.status !== "all"
  const where = hasStatusFilter ? and(dateCondition, eq(orders.status, input.status as (typeof ORDER_STATUSES)[number])) : dateCondition

  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt))
  return toCsv(rows, [
    { key: "orderNumber", label: "Order Number" },
    { key: "customerName", label: "Customer" },
    { key: "city", label: "City" },
    { key: "status", label: "Status" },
    { key: "paymentMethod", label: "Payment Method" },
    { key: "total", label: "Total" },
    { key: "createdAt", label: "Placed At" },
  ])
}