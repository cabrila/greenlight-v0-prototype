"use client"

import { useState } from "react"
import { X, Plus, Trash2, Play, ThumbsUp, Star, Users, Tag, Minus, MessageSquare, Timer } from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { PlayerAsset, PlayerConfig, DecisionMaker, PlayerMode, DecisionButton, DecisionTone } from "./CanvasPlayerView"

const DM_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"]

const SUGGESTED_ROLES = ["Director", "Producer", "Client", "DP", "Casting", "Costume Dept"]

const TONE_META: Record<DecisionTone, { label: string; dot: string; ring: string }> = {
  positive: { label: "Positive", dot: "bg-emerald-500", ring: "ring-emerald-500" },
  negative: { label: "Negative", dot: "bg-red-500", ring: "ring-red-500" },
  neutral: { label: "Neutral", dot: "bg-amber-500", ring: "ring-amber-500" },
}

const DEFAULT_BUTTONS: DecisionButton[] = [
  { id: "yes", label: "Yes", tone: "positive" },
  { id: "no", label: "No", tone: "negative" },
]

interface CanvasPlayerConfigProps {
  assets: PlayerAsset[]
  onCancel: () => void
  onStart: (config: PlayerConfig) => void
}

export default function CanvasPlayerConfig({ assets, onCancel, onStart }: CanvasPlayerConfigProps) {
  const [title, setTitle] = useState("Review session")
  const [showLabels, setShowLabels] = useState(true)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [mode, setMode] = useState<PlayerMode>("approve")
  const [starCount, setStarCount] = useState(5)
  const [buttons, setButtons] = useState<DecisionButton[]>(DEFAULT_BUTTONS)
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [enableComments, setEnableComments] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(5)
  const [decisionMakers, setDecisionMakers] = useState<DecisionMaker[]>([
    { id: "dm-1", name: "Director", role: "Creative lead", color: DM_COLORS[0] },
  ])

  const addDecisionMaker = () => {
    const id = `dm-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const color = DM_COLORS[decisionMakers.length % DM_COLORS.length]
    setDecisionMakers((prev) => [...prev, { id, name: "", role: "", color }])
  }

  const updateDM = (id: string, patch: Partial<DecisionMaker>) =>
    setDecisionMakers((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const removeDM = (id: string) => setDecisionMakers((prev) => prev.filter((d) => d.id !== id))

  /* ---- decision button editing (approve mode) ---- */
  const addButton = () => {
    const id = `btn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    setButtons((prev) => [...prev, { id, label: "Maybe", tone: "neutral" }])
  }
  const updateButton = (id: string, patch: Partial<DecisionButton>) =>
    setButtons((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const removeButton = (id: string) => setButtons((prev) => prev.filter((b) => b.id !== id))
  const cycleTone = (id: string) => {
    const order: DecisionTone[] = ["positive", "negative", "neutral"]
    setButtons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, tone: order[(order.indexOf(b.tone) + 1) % order.length] } : b)),
    )
  }

  const handleStart = () => {
    const cleaned = decisionMakers
      .map((d) => ({ ...d, name: d.name.trim() || "Reviewer" }))
      .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
    const cleanedButtons = buttons
      .map((b) => ({ ...b, label: b.label.trim() || "Option" }))
      .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i)
    onStart({
      title: title.trim() || "Player",
      showLabels,
      showSubtitles,
      mode,
      starCount,
      buttons: cleanedButtons.length ? cleanedButtons : DEFAULT_BUTTONS,
      decisionMakers: cleaned,
      labels,
      enableComments,
      autoAdvance,
      autoAdvanceSeconds,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4" onMouseDown={onCancel}>
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0">
          <div className="h-1.5 bg-emerald-500" />
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Configure player</h2>
              <p className="text-xs text-slate-400">{assets.length} asset{assets.length === 1 ? "" : "s"} selected</p>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Cancel">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Session title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Costume options review"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Decision mode */}
          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-1.5">Decision style</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("approve")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  mode === "approve" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> Buttons
              </button>
              <button
                onClick={() => setMode("rate")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  mode === "rate" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Star className="w-4 h-4" /> Star rating
              </button>
            </div>

            {/* Star count editor */}
            {mode === "rate" && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                <span className="text-sm text-slate-600">Number of stars</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStarCount((n) => Math.max(2, n - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                    aria-label="Fewer stars"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-800 tabular-nums">{starCount}</span>
                  <button
                    onClick={() => setStarCount((n) => Math.min(10, n + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                    aria-label="More stars"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Custom buttons editor */}
            {mode === "approve" && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Decision buttons</span>
                  <button
                    onClick={addButton}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add button
                  </button>
                </div>
                {buttons.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                    <button
                      onClick={() => cycleTone(b.id)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0"
                      title={`Tone: ${TONE_META[b.tone].label} (click to change)`}
                    >
                      <span className={`w-3 h-3 rounded-full ${TONE_META[b.tone].dot}`} />
                      <span className="text-[11px] text-slate-500">{TONE_META[b.tone].label}</span>
                    </button>
                    <input
                      value={b.label}
                      onChange={(e) => updateButton(b.id, { label: e.target.value })}
                      placeholder="Label"
                      className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => removeButton(b.id)}
                      disabled={buttons.length <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Remove button"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Behaviour toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Enable comments
              </span>
              <input type="checkbox" checked={enableComments} onChange={(e) => setEnableComments(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <Timer className="w-4 h-4 text-slate-400" /> Auto-advance after a selection
              </span>
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
            </label>
            {autoAdvance && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                <span className="text-sm text-slate-600">Countdown seconds</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoAdvanceSeconds((n) => Math.max(1, n - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                    aria-label="Less time"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-800 tabular-nums">{autoAdvanceSeconds}</span>
                  <button
                    onClick={() => setAutoAdvanceSeconds((n) => Math.min(30, n + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                    aria-label="More time"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Display toggles */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowLabels((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                showLabels ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"
              }`}
            >
              <Tag className="w-3.5 h-3.5" /> Show labels
            </button>
            <button
              onClick={() => setShowSubtitles((v) => !v)}
              disabled={!showLabels}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 ${
                showSubtitles && showLabels ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"
              }`}
            >
              Show subtitles
            </button>
          </div>

          {/* Labels editor */}
          {showLabels && (
            <div>
              <span className="block text-sm font-semibold text-slate-800 mb-1.5">Slide labels</span>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {assets.map((a) => {
                  const img = a.images?.find((u) => isValidImageUrl(u)) || (isValidImageUrl(a.image) ? a.image : undefined)
                  return (
                    <div key={a.id} className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img || "/placeholder.svg"} alt={a.title} crossOrigin="anonymous" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <input
                        value={labels[a.id] ?? a.title}
                        onChange={(e) => setLabels((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Decision makers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Users className="w-4 h-4 text-slate-400" /> Decision makers
              </span>
              <button
                onClick={addDecisionMaker}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {decisionMakers.map((dm) => (
                <div key={dm.id} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: dm.color }}
                  >
                    {(dm.name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                    <input
                      value={dm.name}
                      onChange={(e) => updateDM(dm.id, { name: e.target.value })}
                      placeholder="Name"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      value={dm.role}
                      onChange={(e) => updateDM(dm.id, { role: e.target.value })}
                      placeholder="Role"
                      list="dm-roles"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => removeDM(dm.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remove decision maker"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {decisionMakers.length === 0 && (
                <p className="text-sm text-slate-400 py-3 text-center">Add at least one decision maker to collect votes.</p>
              )}
            </div>
            <datalist id="dm-roles">
              {SUGGESTED_ROLES.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 p-4 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            <Play className="w-4 h-4" /> Start player
          </button>
        </div>
      </div>
    </div>
  )
}
