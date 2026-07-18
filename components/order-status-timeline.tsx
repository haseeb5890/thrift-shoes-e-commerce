const STEPS = [
  { key: "placed", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const

export function OrderStatusTimeline({ status, className = "" }: { status: string; className?: string }) {
  if (status === "cancelled") {
    return (
      <div className={`border border-destructive px-4 py-3 text-xs text-red font-bold uppercase tracking-wider text-destructive ${className}`}>
        Order cancelled
      </div>
    )
  }

  const activeIndex = Math.max(0, STEPS.findIndex((step) => step.key === status))

  return (
    <ol className={`flex items-start ${className}`}>
      {STEPS.map((step, index) => {
        const done = index <= activeIndex
        const isLast = index === STEPS.length - 1
        return (
          <li key={step.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              {!isLast && <div className={`h-0.5 flex-1 ${index < activeIndex ? "bg-primary" : "bg-border"}`} />}
            </div>
            <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${done ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}