import type { Metadata } from "next"
import { Phone } from "lucide-react"

export const metadata: Metadata = { title: "Return policy" }

const SECTIONS = [
  {
    title: "1. Eligibility",
    body: "Returns are accepted within 7 days of the delivery date. To be eligible for a return, shoes must be in the same condition as when received, with no additional wear or damage.",
  },
  {
    title: "3. Shipping costs",
    body: "Return shipping costs are the responsibility of the buyer unless the return is due to a mistake on our part (e.g. wrong item shipped or item not as described). We recommend using a trackable shipping service to ensure your return reaches us.",
  },
  {
    title: "4. Refunds",
    body: "Upon receipt and inspection of the returned item, we will process your refund within 7 business days. Refunds will be issued to the original payment method. Please note that shipping costs are non-refundable.",
  },
  {
    title: "5. Exchanges",
    body: "If you wish to exchange an item, please follow the return process and place a new order for the desired item.",
  },
]

export default function ReturnPolicyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Buyer protection</p>
      <h1 className="mt-3 text-balance font-serif text-5xl font-black leading-none md:text-6xl">Return policy.</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        We are committed to ensuring your satisfaction with our shoes. If you need to return an item, please review
        our return policy below.
      </p>

      <div className="mt-10 flex flex-col divide-y divide-border border-y border-border">
        <div className="py-6 first:pt-0">
          <h2 className="font-serif text-2xl font-black">{SECTIONS[0].title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{SECTIONS[0].body}</p>
        </div>

        <div className="py-6">
          <h2 className="font-serif text-2xl font-black">2. Return process</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Contact our customer service team at{" "}
            <a href="tel:+923413907007" className="font-bold text-foreground underline underline-offset-2">
              0341 3907007
            </a>{" "}
            to initiate a return. Please provide your order number and reason for return. Once your return request is
            approved, you will receive detailed instructions on how to return the item.
          </p>
        </div>

        {SECTIONS.slice(1).map((section) => (
          <div key={section.title} className="py-6 last:pb-0">
            <h2 className="font-serif text-2xl font-black">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.body}</p>
          </div>
        ))}
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