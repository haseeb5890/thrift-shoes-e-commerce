"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { submitReview } from "@/app/actions/reviews"

const field = "h-12 border border-input bg-card px-3 text-sm outline-none focus:border-primary"

export function ReviewSubmissionForm() {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    formData.set("rating", String(rating))

    const promise = submitReview(formData).then((result) => {
      if ("error" in result) throw new Error(result.error)
      return result
    })

    toast.promise(promise, {
      loading: "Submitting your review...",
      success: "Thanks! Your review is in for approval.",
      error: (err) => (err instanceof Error ? err.message : "Couldn't submit your review."),
    })

    try {
      await promise
      setSubmitted(true)
      router.refresh()
    } catch {
      // error toast already shown
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-black">Thanks for sharing!</h1>
        <p className="mt-4 text-muted-foreground">
          Your review is awaiting a quick check before it goes live — we appreciate you taking the time.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Share your experience</p>
      <h1 className="mt-2 font-serif text-5xl font-black">Write a review.</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Seeing real photos of pairs as they actually arrive helps other thrift-shoppers shop with confidence.
      </p>

      <form action={submit} className="mt-8 flex flex-col gap-4">
        <input className={field} name="customerName" placeholder="Your name" required autoComplete="name" />
        <input className={field} type="email" name="submittedEmail" placeholder="Email (for our records only, never shown publicly)" required autoComplete="email" />

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Rating</p>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                className="p-0.5"
              >
                <Star size={26} className={(hoverRating || rating) >= star ? "fill-primary text-primary" : "text-muted-foreground"} />
              </button>
            ))}
          </div>
        </div>

        <textarea className="min-h-32 border border-input bg-card p-3 text-sm outline-none focus:border-primary" name="body" placeholder="How was your pair? Condition, fit, delivery — anything helps." required minLength={10} maxLength={1000} />

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Photo (optional)</label>
          <input type="file" name="photo" accept="image/*" className="text-sm" />
        </div>

        <button disabled={loading} className="mt-2 h-14 bg-primary font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </div>
  )
}