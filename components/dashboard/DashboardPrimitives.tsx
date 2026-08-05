"use client"

import { AlertTriangle, CalendarClock, Clock, CheckCircle2, Users, Inbox } from "lucide-react"
import type { ReviewStatus } from "@/types/dashboard"
import { formatDeadline } from "@/lib/dashboardData"

/**
 * Deadline pill. Status is always communicated with an icon + text label in
 * addition to color, so color is never the sole carrier of meaning.
 */
export function DeadlineBadge({ deadline, status }: { deadline: string; status: ReviewStatus }) {
  const label = formatDeadline(deadline)
  const config = {
    overdue: {
      icon: AlertTriangle,
      className: "bg-red-50 text-red-700 border-red-200",
    },
    dueToday: {
      icon: CalendarClock,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    upcoming: {
      icon: Clock,
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
  }[status]
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

/** Compact "x of y responded" progress with a slim bar. */
export function ReviewProgress({
  responded,
  total,
  complete,
}: {
  responded: number
  total: number
  complete?: boolean
}) {
  const pct = total > 0 ? Math.round((responded / total) * 100) : 0
  return (
    <div className="flex items-center gap-2.5">
      <Users className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">
            {responded} of {total} responded
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${complete ? "bg-emerald-500" : "bg-slate-400"}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={responded}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${responded} of ${total} participants responded`}
          />
        </div>
      </div>
    </div>
  )
}

/** Names of the people who still owe a response — more actionable than a full roster. */
export function MissingParticipants({ names }: { names: string[] }) {
  if (names.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        All responses received
      </p>
    )
  }
  const formatted =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
  return (
    <p className="text-xs text-slate-500">
      <span className="font-medium text-slate-600">Missing:</span> {formatted}
    </p>
  )
}

/** A calm empty state for review sections. */
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
        <Inbox className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
    </div>
  )
}
