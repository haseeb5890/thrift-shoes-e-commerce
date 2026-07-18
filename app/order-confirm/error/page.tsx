import Link from "next/link"

const REASON_MESSAGES: Record<string, string> = {
  invalid: "This confirmation link is invalid. Double-check the link in your email, or contact us if you keep having trouble.",
  expired: "This confirmation link has expired. Your order is still on file — contact us and we'll confirm it for you.",
  "already-handled": "This order has already been confirmed (or its status has since changed), so this link no longer applies.",
}

export default async function OrderConfirmErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string; order?: string }> }) {
  const { reason, order } = await searchParams
  const message = REASON_MESSAGES[reason ?? ""] ?? "Something went wrong confirming your order. Please try again."

  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center md:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-destructive">Couldn't confirm{order ? ` ${order}` : ""}</p>
      <h1 className="mt-3 font-serif text-4xl font-black">We hit a snag.</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
      <Link href="/track" className="mt-8 inline-block bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground">
        Check my orders
      </Link>
    </section>
  )
}
