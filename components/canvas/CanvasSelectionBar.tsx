"use client"

import { ThumbsUp, ThumbsDown, ClipboardCheck, X } from "lucide-react"

interface CanvasSelectionBarProps {
  selectedCount: number
  reviewableCount: number
  myUp: boolean
  myDown: boolean
  onThumbsUp: () => void
  onThumbsDown: () => void
  onReview: () => void
  onClear: () => void
}

/** Floating action bar that emerges whenever something on the canvas is selected. */
export default function CanvasSelectionBar({
  selectedCount, reviewableCount, myUp, myDown, onThumbsUp, onThumbsDown, onReview, onClear,
}: CanvasSelectionBarProps) {
  if (selectedCount === 0) return null
  const canReact = reviewableCount > 0

  return (
    <div
      role="toolbar"
      aria-label="Selection actions"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-lg border border-slate-200">
        <span className="px-2.5 text-sm font-medium text-slate-700 tabular-nums whitespace-nowrap">
          {selectedCount} selected
        </span>
        <span className="h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={onThumbsUp}
          disabled={!canReact}
          aria-pressed={myUp}
          title="Thumbs up"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            myUp ? "bg-emerald-500 text-white" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="sr-only">Thumbs up</span>
        </button>
        <button
          type="button"
          onClick={onThumbsDown}
          disabled={!canReact}
          aria-pressed={myDown}
          title="Thumbs down"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            myDown ? "bg-rose-500 text-white" : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"
          }`}
        >
          <ThumbsDown className="h-4 w-4" />
          <span className="sr-only">Thumbs down</span>
        </button>
        <span className="h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={onReview}
          disabled={!canReact}
          title={canReact ? "Configure a review of the selected items" : "Select cast, props, costumes or locations to review"}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <ClipboardCheck className="h-4 w-4" />
          Review{reviewableCount > 0 ? ` (${reviewableCount})` : ""}
        </button>
        <button
          type="button"
          onClick={onClear}
          title="Clear selection"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear selection</span>
        </button>
      </div>
      {selectedCount === 1 && (
        <span className="rounded-md bg-slate-900/75 px-2 py-0.5 text-[11px] text-white">
          Shift-click or Shift-drag to select more
        </span>
      )}
    </div>
  )
}
