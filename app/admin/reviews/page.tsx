"use client"

import { useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { listPendingReviews, listReviewHistory, moderateReview, deleteReview, addAdminReview } from "@/app/actions/reviews"

type Review = Awaited<ReturnType<typeof listPendingReviews>>[number]

const field = "h-11 border border-border bg-card px-3 text-sm outline-none focus:border-primary"

export default function AdminReviewsPage() {
  const [pending, setPending] = useState<Review[]>([])
  const [history, setHistory] = useState<Review[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotalPages, setHistoryTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(5)

  useEffect(() => {
    Promise.all([listPendingReviews(), listReviewHistory(historyPage)]).then(([pendingRows, historyResult]) => {
      setPending(pendingRows)
      setHistory(historyResult.reviews)
      setHistoryTotalPages(historyResult.totalPages)
      setLoading(false)
    })
  }, [historyPage])

  function refresh() {
    listPendingReviews().then(setPending)
    listReviewHistory(historyPage).then((result) => {
      setHistory(result.reviews)
      setHistoryTotalPages(result.totalPages)
    })
  }

  function handleModerate(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      const result = await moderateReview(id, status)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success(status === "approved" ? "Review approved" : "Review rejected")
        refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteReview(id)
      if ("error" in result) toast.error(result.error)
      else {
        toast.success("Review deleted")
        refresh()
      }
    })
  }

  function submitAdminReview(formData: FormData) {
    formData.set("rating", String(rating))
    startTransition(async () => {
      const result = await addAdminReview(formData)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Review added and published")
        setRating(5)
        refresh()
        ;(document.getElementById("admin-review-form") as HTMLFormElement)?.reset()
      }
    })
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-serif text-3xl font-black md:text-5xl">Reviews.</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-serif text-2xl font-black">Pending approval {pending.length > 0 && `(${pending.length})`}</h2>
          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          ) : pending.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing waiting on you right now.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {pending.map((review) => (
                <div key={review.id} className="border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{review.customerName}</p>
                      <p className="text-xs text-muted-foreground">{review.submittedEmail}</p>
                      <div className="mt-1 flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={13} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-border"} />
                        ))}
                      </div>
                    </div>
                    {review.photoUrl && (
                      <div className="relative size-16 shrink-0 overflow-hidden bg-secondary">
                        <Image src={review.photoUrl} alt="" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6">{review.body}</p>
                  <div className="mt-3 flex gap-3">
                    <button disabled={isPending} onClick={() => handleModerate(review.id, "approved")} className="h-9 flex-1 bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
                      Approve
                    </button>
                    <button disabled={isPending} onClick={() => handleModerate(review.id, "rejected")} className="h-9 flex-1 border border-destructive text-xs font-bold uppercase tracking-wider text-destructive disabled:opacity-50">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="mt-10 font-serif text-2xl font-black">All reviews</h2>
          <div className="mt-4 overflow-x-auto bg-background p-4">
            <table className="w-full min-w-60 text-left text-sm md:min-w-140">
              <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Customer</th>
                  <th className="hidden md:table-cell">Rating</th>
                  <th className="hidden md:table-cell">Source</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((review) => (
                  <tr key={review.id} className="border-b border-border">
                    <td className="py-3 font-bold">{review.customerName}</td>
                    <td className="hidden md:table-cell">{review.rating}★</td>
                    <td className="hidden capitalize md:table-cell">{review.source}</td>
                    <td className="capitalize">{review.status}</td>
                    <td className="text-right">
                      <button disabled={isPending} onClick={() => handleDelete(review.id)} className="text-xs font-bold uppercase tracking-wider text-destructive underline disabled:opacity-50">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {historyTotalPages > 1 && (
            <nav className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                disabled={historyPage <= 1}
                className="flex h-9 min-w-9 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider hover:border-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setHistoryPage(p)}
                  className={`flex h-9 min-w-9 items-center justify-center border px-3 text-xs font-bold ${p === historyPage ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                disabled={historyPage >= historyTotalPages}
                className="flex h-9 min-w-9 items-center justify-center border border-border px-3 text-xs font-bold uppercase tracking-wider hover:border-foreground disabled:pointer-events-none disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </div>

        <div className="h-fit border border-border bg-background p-5">
          <h2 className="font-serif text-2xl font-black">Add a review</h2>
          <form id="admin-review-form" action={submitAdminReview} className="mt-5 flex flex-col gap-3">
            <input className={field} name="customerName" placeholder="Customer name" required />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button type="button" key={star} onClick={() => setRating(star)}>
                  <Star size={22} className={rating >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground"} />
                </button>
              ))}
            </div>
            <textarea className="min-h-24 border border-border bg-card p-3 text-sm outline-none focus:border-primary" name="body" placeholder="Review text" required />
            <input type="file" name="photo" accept="image/*" className="text-sm" />
            <button disabled={isPending} className="h-11 bg-primary text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50">
              {isPending ? "Saving..." : "Publish review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
