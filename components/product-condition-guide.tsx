import Link from "next/link"
import { CONDITION_GRADES } from "@/lib/condition-grades"

export function ProductConditionGuide({ condition }: { condition: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {CONDITION_GRADES.map((grade) => {
        const isCurrent = grade.label === condition
        return (
          <div key={grade.label} className={`flex gap-3 border p-3 text-sm ${isCurrent ? "border-primary bg-primary/5" : "border-border"}`}>
            <span className={`shrink-0 font-product text-xs font-bold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>{grade.code}</span>
            <div>
              <p className={`font-bold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                {grade.label} {isCurrent && <span className="ml-1 text-[10px] font-bold uppercase tracking-wider">This pair</span>}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{grade.summary}</p>
            </div>
          </div>
        )
      })}
      <Link href="/condition-guide" className="mt-1 text-xs font-bold uppercase tracking-wider text-primary underline underline-offset-2">
        Read the full condition guide
      </Link>
    </div>
  )
}
