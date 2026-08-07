"use client"

import { Users } from "lucide-react"

interface ReviewProgressProps {
  responded: number
  total: number
  complete?: boolean
}

// Simple, non-decorative response tracker: "X of Y responded" + thin bar.
// Intentionally avoids circular progress charts per the design brief.
export default function ReviewProgress({ responded, total, complete }: ReviewProgressProps) {
  const pct = total > 0 ? Math.round((responded / total) * 100) : 0

  return (
    <div className="flex items-center gap-2.5">
      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <span className="text-xs font-medium text-slate-600 whitespace-nowrap tabular-nums">
        {responded} of {total} responded
      </span>
      <div
        className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden min-w-[40px]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={responded}
        aria-label={`${responded} of ${total} participants have responded`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-emerald-500" : "bg-slate-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
