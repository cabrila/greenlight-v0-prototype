"use client"

import { Eye, Bell, CheckCircle, Loader2 } from "lucide-react"
import type { CreatedReview } from "@/lib/dashboardData"
import { VERTICAL_META } from "./verticalMeta"
import DeadlineBadge from "./DeadlineBadge"
import ReviewProgress from "./ReviewProgress"
import MissingParticipants from "./MissingParticipants"

interface CreatedReviewCardProps {
  review: CreatedReview
  reminderSent: boolean
  reminding: boolean
  onOpen: (review: CreatedReview) => void
  onSendReminder: (review: CreatedReview) => void
  onConclude: (review: CreatedReview) => void
}

// Card for a review the current user created and must follow up on.
export default function CreatedReviewCard({
  review,
  reminderSent,
  reminding,
  onOpen,
  onSendReminder,
  onConclude,
}: CreatedReviewCardProps) {
  const meta = VERTICAL_META[review.vertical]
  const ready = review.allResponsesReceived && review.canConclude

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(review)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(review)
        }
      }}
      className={`text-left w-full rounded-xl border bg-white p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        ready ? "border-l-[3px] border-l-emerald-400 border-slate-200" : "border-slate-200"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-8 h-8 rounded-lg ${meta.chip} flex items-center justify-center shrink-0`}>
            <meta.Icon className={`w-4 h-4 ${meta.icon}`} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide truncate">
              {review.verticalLabel}
            </p>
            <h3 className="text-sm font-semibold text-slate-900 truncate">{review.title}</h3>
          </div>
        </div>
        <DeadlineBadge deadline={review.deadline} />
      </div>

      <div className="mb-3 pl-[42px]">
        <p className="text-sm text-slate-600 truncate">{review.subjectName}</p>
      </div>

      {/* Progress */}
      <div className="mb-2.5 pl-[42px]">
        <ReviewProgress
          responded={review.respondedParticipants}
          total={review.totalParticipants}
          complete={review.allResponsesReceived}
        />
      </div>

      {/* Missing participants / all received */}
      <div className="mb-3.5 pl-[42px]">
        <MissingParticipants
          missing={review.missingParticipants}
          allResponsesReceived={review.allResponsesReceived}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pl-[42px] flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(review)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          {ready ? "Review results" : "View responses"}
        </button>

        {ready ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onConclude(review)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          >
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Conclude review
          </button>
        ) : (
          <button
            type="button"
            disabled={reminderSent || reminding}
            onClick={(e) => {
              e.stopPropagation()
              onSendReminder(review)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {reminding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : reminderSent ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                Reminder sent
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                Send reminder
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
