"use client"

import { ArrowRight, UserPlus, XCircle } from "lucide-react"
import type { ReviewRequest } from "@/lib/dashboardData"
import { getDeadlineInfo } from "@/lib/dashboardData"
import { VERTICAL_META } from "./verticalMeta"
import DeadlineBadge from "./DeadlineBadge"
import ReviewProgress from "./ReviewProgress"
import CardActionMenu from "./CardActionMenu"

interface ReviewCardProps {
  review: ReviewRequest
  onOpen: (review: ReviewRequest) => void
  onAction: (review: ReviewRequest) => void
  onDismiss: (review: ReviewRequest) => void
}

// Card for a review the current user has been invited to and must respond to.
export default function ReviewCard({ review, onOpen, onAction, onDismiss }: ReviewCardProps) {
  const meta = VERTICAL_META[review.vertical]
  const { tone } = getDeadlineInfo(review.deadline)
  const urgent = tone === "overdue" || tone === "today"

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
      className={`group text-left w-full rounded-xl border bg-white p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        urgent ? "border-l-[3px] border-l-amber-400 border-slate-200" : "border-slate-200"
      }`}
    >
      {/* Top row: vertical chip + deadline */}
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
        <div className="flex items-center gap-1 shrink-0">
          <DeadlineBadge deadline={review.deadline} />
          <CardActionMenu
            label="Review request options"
            items={[
              {
                label: "Dismiss request",
                icon: XCircle,
                danger: true,
                onSelect: () => onDismiss(review),
              },
            ]}
          />
        </div>
      </div>

      {/* Subject + creator */}
      <div className="mb-3 pl-[42px]">
        <p className="text-sm text-slate-600 truncate">{review.subjectName}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Requested by <span className="font-medium text-slate-500">{review.createdBy}</span>
        </p>
      </div>

      {/* Progress */}
      <div className="mb-3 pl-[42px]">
        <ReviewProgress responded={review.respondedParticipants} total={review.totalParticipants} />
      </div>

      {/* Footer: your response required + action */}
      <div className="flex items-center justify-between gap-3 pl-[42px]">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <UserPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Your response is required
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAction(review)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
        >
          {review.actionLabel}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
