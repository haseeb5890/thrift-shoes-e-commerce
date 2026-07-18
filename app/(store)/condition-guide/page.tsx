import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { CONDITIONS } from "@/lib/product-options"

export const metadata: Metadata = { title: "Condition guide" }

type Grade = {
  code: string
  label: (typeof CONDITIONS)[number]
  summary: string
  details: string[]
}

const GRADES: Grade[] = [
  {
    code: "01",
    label: "New",
    summary: "Deadstock or worn once, at most. As close to a fresh pair as thrift gets.",
    details: [
      "No visible creasing, scuffing, or discoloration",
      "Original tread pattern fully intact",
      "May or may not include original box",
    ],
  },
  {
    code: "02",
    label: "Excellent",
    summary: "Lightly worn and immaculately kept. Flaws, if any, only show up under close inspection.",
    details: [
      "Faint creasing at most, no visible marks from a normal distance",
      "Sole and lining freshly deep-cleaned by us before listing",
      "Tread close to full depth",
    ],
  },
  {
    code: "03",
    label: "Very Good",
    summary: "Gently worn with honest, minor signs of use. Fully clean and ready to wear.",
    details: [
      "Light creasing on the toe box or minor cosmetic marks",
      "No structural issues — upper, sole, and lining all sound",
      "Sanitized and conditioned before photographing",
    ],
  },
  {
    code: "04",
    label: "Good",
    summary: "Comfortable, broken-in pairs with wear consistent with regular use.",
    details: [
      "Visible creasing and some surface wear on the upper",
      "Tread shows use but still has meaningful life left",
      "Any notable marks are called out specifically in the listing",
    ],
  },
  {
    code: "05",
    label: "Fair",
    summary: "Well-loved pairs, priced to match. Great for breaking in further or heavy rotation.",
    details: [
      "Noticeable wear — creasing, scuffing, or fading",
      "Still structurally solid and comfortable to wear",
      "Always the most detailed condition notes, so there are no surprises",
    ],
  },
]

export default function ConditionGuidePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">How we grade</p>
      <h1 className="mt-3 text-balance font-serif text-5xl font-black leading-none md:text-6xl">
        One pair, one honest grade.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Every pair on Prime Soles goes through the same 30+ point inspection before it's listed. We don't use stock
        photos or generic descriptions — the grade below, and the condition notes on each product page, describe
        the exact pair you'll receive.
      </p>

      <div className="mt-12 flex flex-col divide-y divide-border border-y border-border">
        {GRADES.map((grade) => (
          <div key={grade.label} className="grid gap-4 py-8 md:grid-cols-[auto_1fr] md:gap-10">
            <div className="flex items-start gap-4 md:w-40">
              <span className="font-serif text-3xl font-black text-primary">{grade.code}</span>
              <Link href={`/shop?condition=${encodeURIComponent(grade.label)}`} className="group font-serif text-2xl font-black leading-tight underline decoration-transparent underline-offset-4 transition-colors hover:decoration-primary md:hidden">
                {grade.label}
              </Link>
            </div>
            <div>
              <Link href={`/shop?condition=${encodeURIComponent(grade.label)}`} className="group hidden items-baseline gap-3 md:flex">
                <span className="font-serif text-3xl font-black leading-tight underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-primary">
                  {grade.label}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Shop this grade →
                </span>
              </Link>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{grade.summary}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {grade.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-3 text-sm">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/shop?condition=${encodeURIComponent(grade.label)}`} className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-primary underline underline-offset-2 md:hidden">
                Shop this grade →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-start gap-4 bg-secondary p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-start gap-4">
          <ShieldCheck size={28} className="mt-1 shrink-0 text-accent" />
          <div>
            <p className="font-serif text-xl font-black">Every grade is backed by our inspection.</p>
            <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
              If a pair ever arrives in worse condition than listed, reach out and we'll make it right.
            </p>
          </div>
        </div>
        <Link
          href="/shop"
          className="flex h-12 w-full shrink-0 items-center justify-center bg-primary px-6 font-bold text-primary-foreground md:w-fit"
        >
          Shop all pairs
        </Link>
      </div>
    </section>
  )
}