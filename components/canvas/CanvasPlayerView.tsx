"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  X, ChevronLeft, ChevronRight, Check, ThumbsUp, ThumbsDown, Star,
  Play, ListChecks, Film,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"

export interface PlayerAsset {
  id: string
  title: string
  subtitle?: string
  type: string
  image?: string
  images?: string[]
}

export interface DecisionMaker {
  id: string
  name: string
  role?: string
  color: string
}

export type PlayerMode = "approve" | "rate"

export interface PlayerConfig {
  title: string
  showLabels: boolean
  showSubtitles: boolean
  mode: PlayerMode
  decisionMakers: DecisionMaker[]
  /** Per-asset custom label overrides keyed by asset id. */
  labels?: Record<string, string>
}

/** verdict for approve mode, rating (1–5) for rate mode. */
interface Verdict {
  verdict?: "approve" | "reject"
  rating?: number
}

type DecisionState = Record<string, Record<string, Verdict>>

interface CanvasPlayerViewProps {
  assets: PlayerAsset[]
  config: PlayerConfig
  onClose: () => void
}

function assetImage(a: PlayerAsset): string | undefined {
  if (a.images && a.images.length) {
    const valid = a.images.find((u) => isValidImageUrl(u))
    if (valid) return valid
  }
  return isValidImageUrl(a.image) ? a.image : undefined
}

export default function CanvasPlayerView({ assets, config, onClose }: CanvasPlayerViewProps) {
  const [index, setIndex] = useState(0)
  const [decisions, setDecisions] = useState<DecisionState>({})
  const [showSummary, setShowSummary] = useState(false)

  const total = assets.length
  const current = assets[index]
  const isRate = config.mode === "rate"

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => {
        const next = i + dir
        if (next < 0) return 0
        if (next >= total) return total - 1
        return next
      })
    },
    [total],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSummary) setShowSummary(false)
        else onClose()
      } else if (e.key === "ArrowRight") {
        go(1)
      } else if (e.key === "ArrowLeft") {
        go(-1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, onClose, showSummary])

  const setVerdict = (assetId: string, dmId: string, patch: Verdict) => {
    setDecisions((prev) => {
      const forAsset = { ...(prev[assetId] || {}) }
      forAsset[dmId] = { ...forAsset[dmId], ...patch }
      return { ...prev, [assetId]: forAsset }
    })
  }

  const labelFor = (a: PlayerAsset) => config.labels?.[a.id]?.trim() || a.title

  /* Aggregate tallies used by the summary board. */
  const summary = useMemo(() => {
    return assets.map((a) => {
      const per = decisions[a.id] || {}
      const votes = config.decisionMakers.map((dm) => per[dm.id]).filter(Boolean)
      const approvals = votes.filter((v) => v?.verdict === "approve").length
      const rejections = votes.filter((v) => v?.verdict === "reject").length
      const ratings = votes.map((v) => v?.rating).filter((r): r is number => typeof r === "number")
      const avg = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
      return { asset: a, approvals, rejections, avg, ratedCount: ratings.length }
    })
  }, [assets, decisions, config.decisionMakers])

  if (!current) return null

  const currentImg = assetImage(current)
  const per = decisions[current.id] || {}

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Film className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{config.title || "Player"}</h2>
            <p className="text-xs text-white/50">
              {index + 1} of {total} · {config.decisionMakers.length} decision maker{config.decisionMakers.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSummary(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <ListChecks className="w-4 h-4" />
            <span className="hidden sm:inline">Summary</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stage */}
      <div className="flex flex-1 min-h-0">
        {/* Slide */}
        <div className="relative flex-1 flex items-center justify-center p-6 min-w-0">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center max-w-full max-h-full">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-white/10 max-h-[72vh]">
              {currentImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImg || "/placeholder.svg"}
                  alt={labelFor(current)}
                  crossOrigin="anonymous"
                  className="max-h-[72vh] max-w-[62vw] object-contain"
                />
              ) : (
                <div className="w-[52vw] h-[52vh] flex items-center justify-center text-white/30">
                  <Play className="w-16 h-16" />
                </div>
              )}
            </div>
            {config.showLabels && (
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-white text-balance">{labelFor(current)}</h3>
                {config.showSubtitles && current.subtitle && (
                  <p className="text-sm text-white/50 mt-0.5">{current.subtitle}</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => go(1)}
            disabled={index === total - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Decision panel */}
        <aside className="w-80 shrink-0 border-l border-white/10 bg-slate-900/60 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Decisions</h3>
            <p className="text-xs text-white/50">
              {isRate ? "Rate this asset from each perspective" : "Approve or reject from each perspective"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {config.decisionMakers.length === 0 && (
              <p className="text-sm text-white/40 text-center py-8">No decision makers configured.</p>
            )}
            {config.decisionMakers.map((dm) => {
              const v = per[dm.id] || {}
              return (
                <div key={dm.id} className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: dm.color }}
                    >
                      {dm.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate leading-tight">{dm.name}</p>
                      {dm.role && <p className="text-[11px] text-white/40 truncate">{dm.role}</p>}
                    </div>
                  </div>

                  {isRate ? (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const active = (v.rating || 0) >= n
                        return (
                          <button
                            key={n}
                            onClick={() => setVerdict(current.id, dm.id, { rating: n })}
                            className="p-0.5 transition-transform hover:scale-110"
                            aria-label={`Rate ${n}`}
                          >
                            <Star
                              className={`w-5 h-5 ${active ? "text-amber-400 fill-amber-400" : "text-white/25"}`}
                            />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setVerdict(current.id, dm.id, { verdict: "approve" })}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          v.verdict === "approve"
                            ? "bg-emerald-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Yes
                      </button>
                      <button
                        onClick={() => setVerdict(current.id, dm.id, { verdict: "reject" })}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          v.verdict === "reject"
                            ? "bg-red-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" /> No
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>
      </div>

      {/* Filmstrip */}
      <div className="shrink-0 border-t border-white/10 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {assets.map((a, i) => {
            const img = assetImage(a)
            const active = i === index
            return (
              <button
                key={a.id}
                onClick={() => setIndex(i)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 transition-all ${
                  active ? "ring-2 ring-emerald-400" : "ring-1 ring-white/10 opacity-60 hover:opacity-100"
                }`}
                title={labelFor(a)}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img || "/placeholder.svg"} alt={labelFor(a)} crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center bg-slate-800 text-white/40 text-xs">{i + 1}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary overlay */}
      {showSummary && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6" onClick={() => setShowSummary(false)}>
          <div
            className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Decision summary</h3>
                <p className="text-xs text-white/50">{config.title}</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors" aria-label="Close summary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {summary.map(({ asset, approvals, rejections, avg, ratedCount }) => {
                const img = assetImage(asset)
                return (
                  <div key={asset.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img || "/placeholder.svg"} alt={labelFor(asset)} crossOrigin="anonymous" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{labelFor(asset)}</p>
                      {asset.subtitle && <p className="text-[11px] text-white/40 truncate">{asset.subtitle}</p>}
                    </div>
                    {isRate ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-white tabular-nums">{avg ? avg.toFixed(1) : "—"}</span>
                        <span className="text-[11px] text-white/40">({ratedCount})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
                          <ThumbsUp className="w-3.5 h-3.5" /> {approvals}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-red-400">
                          <ThumbsDown className="w-3.5 h-3.5" /> {rejections}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSummary(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                <Check className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
