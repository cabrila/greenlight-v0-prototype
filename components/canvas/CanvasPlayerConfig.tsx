"use client"

import { useState } from "react"
import { X, Plus, Trash2, Play, ThumbsUp, Star, Users, Tag } from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { PlayerAsset, PlayerConfig, DecisionMaker, PlayerMode } from "./CanvasPlayerView"

const DM_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#14b8a6", "#f97316"]

const SUGGESTED_ROLES = ["Director", "Producer", "Client", "DP", "Casting", "Costume Dept"]

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
  const [labels, setLabels] = useState<Record<string, string>>({})
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

  const handleStart = () => {
    const cleaned = decisionMakers
      .map((d) => ({ ...d, name: d.name.trim() || "Reviewer" }))
      .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i)
    onStart({ title: title.trim() || "Player", showLabels, showSubtitles, mode, decisionMakers: cleaned, labels })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4" onMouseDown={onCancel}>
      <div
        className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
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
                <ThumbsUp className="w-4 h-4" /> Approve / Reject
              </button>
              <button
                onClick={() => setMode("rate")}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  mode === "rate" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Star className="w-4 h-4" /> Rate 1–5
              </button>
            </div>
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
