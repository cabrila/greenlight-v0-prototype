"use client"

import { ClipboardList, FolderOpen } from "lucide-react"
import type { CreatedReview } from "@/lib/dashboardData"
import CreatedReviewCard from "./CreatedReviewCard"
import EmptyState from "./EmptyState"

interface CreatedReviewSectionProps {
  reviews: CreatedReview[]
  reminderState: Record<string, "sending" | "sent" | undefined>
  onOpen: (review: CreatedReview) => void
  onSendReminder: (review: CreatedReview) => void
  onConclude: (review: CreatedReview) => void
}

export default function CreatedReviewSection({
  reviews,
  reminderState,
  onOpen,
  onSendReminder,
  onConclude,
}: CreatedReviewSectionProps) {
  return (
    <section aria-labelledby="your-reviews-heading">
      <div className="flex items-center gap-2.5 mb-4">
        <ClipboardList className="w-5 h-5 text-slate-400" aria-hidden="true" />
        <h2 id="your-reviews-heading" className="text-base font-semibold text-slate-900">
          Your Review Sessions
        </h2>
        {reviews.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tabular-nums">
            {reviews.length}
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No active sessions"
          description="Review Sessions you create will appear here so you can track responses."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reviews.map((review) => (
            <CreatedReviewCard
              key={review.id}
              review={review}
              reminding={reminderState[review.id] === "sending"}
              reminderSent={reminderState[review.id] === "sent"}
              onOpen={onOpen}
              onSendReminder={onSendReminder}
              onConclude={onConclude}
            />
          ))}
        </div>
      )}
    </section>
  )
}
