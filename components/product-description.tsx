import { BadgeCheck, Palette, RotateCcw, ShieldCheck, Sparkles } from "lucide-react"

const GENERIC_POINTS = [
  { icon: Sparkles, text: "Original product images — what you see is exactly what you will receive." },
  { icon: Palette, text: "Color representation is kept as close as possible to the actual product (lighting may slightly affect how color appears)." },
  { icon: ShieldCheck, text: "100% authentic — every item is carefully inspected by our quality team." },
  { icon: BadgeCheck, text: "Authentic item — we do not deal in copies or replicas." },
  { icon: RotateCcw, text: "7-day easy return or exchange available in case of size issues or if the product does not meet your expectations." },
]

export function ProductDescription({ description }: { description?: string | null }) {
  if (description && description.trim()) {
    return <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{description}</p>
  }

  return (
    <div>
      <p className="text-sm font-semibold text-foreground">Pre-owned (pre-loved) item.</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {GENERIC_POINTS.map((point) => (
          <li key={point.text} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
            <point.icon size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>{point.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}