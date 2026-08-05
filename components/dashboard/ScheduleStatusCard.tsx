"use client"

import { ArrowRight, MessageSquareText, AlertTriangle } from "lucide-react"
import type { ScheduleCard } from "@/lib/dashboardData"
import { VERTICAL_META } from "./verticalMeta"
import type { VerticalFilter } from "./VerticalStatusCard"

interface ScheduleStatusCardProps {
  card: ScheduleCard
  onOpen: (route: string) => void
  onFilter: (route: string, filter: VerticalFilter) => void
}

// Schedule uses a different counting model (scenes scheduled vs. unscheduled/conflicts).
export default function ScheduleStatusCard({ card, onOpen, onFilter }: ScheduleStatusCardProps) {
  const meta = VERTICAL_META.schedule
  const warning = card.secondaryTone === "warning"

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-9 h-9 rounded-lg ${meta.chip} flex items-center justify-center shrink-0`}>
          <meta.Icon className={`w-5 h-5 ${meta.icon}`} aria-hidden="true" />
        </span>
        <button
          type="button"
          onClick={() => onOpen(card.route)}
          className="text-left min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
        >
          <h3 className="text-sm font-semibold text-slate-900 truncate hover:text-emerald-700 transition-colors">
            {card.name}
          </h3>
          <p className="text-xs text-slate-400 tabular-nums">{card.totalScenes} scenes</p>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        <button
          type="button"
          onClick={() => onFilter(card.route, "greenlit")}
          className="group/stat text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="text-xl font-semibold tabular-nums text-emerald-600">{card.scheduledScenes}</span>
          <span className="block text-[11px] leading-tight text-slate-500 group-hover/stat:text-slate-700 transition-colors">
            scheduled
          </span>
        </button>
        <button
          type="button"
          onClick={() => onFilter(card.route, "progress")}
          className="group/stat text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span
            className={`inline-flex items-center gap-1 text-xl font-semibold tabular-nums ${warning ? "text-amber-600" : "text-slate-900"}`}
          >
            {warning && <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />}
            {card.secondaryCount}
          </span>
          <span className="block text-[11px] leading-tight text-slate-500 group-hover/stat:text-slate-700 transition-colors">
            {card.secondaryLabel}
          </span>
        </button>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onFilter(card.route, "reviews")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 -mx-1"
        >
          <MessageSquareText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {card.activeReviewCount} active {card.activeReviewCount === 1 ? "review" : "reviews"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpen(card.route)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 -mx-1"
          aria-label="Open Schedule"
        >
          Open
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
