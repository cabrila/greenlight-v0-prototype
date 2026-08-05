"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Bell, CheckCircle2, ClipboardList, FileCheck2, MoreHorizontal, Trash2 } from "lucide-react"
import type { ReviewRequest, CreatedReview } from "@/types/dashboard"
import { DeadlineBadge, ReviewProgress, MissingParticipants } from "./DashboardPrimitives"
import ConfirmDialog from "./ConfirmDialog"

interface RequestCardProps {
  variant: "request"
  review: ReviewRequest
  onOpen: (route: string) => void
  onDismiss: (id: string) => void
}

interface CreatedCardProps {
  variant: "created"
  review: CreatedReview
  onOpen: (route: string) => void
  onSendReminder: (id: string) => void
  onConclude: (id: string) => void
  onDismiss: (id: string) => void
  reminderSent?: boolean
}

type ReviewCardProps = RequestCardProps | CreatedCardProps

/** A subtle accent stripe by deadline urgency (paired with the DeadlineBadge text). */
function urgencyRing(status: string) {
  if (status === "overdue") return "border-l-red-400"
  if (status === "dueToday") return "border-l-amber-400"
  return "border-l-slate-200"
}

export default function ReviewCard(props: ReviewCardProps) {
  const { review, onOpen } = props

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDismiss, setConfirmDismiss] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [menuOpen])

  const isRequest = props.variant === "request"

  return (
    <article
      className={`group flex flex-col gap-3 rounded-2xl border border-slate-200 border-l-4 ${urgencyRing(
        review.status,
      )} bg-white p-4 shadow-sm transition-shadow hover:shadow-md`}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-slate-900">
            {review.title}
            <span className="font-normal text-slate-500"> — {review.subjectName}</span>
          </h4>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <ClipboardList className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            {review.verticalLabel}
            {props.variant === "request" && (
              <>
                <span className="text-slate-300">·</span>
                <span>
                  Created by <span className="font-medium text-slate-600">{props.review.createdBy}</span>
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <DeadlineBadge deadline={review.deadline} status={review.status} />
          {/* Contextual kebab menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Review options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmDismiss(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Dismiss {isRequest ? "request" : "review"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <ReviewProgress
        responded={review.respondedParticipants}
        total={review.totalParticipants}
        complete={props.variant === "created" && props.review.allResponsesReceived}
      />

      {/* Status line */}
      {props.variant === "request" ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Your response is required
        </p>
      ) : props.review.canConclude ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Ready to conclude
        </p>
      ) : (
        <MissingParticipants names={props.review.missingParticipants} />
      )}

      {/* Actions */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {props.variant === "request" ? (
          <button
            onClick={() => onOpen(review.route)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          >
            {props.review.actionLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <>
            <button
              onClick={() => onOpen(review.route)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              {props.review.canConclude ? "Review results" : "View responses"}
            </button>
            {/* Send reminder is only relevant while responses are still outstanding */}
            {!props.review.canConclude && (
              <button
                onClick={() => props.onSendReminder(props.review.id)}
                disabled={props.reminderSent}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
              >
                {props.reminderSent ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Reminder sent
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    Send reminder
                  </>
                )}
              </button>
            )}
            {/* Conclude is always available. Green once everyone has responded,
                otherwise a muted gray to signal it's an early close. */}
            <button
              onClick={() => props.onConclude(props.review.id)}
              title={
                props.review.canConclude
                  ? "All responses received — conclude this review"
                  : "Conclude now, before all participants have responded"
              }
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                props.review.canConclude
                  ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
                  : "bg-slate-400 hover:bg-slate-500 focus-visible:ring-slate-400"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Conclude review
            </button>
          </>
        )}
      </div>

      {/* Dismiss confirmation */}
      <ConfirmDialog
        open={confirmDismiss}
        tone="danger"
        title={isRequest ? "Dismiss this review request?" : "Dismiss this review?"}
        description={
          isRequest
            ? `"${review.title}" will be removed from your dashboard. You can still access it from the ${review.verticalLabel} view, but it won't appear here as needing your response.`
            : `"${review.title}" will be removed from your dashboard. Participants keep their access, but you'll no longer track its responses here.`
        }
        confirmLabel="Dismiss"
        cancelLabel="Keep"
        onCancel={() => setConfirmDismiss(false)}
        onConfirm={() => {
          setConfirmDismiss(false)
          props.onDismiss(review.id)
        }}
      />
    </article>
  )
}
