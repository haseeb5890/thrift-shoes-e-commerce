"use server"

import { and, eq, gte, lte, ne, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { requireAdminAction } from "@/lib/auth-helpers"
import { ORDER_STATUSES } from "@/lib/order-status"

export type AnalyticsPeriod = "today" | "7d" | "30d" | "custom"
export type OrderStatusFilter = "all" | (typeof ORDER_STATUSES)[number]

export type OrderAnalytics = {
  revenue: number
  orderCount: number
  statusBreakdown: Record<(typeof ORDER_STATUSES)[number], number>
  from: string
  to: string
}

function resolveDateRange(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
  const now = new Date()

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  if (period === "custom") {
    const from = customFrom ? new Date(customFrom) : new Date(0)
    from.setHours(0, 0, 0, 0)
    const to = customTo ? new Date(customTo) : endOfToday
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  if (period === "today") return { from: startOfToday, to: endOfToday }

  // "Last 7/30 days" includes today as one of the days in the window.
  const days = period === "7d" ? 7 : 30
  const from = new Date(startOfToday)
  from.setDate(from.getDate() - (days - 1))
  return { from, to: endOfToday }
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