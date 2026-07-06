"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  X, ChevronLeft, ChevronRight, Check, Star,
  Play, ListChecks, Film, ImageIcon, Video as VideoIcon,
  MessageSquare, Send, Pause, SkipForward,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import VideoEmbed from "@/components/video/VideoEmbed"

export interface PlayerVideo {
  name: string
  url: string
  platform?: string
}

export interface PlayerAsset {
  id: string
  title: string
  subtitle?: string
  type: string
  image?: string
  images?: string[]
  videos?: PlayerVideo[]
}

export interface DecisionMaker {
  id: string
  name: string
  role?: string
  color: string
}

export type DecisionTone = "positive" | "negative" | "neutral"

export interface DecisionButton {
  id: string
  label: string
  tone: DecisionTone
}

export type PlayerMode = "approve" | "rate"

export interface PlayerConfig {
  title: string
  showLabels: boolean
  showSubtitles: boolean
  mode: PlayerMode
  /** number of stars used in rate mode */
  starCount: number
  /** custom decision buttons used in approve mode */
  buttons: DecisionButton[]
  decisionMakers: DecisionMaker[]
  /** Per-asset custom label overrides keyed by asset id. */
  labels?: Record<string, string>
  enableComments: boolean
  autoAdvance: boolean
  autoAdvanceSeconds: number
}

/** buttonId for approve mode, rating (1–N) for rate mode. */
interface Verdict {
  buttonId?: string
  rating?: number
}

interface Comment {
  id: string
  author: string
  color?: string
  text: string
  ts: number
}

type DecisionState = Record<string, Record<string, Verdict>>
type CommentState = Record<string, Comment[]>

interface CanvasPlayerViewProps {
  assets: PlayerAsset[]
  config: PlayerConfig
  onClose: () => void
}

const TONE_ACTIVE: Record<DecisionTone, string> = {
  positive: "bg-emerald-500 text-white",
  negative: "bg-red-500 text-white",
  neutral: "bg-amber-500 text-white",
}
const TONE_TEXT: Record<DecisionTone, string> = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-amber-400",
}

interface MediaEntry {
  kind: "image" | "video"
  url: string
  name: string
  platform?: string
}

function firstImage(a: PlayerAsset): string | undefined {
  if (a.images && a.images.length) {
    const valid = a.images.find((u) => isValidImageUrl(u))
    if (valid) return valid
  }
  return isValidImageUrl(a.image) ? a.image : undefined
}

