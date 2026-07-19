import type { Metadata } from "next"
import { Ruler } from "lucide-react"

export const metadata: Metadata = { title: "Size guide" }

const MEN = [
  { us: "6", uk: "5.5", eu: "39", cm: "24" },
  { us: "7", uk: "6", eu: "40", cm: "25" },
  { us: "7.5", uk: "6.5", eu: "40.5", cm: "25.5" },
  { us: "8", uk: "7", eu: "41", cm: "26" },
  { us: "8.5", uk: "7.5", eu: "42", cm: "26.5" },
  { us: "9", uk: "8", eu: "42.5", cm: "27" },
  { us: "9.5", uk: "8.5", eu: "43", cm: "27.5" },
  { us: "10", uk: "9", eu: "44", cm: "28" },
  { us: "10.5", uk: "9.5", eu: "44.5", cm: "28.5" },
  { us: "11", uk: "10", eu: "45", cm: "29" },
  { us: "12", uk: "11", eu: "46", cm: "30" },
  { us: "13", uk: "12", eu: "47", cm: "31" },
]

const WOMEN = [
  { us: "5", uk: "2.5", eu: "35.5", cm: "22" },
  { us: "5.5", uk: "3", eu: "36", cm: "22.5" },
  { us: "6", uk: "3.5", eu: "36.5", cm: "23" },
  { us: "6.5", uk: "4", eu: "37.5", cm: "23.5" },
  { us: "7", uk: "4.5", eu: "38", cm: "24" },
  { us: "7.5", uk: "5", eu: "38.5", cm: "24.5" },
  { us: "8", uk: "5.5", eu: "39", cm: "25" },
  { us: "8.5", uk: "6", eu: "40", cm: "25.5" },
  { us: "9", uk: "6.5", eu: "40.5", cm: "26" },
  { us: "9.5", uk: "7", eu: "41", cm: "26.5" },
  { us: "10", uk: "7.5", eu: "42", cm: "27" },
  { us: "11", uk: "8.5", eu: "43", cm: "28" },
]

const KIDS = [
  { us: "10.5C", uk: "10", eu: "27", cm: "16.5" },
  { us: "11C", uk: "10.5", eu: "28", cm: "17" },
  { us: "12C", uk: "11", eu: "29", cm: "17.5" },
  { us: "13C", uk: "12", eu: "30", cm: "18" },
  { us: "1Y", uk: "13", eu: "32", cm: "19" },
  { us: "2Y", uk: "1", eu: "33", cm: "20" },
  { us: "3Y", uk: "2", eu: "34", cm: "21" },
  { us: "4Y", uk: "3", eu: "36", cm: "22" },
  { us: "5Y", uk: "4", eu: "37", cm: "23" },
  { us: "6Y", uk: "5", eu: "38", cm: "24" },
]

function SizeTable({ rows }: { rows: { us: string; uk: string; eu: string; cm: string }[] }) {
  return (
    <div className="mt-4 overflow-x-auto border border-border">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="border-b border-border bg-secondary text-xs uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-4 py-3">US</th>
            <th className="px-4 py-3">UK</th>
            <th className="px-4 py-3">EU</th>
            <th className="px-4 py-3">CM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.us} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 font-bold">{row.us}</td>
              <td className="px-4 py-3">{row.uk}</td>
              <td className="px-4 py-3">{row.eu}</td>
              <td className="px-4 py-3">{row.cm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SizeGuidePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Find your fit</p>
      <h1 className="mt-3 text-balance font-serif text-5xl font-black leading-none md:text-6xl">Size guide.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Every listing shows the exact size of that specific pair. Use the tables below to convert between US, UK, EU,
        and centimeters — since fit can vary slightly by brand and era, we always recommend checking the condition
        notes on each product page too.
      </p>

      <div className="mt-12">
        <h2 className="font-serif text-3xl font-black">Men&apos;s sizing</h2>
        <SizeTable rows={MEN} />
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-3xl font-black">Women&apos;s sizing</h2>
        <SizeTable rows={WOMEN} />
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-3xl font-black">Kids&apos; sizing</h2>
        <SizeTable rows={KIDS} />
      </div>

      <div className="mt-12 bg-secondary p-6 md:p-8">
        <div className="flex items-start gap-4">
          <Ruler size={28} className="mt-1 shrink-0 text-accent" />
          <div>
            <h2 className="font-serif text-2xl font-black">How to measure your foot</h2>
            <ol className="mt-4 flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <li><span className="font-bold text-foreground">1.</span> Place a sheet of paper on the floor against a wall, then stand on it with your heel touching the wall.</li>
              <li><span className="font-bold text-foreground">2.</span> Mark the tip of your longest toe on the paper, then measure the distance from the wall to that mark in centimeters.</li>
              <li><span className="font-bold text-foreground">3.</span> Measure both feet — use the larger measurement, since feet are rarely perfectly symmetrical.</li>
              <li><span className="font-bold text-foreground">4.</span> Match your measurement to the closest CM value in the tables above to find your size.</li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              For a snugger or roomier fit, size down or up by half a size from your measured result.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}