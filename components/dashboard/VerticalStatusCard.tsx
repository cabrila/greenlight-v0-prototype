"use client"

import { ArrowRight, MessageSquareText } from "lucide-react"
import type { VerticalCard } from "@/lib/dashboardData"
import { VERTICAL_META } from "./verticalMeta"

export type VerticalFilter = "progress" | "greenlit" | "reviews"

interface VerticalStatusCardProps {
  card: VerticalCard
  onOpen: (card: VerticalCard) => void
  onFilter: (card: VerticalCard, filter: VerticalFilter) => void
}

// A single clickable statistic. Big readable number + label; the whole
// control is a filter into the vertical.
function Stat({
  count,
  label,
  onClick,
  tone = "default",
}: {
  count: number
  label: string
  onClick: () => void
  tone?: "default" | "greenlit"
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="group/stat text-left rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <span className="flex items-baseline gap-1">
        <span
          className={`text-xl font-semibold tabular-nums ${tone === "greenlit" ? "text-emerald-600" : "text-slate-900"}`}
        >
          {count}
        </span>
      </span>
      <span className="block text-[11px] leading-tight text-slate-500 group-hover/stat:text-slate-700 transition-colors">
        {label}
      </span>
    </button>
  )
}

export default function VerticalStatusCard({ card, onOpen, onFilter }: VerticalStatusCardProps) {
  const meta = VERTICAL_META[card.id]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-9 h-9 rounded-lg ${meta.chip} flex items-center justify-center shrink-0`}>
          <meta.Icon className={`w-5 h-5 ${meta.icon}`} aria-hidden="true" />
        </span>
        <button
          type="button"
          onClick={() => onOpen(card)}
          className="text-left min-w-0 flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
        >
          <h3 className="text-sm font-semibold text-slate-900 truncate hover:text-emerald-700 transition-colors">
            {card.name}
          </h3>
          <p className="text-xs text-slate-400 tabular-nums">
            {card.totalCount} {card.totalLabel}
          </p>
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        <Stat
          count={card.progressCount}
          label={card.progressLabel}
          onClick={() => onFilter(card, "progress")}
        />
        <Stat
          count={card.greenlitCount}
          label={card.greenlitLabel}
          tone="greenlit"
          onClick={() => onFilter(card, "greenlit")}
        />
      </div>

      {/* Footer: reviews + open */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onFilter(card, "reviews")
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 -mx-1"
        >
          <MessageSquareText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="tabular-nums">
            {card.activeReviewCount} active {card.activeReviewCount === 1 ? "review" : "reviews"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onOpen(card)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 -mx-1"
          aria-label={`Open ${card.name}`}
        >
          Open
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
