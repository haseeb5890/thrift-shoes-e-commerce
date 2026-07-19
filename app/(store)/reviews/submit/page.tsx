import type { Metadata } from "next"
import { ReviewSubmissionForm } from "@/components/review-submission-form"

export const metadata: Metadata = { title: "Write a review" }

export default function ReviewSubmitPage() {
  return <ReviewSubmissionForm />
}