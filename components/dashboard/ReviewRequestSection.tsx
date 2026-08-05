"use client"

import { Inbox, CheckCircle2 } from "lucide-react"
import type { ReviewRequest } from "@/lib/dashboardData"
import { sortReviewRequests } from "@/lib/dashboardData"
import ReviewCard from "./ReviewCard"
import EmptyState from "./EmptyState"

interface ReviewRequestSectionProps {
  reviews: ReviewRequest[]
  onOpen: (review: ReviewRequest) => void
  onAction: (review: ReviewRequest) => void
}

export default function ReviewRequestSection({ reviews, onOpen, onAction }: ReviewRequestSectionProps) {
  const open = sortReviewRequests(reviews.filter((r) => !r.currentUserHasResponded))

  return (
    <section aria-labelledby="reviews-required-heading">
      <div className="flex items-center gap-2.5 mb-4">
        <Inbox className="w-5 h-5 text-slate-400" aria-hidden="true" />
        <h2 id="reviews-required-heading" className="text-base font-semibold text-slate-900">
          Reviews requiring your response
        </h2>
        {open.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold tabular-nums">
            {open.length}
          </span>
        )}
      </div>

      {open.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="No reviews are waiting on your response right now."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {open.map((review) => (
            <ReviewCard key={review.id} review={review} onOpen={onOpen} onAction={onAction} />
          ))}
        </div>
      )}
    </section>
  )
}
