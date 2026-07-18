import Link from "next/link"

export default async function OrderConfirmSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams

  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center md:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Order confirmed</p>
      <h1 className="mt-3 font-serif text-4xl font-black">Thanks{order ? ` — ${order} is confirmed` : ", your order is confirmed"}.</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        We've got it and will start getting your pair ready. You can track its progress any time.
      </p>
      <Link href="/track" className="mt-8 inline-block bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground">
        Track my order
      </Link>
    </section>
  )
}
