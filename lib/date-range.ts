export type AnalyticsPeriod = "today" | "7d" | "30d" | "custom"

export function resolveDateRange(period: AnalyticsPeriod, customFrom?: string, customTo?: string) {
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