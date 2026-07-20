import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { getApprovedReviews } from "@/app/actions/reviews"

export async function ReviewsSection() {
  const reviewRows = await getApprovedReviews(9)
  if (reviewRows.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">From real buyers</p>
          <h2 className="mt-2 font-serif text-4xl font-black md:text-5xl">What people are saying.</h2>
        </div>
        <Link href="/reviews/submit" className="text-xs font-bold uppercase tracking-widest underline underline-offset-2">
          Write a review
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviewRows.map((review) => (
          <div key={review.id} className="flex flex-col border border-border bg-card p-5">
            {review.photoUrl && (
              <div className="relative mb-4 aspect-square w-full overflow-hidden bg-secondary">
                <Image src={review.photoUrl} alt={`Photo shared by ${review.customerName}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              </div>
            )}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={15} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-border"} />
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm leading-6 text-foreground">{review.body}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{review.customerName}</p>
          </div>
        ))}
      </div>
    </section>
  )
}