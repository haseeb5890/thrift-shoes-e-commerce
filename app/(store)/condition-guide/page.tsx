import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { CONDITION_GRADES } from "@/lib/condition-grades"

export const metadata: Metadata = { title: "Condition guide" }

export default function ConditionGuidePage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">How we grade</p>
      <h1 className="mt-3 text-balance font-serif text-4xl font-black leading-none md:text-6xl">
        One pair, one honest grade.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Every pair on Prime Soles goes through the same 30+ point inspection before it's listed. We don't use stock
        photos or generic descriptions — the grade on each product page describes exactly what to expect from that
        exact pair.
      </p>

      <div className="mt-12 flex flex-col divide-y divide-border border-y border-border">
        {CONDITION_GRADES.map((grade) => (
          <div key={grade.label} className="grid gap-4 py-8 md:grid-cols-[auto_1fr] md:gap-10">
            <div className="flex items-start gap-4 md:w-40">
              <span className="font-serif text-3xl font-black text-primary">{grade.code}</span>
              <Link href={`/shop?condition=${encodeURIComponent(grade.label)}`} className="group md:hidden">
                <h2 className="font-serif text-2xl font-black leading-tight underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-primary">
                  {grade.label}
                </h2>
              </Link>
            </div>
            <div>
              <Link href={`/shop?condition=${encodeURIComponent(grade.label)}`} className="group hidden items-baseline gap-3 md:flex">
                <h2 className="font-serif text-3xl font-black leading-tight underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-primary">
                  {grade.label}
                </h2>
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