export default function CanvasPlayerView({ assets, config, onClose }: CanvasPlayerViewProps) {
  const [index, setIndex] = useState(0)
  const [decisions, setDecisions] = useState<DecisionState>({})
  const [comments, setComments] = useState<CommentState>({})
  const [showSummary, setShowSummary] = useState(false)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Comment composer state.
  const [draft, setDraft] = useState("")
  const [author, setAuthor] = useState("You")

  const total = assets.length
  const current = assets[index]
  const isRate = config.mode === "rate"
  const starCount = Math.max(1, config.starCount || 5)

  const cancelCountdown = useCallback(() => setCountdown(null), [])

  const goTo = useCallback(
    (target: number) => {
      cancelCountdown()
      setIndex(() => Math.min(Math.max(target, 0), total - 1))
    },
    [total, cancelCountdown],
  )

  const go = useCallback((dir: number) => goTo(index + dir), [goTo, index])

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

  // Reset the active media whenever the asset changes.
  useEffect(() => {
    setMediaIdx(0)
  }, [index])

  // Auto-advance countdown: ticks once per second and advances at zero.
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      setIndex((i) => Math.min(i + 1, total - 1))
      return
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000)
    return () => clearTimeout(t)
  }, [countdown, total])

  const setVerdict = (assetId: string, dmId: string, patch: Verdict) => {
    setDecisions((prev) => {
      const forAsset = { ...(prev[assetId] || {}) }
      forAsset[dmId] = { ...forAsset[dmId], ...patch }
      return { ...prev, [assetId]: forAsset }
    })
    // A registered selection (re)starts the auto-advance timer.
    if (config.autoAdvance && index < total - 1) {
      setCountdown(config.autoAdvanceSeconds || 5)
    }
  }

  const addComment = (assetId: string) => {
    const text = draft.trim()
    if (!text) return
    const dm = config.decisionMakers.find((d) => d.name === author)
    const entry: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      author,
      color: dm?.color,
      text,
      ts: Date.now(),
    }
    setComments((prev) => ({ ...prev, [assetId]: [...(prev[assetId] || []), entry] }))
    setDraft("")
  }

  const labelFor = (a: PlayerAsset) => config.labels?.[a.id]?.trim() || a.title

  /* All media (images + videos) for the current asset. */
  const mediaList = useMemo<MediaEntry[]>(() => {
    if (!current) return []
    const imgSources = current.images && current.images.length ? current.images : current.image ? [current.image] : []
    const images: MediaEntry[] = imgSources
      .filter((u) => isValidImageUrl(u))
      .map((url, i) => ({ kind: "image" as const, url, name: `Image ${i + 1}` }))
    const videos: MediaEntry[] = (current.videos || [])
      .filter((v) => v.url)
      .map((v) => ({ kind: "video" as const, url: v.url, name: v.name, platform: v.platform }))
    return [...images, ...videos]
  }, [current])

  const activeMedia = mediaList[Math.min(mediaIdx, Math.max(mediaList.length - 1, 0))]

  /* Aggregate tallies used by the summary board. */
  const summary = useMemo(() => {
    return assets.map((a) => {
      const per = decisions[a.id] || {}
      const votes = config.decisionMakers.map((dm) => per[dm.id]).filter(Boolean)
      const buttonCounts: Record<string, number> = {}
      config.buttons.forEach((b) => (buttonCounts[b.id] = 0))
      votes.forEach((v) => {
        if (v?.buttonId && buttonCounts[v.buttonId] !== undefined) buttonCounts[v.buttonId] += 1
      })
      const ratings = votes.map((v) => v?.rating).filter((r): r is number => typeof r === "number")
      const avg = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
      return { asset: a, buttonCounts, avg, ratedCount: ratings.length, commentCount: (comments[a.id] || []).length }
    })
  }, [assets, decisions, comments, config.decisionMakers, config.buttons])

  if (!current) return null

  const per = decisions[current.id] || {}
  const currentComments = comments[current.id] || []

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
          {countdown !== null && (
            <div className="flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-sm">
              <SkipForward className="w-4 h-4" />
              <span className="tabular-nums">Next in {countdown}s</span>
              <button
                onClick={cancelCountdown}
                className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Cancel auto-advance"
                title="Pause auto-advance"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
        <div className="relative flex-1 flex flex-col items-center justify-center p-6 min-w-0">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center max-w-full min-h-0 flex-1 justify-center">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-white/10 max-h-[58vh] flex items-center justify-center">
              {activeMedia?.kind === "video" ? (
                <div className="w-[62vw] max-w-[900px]">
                  <VideoEmbed url={activeMedia.url} title={activeMedia.name} className="rounded-2xl" />
                </div>
              ) : activeMedia?.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeMedia.url || "/placeholder.svg"}
                  alt={labelFor(current)}
                  crossOrigin="anonymous"
                  className="max-h-[58vh] max-w-[62vw] object-contain"
                />
              ) : (
                <div className="w-[52vw] h-[46vh] flex items-center justify-center text-white/30">
                  <Play className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Per-asset media selector (all images + videos) */}
            {mediaList.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-[64vw] pb-1">
                {mediaList.map((m, i) => {
                  const active = i === mediaIdx
                  return (
                    <button
                      key={`${m.url}-${i}`}
                      onClick={() => setMediaIdx(i)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all ${
                        active ? "ring-2 ring-emerald-400" : "ring-1 ring-white/10 opacity-60 hover:opacity-100"
                      }`}
                      title={m.name}
                    >
                      {m.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url || "/placeholder.svg"} alt={m.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center bg-slate-800 text-white/60">
                          <VideoIcon className="w-5 h-5" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {config.showLabels && (
              <div className="mt-3 text-center">
                <h3 className="text-xl font-bold text-white text-balance">{labelFor(current)}</h3>
                {config.showSubtitles && current.subtitle && (
                  <p className="text-sm text-white/50 mt-0.5">{current.subtitle}</p>
                )}
                <p className="text-[11px] text-white/30 mt-1 flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1"><ImageIcon className="w-3 h-3" />{mediaList.filter((m) => m.kind === "image").length}</span>
                  <span className="inline-flex items-center gap-1"><VideoIcon className="w-3 h-3" />{mediaList.filter((m) => m.kind === "video").length}</span>
                </p>
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

        {/* Decision + comments panel */}
        <aside className="w-96 shrink-0 border-l border-white/10 bg-slate-900/60 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Decisions</h3>
            <p className="text-xs text-white/50">
              {isRate ? `Rate this asset out of ${starCount}` : "Choose an option from each perspective"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {config.decisionMakers.length === 0 && (
              <p className="text-sm text-white/40 text-center py-6">No decision makers configured.</p>
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
                    <div className="flex items-center gap-1 flex-wrap">
                      {Array.from({ length: starCount }, (_, i) => i + 1).map((n) => {
                        const active = (v.rating || 0) >= n
                        return (
                          <button
                            key={n}
                            onClick={() => setVerdict(current.id, dm.id, { rating: n })}
                            className="p-0.5 transition-transform hover:scale-110"
                            aria-label={`Rate ${n}`}
                          >
                            <Star className={`w-5 h-5 ${active ? "text-amber-400 fill-amber-400" : "text-white/25"}`} />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {config.buttons.map((b) => {
                        const chosen = v.buttonId === b.id
                        return (
                          <button
                            key={b.id}
                            onClick={() => setVerdict(current.id, dm.id, { buttonId: b.id })}
                            className={`flex-1 min-w-[64px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors ${
                              chosen ? TONE_ACTIVE[b.tone] : "bg-white/5 text-white/60 hover:bg-white/10"
                            }`}
                          >
                            {b.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Comments */}
          {config.enableComments && (
            <div className="border-t border-white/10 flex flex-col max-h-[42%]">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
                <MessageSquare className="w-4 h-4 text-white/50" />
                <h3 className="text-sm font-semibold text-white">Comments</h3>
                <span className="text-[11px] text-white/40">{currentComments.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {currentComments.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-4">No comments yet. Add the first note.</p>
                )}
                {currentComments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-white/[0.04] border border-white/10 p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: c.color || "#64748b" }}
                      >
                        {c.author.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-white/80 truncate">{c.author}</span>
                    </div>
                    <p className="text-sm text-white/70 leading-snug whitespace-pre-wrap break-words">{c.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-2.5 border-t border-white/10 space-y-2">
                <select
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="You">You</option>
                  {config.decisionMakers.map((dm) => (
                    <option key={dm.id} value={dm.name}>{dm.name}</option>
                  ))}
                </select>
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                        e.preventDefault()
                        addComment(current.id)
                      }
                    }}
                    rows={2}
                    placeholder="Add a comment…"
                    className="flex-1 resize-none rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => addComment(current.id)}
                    disabled={!draft.trim()}
                    className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Post comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Filmstrip (asset navigation) */}
      <div className="shrink-0 border-t border-white/10 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {assets.map((a, i) => {
            const img = firstImage(a)
            const active = i === index
            return (
              <button
                key={a.id}
                onClick={() => goTo(i)}
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
              {summary.map(({ asset, buttonCounts, avg, ratedCount, commentCount }) => {
                const img = firstImage(asset)
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
                      <p className="text-[11px] text-white/40 truncate flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {commentCount}
                        {asset.subtitle ? ` · ${asset.subtitle}` : ""}
                      </p>
                    </div>
                    {isRate ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-white tabular-nums">{avg ? avg.toFixed(1) : "—"}</span>
                        <span className="text-[11px] text-white/40">({ratedCount})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end max-w-[45%]">
                        {config.buttons.map((b) => (
                          <span key={b.id} className={`flex items-center gap-1 text-sm font-medium ${TONE_TEXT[b.tone]}`}>
                            {b.label} {buttonCounts[b.id] || 0}
                          </span>
                        ))}
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
