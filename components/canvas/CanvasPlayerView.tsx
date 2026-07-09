"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  X, ChevronLeft, ChevronRight, Check, Star,
  Play, ListChecks, Film, ImageIcon, Video as VideoIcon,
  MessageSquare, Send, Pause, SkipForward,
  CheckCircle2, RotateCcw, Users, Share2, Copy, Link2,
  Cake, UserSquare2, MapPin, Sparkles,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import VideoEmbed from "@/components/video/VideoEmbed"
import SummaryMoveBar from "@/components/modals/SummaryMoveBar"
import { MentionTextarea, MentionText, extractMentions, type MentionPerson } from "@/components/player/mentions"

export interface PlayerVideo {
  name: string
  url: string
  platform?: string
}

/** Extra details surfaced in the player for actor assets. */
export interface PlayerActorInfo {
  age?: string
  playingAge?: string
  location?: string
  skills?: string[]
}

export interface PlayerAsset {
  id: string
  title: string
  subtitle?: string
  type: string
  image?: string
  images?: string[]
  videos?: PlayerVideo[]
  /** Present for actor assets — shown as an info panel in the player. */
  actor?: PlayerActorInfo
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

export type PlayerMode = "approve" | "rate" | "browse"

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
  /** id of the decision maker that represents the current user (the only one who can vote here). */
  currentUserId?: string
  /** Per-asset custom label overrides keyed by asset id. */
  labels?: Record<string, string>
  /** Per-asset list of media URLs the user chose to exclude from the player, keyed by asset id. */
  excludedMedia?: Record<string, string[]>
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
  /** Ids of decision makers tagged with @mentions in this comment. */
  mentions?: string[]
}

type DecisionState = Record<string, Record<string, Verdict>>
type CommentState = Record<string, Comment[]>

