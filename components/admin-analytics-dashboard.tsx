"use client"

import { useState, useTransition } from "react"
import { getOrderAnalytics, type OrderAnalytics, type OrderStatusFilter } from "@/app/actions/analytics"
import type { AnalyticsPeriod } from "@/lib/date-range"
import { formatPKR } from "@/lib/store-data"
import { ExportCsvButton } from "@/components/export-csv-button"

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
]

// UI label -> real orders.status value. "Returned" has no matching status yet, so it always shows 0.
const STATUS_FILTERS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "placed", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

const BREAKDOWN_CARDS: { key: keyof OrderAnalytics["statusBreakdown"] | "returned"; label: string }[] = [
  { key: "placed", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
]

const selectClass = "h-11 border border-border bg-card px-3 text-xs font-bold uppercase tracking-wider"

export function AdminAnalyticsDashboard({ initialData }: { initialData: OrderAnalytics }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("7d")
  const [status, setStatus] = useState<OrderStatusFilter>("all")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [data, setData] = useState<OrderAnalytics>(initialData)
  const [isPending, startTransition] = useTransition()

  function refresh(next: { period?: AnalyticsPeriod; status?: OrderStatusFilter; from?: string; to?: string }) {
    const nextPeriod = next.period ?? period
    const nextStatus = next.status ?? status
    const nextFrom = next.from ?? customFrom
    const nextTo = next.to ?? customTo

    startTransition(async () => {
      const result = await getOrderAnalytics({
        period: nextPeriod,
        status: nextStatus,
        from: nextPeriod === "custom" ? nextFrom : undefined,
        to: nextPeriod === "custom" ? nextTo : undefined,
      })
      setData(result)
    })
  }

  function handlePeriodChange(value: AnalyticsPeriod) {
    setPeriod(value)
    if (value !== "custom") refresh({ period: value })
  }

  function handleStatusChange(value: OrderStatusFilter) {
    setStatus(value)
    refresh({ status: value })
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return
    refresh({ period: "custom", from: customFrom, to: customTo })
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Period</label>
          <select className={selectClass} value={period} onChange={(e) => handlePeriodChange(e.target.value as AnalyticsPeriod)}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Status</label>
          <select className={selectClass} value={status} onChange={(e) => handleStatusChange(e.target.value as OrderStatusFilter)}>
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {period === "custom" && (
          <>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">From</label>
              <input type="date" className={selectClass} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">To</label>
              <input type="date" className={selectClass} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
            <button
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo}
              className="h-11 bg-primary px-4 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </>
        )}

        {isPending && <p className="pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Updating...</p>}

        <div className="ml-auto pb-1">
          <ExportCsvButton
            target={{ type: "analytics", filters: { period, status, from: period === "custom" ? customFrom : undefined, to: period === "custom" ? customTo : undefined } }}
            filename={`analytics-${period}-${status}-${new Date().toISOString().slice(0, 10)}.csv`}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-background p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Total revenue {status === "all" ? "(excl. cancelled)" : ""}
          </p>
          <p className="mt-3 font-serif text-3xl font-black">{formatPKR(data.revenue)}</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Order count</p>
          <p className="mt-3 font-serif text-3xl font-black">{data.orderCount}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-2xl font-black">Orders by status</h2>
        <p className="mt-1 text-xs text-muted-foreground">For the selected period, regardless of the status filter above.</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {BREAKDOWN_CARDS.map((card) => (
            <div key={card.key} className="bg-background p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
              <p className="mt-2 font-serif text-2xl font-black">
                {card.key === "returned" ? 0 : data.statusBreakdown[card.key as keyof OrderAnalytics["statusBreakdown"]]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}