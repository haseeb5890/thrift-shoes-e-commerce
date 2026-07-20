"use client"

import { useTransition } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { exportOrdersCsv } from "@/app/actions/orders"
import { exportProductsCsv, exportUsersCsv } from "@/app/actions/exports"
import { exportAnalyticsCsv, type OrderStatusFilter } from "@/app/actions/analytics"
import type { AnalyticsPeriod } from "@/lib/date-range"

type ExportTarget =
  | { type: "orders" }
  | { type: "products" }
  | { type: "users" }
  | { type: "analytics"; filters: { period: AnalyticsPeriod; status?: OrderStatusFilter; from?: string; to?: string } }

export function ExportCsvButton({ target, filename, label = "Export CSV" }: { target: ExportTarget; filename: string; label?: string }) {
  const [isPending, startTransition] = useTransition()

  function handleExport() {
    startTransition(async () => {
      try {
        let csv: string
        switch (target.type) {
          case "orders":
            csv = await exportOrdersCsv()
            break
          case "products":
            csv = await exportProductsCsv()
            break
          case "users":
            csv = await exportUsersCsv()
            break
          case "analytics":
            csv = await exportAnalyticsCsv(target.filters)
            break
        }
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } catch {
        toast.error("Couldn't export — please try again.")
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isPending}
      className="flex h-11 items-center gap-2 border border-border bg-card px-4 text-xs font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download size={14} />
      {isPending ? "Exporting..." : label}
    </button>
  )
}