interface CanvasPlayerViewProps {
  assets: PlayerAsset[]
  config: PlayerConfig
  onClose: () => void
  /** Name of the project this player session belongs to, shown in the header. */
  projectName?: string
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

export default function CanvasPlayerView({ assets, config, onClose, projectName }: CanvasPlayerViewProps) {
  const [index, setIndex] = useState(0)
  const [decisions, setDecisions] = useState<DecisionState>({})
  const [comments, setComments] = useState<CommentState>({})
  const [showSummary, setShowSummary] = useState(false)
  const [ended, setEnded] = useState(false)

  // Selection for the summary "Move" action (actor-type assets only).
  const [selectedSummaryIds, setSelectedSummaryIds] = useState<Set<string>>(new Set())
  const toggleSummarySelected = (id: string) =>
    setSelectedSummaryIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const clearSummarySelection = () => setSelectedSummaryIds(new Set())
  const [mediaIdx, setMediaIdx] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Comment composer state.
  const [draft, setDraft] = useState("")

  // Share link state.
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Build a direct link that encodes this player session so it can be shared.
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    try {
      const payload = {
        t: config.title,
        m: config.mode,
        a: assets.map((a) => ({ id: a.id, title: a.title })),
        i: index,
      }
      const token = window.btoa(encodeURIComponent(JSON.stringify(payload)))
      return `${window.location.origin}${window.location.pathname}?player=${token}`
    } catch {
      return `${window.location.origin}${window.location.pathname}`
    }
  }, [assets, config.title, config.mode, index])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const total = assets.length
  const current = assets[index]
  const isRate = config.mode === "rate"
  // Browse-only mode: no decision controls, reviewers can only navigate and comment.
  const isBrowse = config.mode === "browse"
  const starCount = Math.max(1, config.starCount || 5)

  // The current user is the only participant who can vote or comment in this session.
  const me = useMemo(
    () => config.decisionMakers.find((d) => d.id === config.currentUserId) || config.decisionMakers[0],
    [config.decisionMakers, config.currentUserId],
  )
  const others = useMemo(
    () => config.decisionMakers.filter((d) => d.id !== me?.id),
    [config.decisionMakers, me?.id],
  )

  // People that can be @mentioned in comments (everyone in the session).
  const mentionPeople = useMemo<MentionPerson[]>(
    () => config.decisionMakers.map((d) => ({ id: d.id, name: d.name, color: d.color })),
    [config.decisionMakers],
  )

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
        else if (ended) setEnded(false)
        else onClose()
      } else if (e.key === "ArrowRight") {
        go(1)
      } else if (e.key === "ArrowLeft") {
        go(-1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, onClose, showSummary, ended])

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
    // On the final asset, a registered decision surfaces the end screen.
    if (index === total - 1) {
      setCountdown(null)
      window.setTimeout(() => setEnded(true), 650)
    }
  }

  const addComment = (assetId: string) => {
    const text = draft.trim()
    if (!text) return
    const entry: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      author: me?.name || "You",
      color: me?.color,
      text,
      ts: Date.now(),
      mentions: extractMentions(text, mentionPeople).filter((id) => id !== me?.id),
    }
    setComments((prev) => ({ ...prev, [assetId]: [...(prev[assetId] || []), entry] }))
    setDraft("")
  }

  const labelFor = (a: PlayerAsset) => config.labels?.[a.id]?.trim() || a.title

  /* All media (images + videos) for the current asset, minus any excluded in setup. */
  const mediaList = useMemo<MediaEntry[]>(() => {
    if (!current) return []
    const excluded = new Set(config.excludedMedia?.[current.id] || [])
    const imgSources = current.images && current.images.length ? current.images : current.image ? [current.image] : []
    const images: MediaEntry[] = imgSources
      .filter((u) => isValidImageUrl(u) && !excluded.has(u))
      .map((url, i) => ({ kind: "image" as const, url, name: `Image ${i + 1}` }))
    const videos: MediaEntry[] = (current.videos || [])
      .filter((v) => v.url && !excluded.has(v.url))
      .map((v) => ({ kind: "video" as const, url: v.url, name: v.name, platform: v.platform }))
    // Videos always play first, then images.
    return [...videos, ...images]
  }, [current, config.excludedMedia])

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

  const decidedCount = useMemo(
    () => assets.filter((a) => config.decisionMakers.some((dm) => decisions[a.id]?.[dm.id])).length,
    [assets, decisions, config.decisionMakers],
  )
  const totalComments = useMemo(
    () => assets.reduce((s, a) => s + (comments[a.id]?.length || 0), 0),
    [assets, comments],
  )

  const summaryRows = (
    <>
      {summary.map(({ asset, buttonCounts, avg, ratedCount, commentCount }) => {
        const img = firstImage(asset)
        const isActor = asset.type === "actor"
        const selected = selectedSummaryIds.has(asset.id)
        return (
          <div
            key={asset.id}
            onClick={isActor ? () => toggleSummarySelected(asset.id) : undefined}
            className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
              isActor ? "cursor-pointer" : ""
            } ${
              selected
                ? "bg-emerald-500/15 border-emerald-400/50 ring-1 ring-emerald-400/40"
                : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07]"
            }`}
          >
            {isActor && (
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleSummarySelected(asset.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${labelFor(asset)}`}
                className="w-4 h-4 shrink-0 accent-emerald-500 cursor-pointer"
              />
            )}
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
            {isBrowse ? (
              <div className="flex items-center gap-1.5 shrink-0 text-white/60">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-medium tabular-nums">{commentCount}</span>
              </div>
            ) : isRate ? (
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
    </>
  )

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
            {projectName && (
              <p className="text-xs font-semibold text-emerald-400 truncate uppercase tracking-wide">{projectName}</p>
            )}
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
          <div className="relative">
            <button
              onClick={() => {
                setShareOpen((v) => !v)
                setCopied(false)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                shareOpen ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              aria-expanded={shareOpen}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {shareOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShareOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-2 z-20 w-80 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-white mb-1">
                    <Link2 className="w-4 h-4 text-emerald-400" /> Direct link
                  </p>
                  <p className="text-[11px] text-white/40 mb-2.5">Anyone with this link can open this player session.</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={copyShareLink}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                        copied ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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

            {/* Actor details: age, playing age, location, and skills */}
            {current.type === "actor" && current.actor && (() => {
              const info = current.actor
              const hasStats = info.age || info.playingAge || info.location
              const hasSkills = info.skills && info.skills.length > 0
              if (!hasStats && !hasSkills) return null
              return (
                <div className="mt-3 w-full max-w-[64vw] rounded-xl bg-white/[0.04] border border-white/10 p-3">
                  {hasStats && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {info.age && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-white/80 text-xs font-medium">
                          <Cake className="w-3.5 h-3.5 text-emerald-400" /> Age {info.age}
                        </span>
                      )}
                      {info.playingAge && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-white/80 text-xs font-medium">
                          <UserSquare2 className="w-3.5 h-3.5 text-sky-400" /> Playing {info.playingAge}
                        </span>
                      )}
                      {info.location && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-white/80 text-xs font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" /> {info.location}
                        </span>
                      )}
                    </div>
                  )}
                  {hasSkills && (
                    <div className="mt-2.5">
                      <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wide text-white/40 font-medium mb-1.5">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Skills
                      </p>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {info.skills!.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
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
            <h3 className="text-sm font-semibold text-white">{isBrowse ? "Review & comment" : "Your decision"}</h3>
            <p className="text-xs text-white/50">
              {isBrowse
                ? "Browse the assets and leave comments"
                : isRate
                  ? `Rate this asset out of ${starCount}`
                  : "Choose your verdict — you decide only for yourself"}
            </p>
          </div>
          {!isBrowse && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {!me && (
              <p className="text-sm text-white/40 text-center py-6">No decision makers configured.</p>
            )}

            {/* Only the current user can cast a decision. */}
            {me && (() => {
              const v = per[me.id] || {}
              return (
                <div className="rounded-xl bg-white/[0.06] border border-emerald-500/30 p-3">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: me.color }}
                    >
                      {me.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate leading-tight">
                        {me.name} <span className="text-emerald-400 font-normal">(You)</span>
                      </p>
                      {me.role && <p className="text-[11px] text-white/40 truncate">{me.role}</p>}
                    </div>
                  </div>

                  {isRate ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {Array.from({ length: starCount }, (_, i) => i + 1).map((n) => {
                        const active = (v.rating || 0) >= n
                        return (
                          <button
                            key={n}
                            onClick={() => setVerdict(current.id, me.id, { rating: n })}
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
                            onClick={() => setVerdict(current.id, me.id, { buttonId: b.id })}
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
            })()}

            {/* Other participants are shown for context but cannot be voted on here. */}
            {others.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] uppercase tracking-wide text-white/30 font-medium px-1 mb-1.5">
                  Other participants
                </p>
                <div className="space-y-1.5">
                  {others.map((dm) => {
                    const v = per[dm.id] || {}
                    const hasVote = isRate ? typeof v.rating === "number" : !!v.buttonId
                    const btn = v.buttonId ? config.buttons.find((b) => b.id === v.buttonId) : undefined
                    return (
                      <div
                        key={dm.id}
                        className="flex items-center gap-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] px-2.5 py-2"
                      >
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 opacity-80"
                          style={{ backgroundColor: dm.color }}
                        >
                          {dm.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white/70 truncate leading-tight">{dm.name}</p>
                          {dm.role && <p className="text-[10px] text-white/30 truncate">{dm.role}</p>}
                        </div>
                        {hasVote ? (
                          isRate ? (
                            <span className="flex items-center gap-1 text-xs text-amber-400 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400" /> {v.rating}
                            </span>
                          ) : (
                            <span className={`text-xs font-medium shrink-0 ${btn ? TONE_TEXT[btn.tone] : "text-white/40"}`}>
                              {btn?.label}
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-white/30 shrink-0">Pending</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Comments */}
          {config.enableComments && (
            <div className={`border-t border-white/10 flex flex-col ${isBrowse ? "flex-1" : "max-h-[42%]"}`}>
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
                <MessageSquare className="w-4 h-4 text-white/50" />
                <h3 className="text-sm font-semibold text-white">Comments</h3>
                <span className="text-[11px] text-white/40">{currentComments.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {currentComments.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-4">No comments yet. Add the first note.</p>
                )}
                {currentComments.map((c) => {
                  const taggedNames = (c.mentions || [])
                    .map((id) => config.decisionMakers.find((d) => d.id === id)?.name)
                    .filter(Boolean) as string[]
                  return (
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
                      <MentionText
                        text={c.text}
                        people={mentionPeople}
                        className="text-sm text-white/70 leading-snug whitespace-pre-wrap break-words"
                      />
                      {taggedNames.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-sky-300/80">
                          <Users className="w-3 h-3" />
                          <span className="truncate">Notified {taggedNames.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="p-2.5 border-t border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                    style={{ backgroundColor: me?.color || "#64748b" }}
                  >
                    {(me?.name || "You").charAt(0).toUpperCase()}
                  </span>
                  <span>Commenting as {me?.name || "You"}</span>
                </div>
                <div className="flex items-end gap-2">
                  <MentionTextarea
                    value={draft}
                    onChange={setDraft}
                    people={mentionPeople}
                    onSubmit={() => addComment(current.id)}
                    rows={2}
                    dark
                    placeholder="Add a comment… use @ to tag someone"
                    className="w-full resize-none rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* End screen — appears once a decision is made on the final asset */}
      {ended && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-5 border-b border-white/10 text-center">
              <span className="mx-auto mb-3 w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </span>
              <h3 className="text-xl font-bold text-white text-balance">Review complete</h3>
              <p className="text-sm text-white/50 mt-1">{config.title || "Player session"}</p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-white/80 text-xs font-medium">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                  {decidedCount} of {total} decided
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-white/80 text-xs font-medium">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  {config.decisionMakers.length} decision maker{config.decisionMakers.length === 1 ? "" : "s"}
                </span>
                {config.enableComments && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-white/80 text-xs font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    {totalComments} comment{totalComments === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {summaryRows}
            </div>
            {selectedSummaryIds.size > 0 && (
              <div className="px-5 py-3 border-t border-white/10">
                <SummaryMoveBar
                  selectedActorIds={Array.from(selectedSummaryIds)}
                  onCleared={clearSummarySelection}
                  theme="dark"
                />
              </div>
            )}
            <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setEnded(false)
                  setIndex(0)
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Review again
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                <Check className="w-4 h-4" /> Done &amp; close
              </button>
            </div>
          </div>
        </div>
      )}

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
              {summaryRows}
            </div>
            {selectedSummaryIds.size > 0 && (
              <div className="px-5 py-3 border-t border-white/10">
                <SummaryMoveBar
                  selectedActorIds={Array.from(selectedSummaryIds)}
                  onCleared={clearSummarySelection}
                  theme="dark"
                />
              </div>
            )}
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
