import type { Metadata } from "next"
import { Phone, ShieldAlert } from "lucide-react"

export const metadata: Metadata = { title: "Return policy" }

const NOT_COVERED = [
  "Change of mind, or the item being less appealing in person than expected",
  "Normal, pre-disclosed signs of wear already described in the condition grade and notes",
  "Minor lighting/color variation between photos and the physical item",
  "Damage that occurred after delivery, from use or improper handling",
]

export default function ReturnPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Buyer protection</p>
      <h1 className="mt-3 text-balance font-serif text-5xl font-black leading-none md:text-6xl">Return policy.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Every pair is individually inspected, photographed, and listed with an honest condition grade and notes
        before it ever goes up for sale. Because of that, we don't accept general returns or exchanges — a refund
        or return is only available if what arrived doesn't match what you ordered or what was shown.
      </p>

      <div className="mt-10 flex flex-col divide-y divide-border border-y border-border">
        <div className="py-6 first:pt-0">
          <h2 className="font-serif text-2xl font-black">1. When a claim is accepted</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            We'll accept a refund or return claim only if one of the following is true:
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>The <strong className="text-foreground">size shipped doesn't match the size you ordered</strong>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>The <strong className="text-foreground">condition of the item received doesn't match</strong> the product photos, video, and condition notes shown on the listing at the time of purchase.</span>
            </li>
          </ul>
        </div>

        <div className="py-6">
          <h2 className="font-serif text-2xl font-black">2. How to file a claim</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Contact us within <strong className="text-foreground">24 hours of delivery</strong> at{" "}
            <a href="tel:+923413907007" className="font-bold text-foreground underline underline-offset-2">
              0341 3907007
            </a>{" "}
            with your order number and clear photos or video of the item as received, showing the size tag or the
            specific discrepancy in condition. Claims made after 24 hours, or without supporting photo/video
            evidence, may not be accepted — condition disputes become difficult to verify with time or once an
            item has been worn.
          </p>
        </div>

        <div className="py-6">
          <h2 className="font-serif text-2xl font-black">3. What isn't covered</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-6 text-muted-foreground">
            {NOT_COVERED.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="py-6">
          <h2 className="font-serif text-2xl font-black">4. Shipping costs</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            If your claim is approved because we shipped the wrong item or size, or the condition genuinely didn't
            match the listing, we cover return shipping and either send the correct item or process a refund at no
            cost to you. If a claim isn't approved, return shipping isn't reimbursed.
          </p>
        </div>

        <div className="py-6">
          <h2 className="font-serif text-2xl font-black">5. Refunds</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Once we receive and verify the returned item confirms the reported discrepancy, we process your refund
            within 7 business days to your original payment method. Shipping costs are non-refundable, except when
            the mistake was ours.
          </p>
        </div>

        <div className="py-6 last:pb-0">
          <h2 className="font-serif text-2xl font-black">6. Exchanges</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            For approved wrong-size or wrong-item claims, we'll ship the correct pair once the original is
            returned to us, or issue a full refund if a replacement isn't available.
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-start gap-4 border border-border bg-secondary p-6">
        <ShieldAlert size={26} className="mt-1 shrink-0 text-accent" />
        <p className="text-sm leading-6 text-muted-foreground">
          Because every listing already shows exact photos, video, and a detailed condition grade, we ask that you
          review these carefully before ordering — they're the standard we hold every claim against.
        </p>
      </div>

      <div className="mt-10 flex flex-col items-start gap-4 bg-secondary p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-start gap-4">
          <Phone size={26} className="mt-1 shrink-0 text-accent" />
          <div>
            <p className="font-serif text-xl font-black">Questions before you return something?</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              We're here to help and want to make sure you have a positive experience with PrimeSoles.
            </p>
          </div>
        </div>
        <a
          href="tel:+923272754233"
          className="flex h-12 w-full shrink-0 items-center justify-center gap-2 bg-primary px-6 font-bold text-primary-foreground md:w-fit"
        >
          <Phone size={16} />
          Call 0341 3907007
        </a>
      </div>
    </section>
  )
}