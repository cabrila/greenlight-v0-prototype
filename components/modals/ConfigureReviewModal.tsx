"use client"

import type React from "react"
import { useMemo, useState } from "react"
import {
  X,
  MessageSquare,
  Star,
  MousePointerClick,
  Plus,
  Calendar,
  Users,
  Play,
  Check,
  ChevronRight,
  ImageIcon,
  Video,
  FileText,
  StickyNote,
  Map as MapIcon,
  LayoutGrid,
  Layers,
  SlidersHorizontal,
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ReviewVertical = "cast" | "location" | "prop" | "costume" | "generic"

export type ReviewContentKind = "image" | "video" | "field" | "note" | "map" | "document"

export interface ReviewContentItem {
  id: string
  label: string
  kind: ReviewContentKind
}

export interface ReviewAsset {
  id: string
  title: string
  subtitle?: string
  image?: string
  typeLabel?: string
  /** Vertical this asset belongs to — drives the recommended player layout. */
  vertical?: ReviewVertical
  /** Discrete content pieces the reviewer could be shown for this asset. */
  content?: ReviewContentItem[]
}

export interface ReviewParticipant {
  id: string
  name: string
  initials?: string
  role?: string
  color?: string
  bgColor?: string
}

export type ReviewMode = "buttons" | "comments" | "stars"

export type PlayerLayout = "spotlight" | "gallery" | "detail"

export interface ReviewConfig {
  title: string
  mode: ReviewMode
  buttonLabels: string[]
  reviewerIds: string[]
  deadline: string
  note: string
  assetIds: string[]
  /** Map of assetId -> included content item ids. */
  includedContent: Record<string, string[]>
  /** Customized player view layout. */
  playerLayout: PlayerLayout
  /** Dominant vertical of the reviewed assets. */
  vertical: ReviewVertical
}

interface ConfigureReviewModalProps {
  assets: ReviewAsset[]
  participants: ReviewParticipant[]
  defaultTitle?: string
  sourceLabel?: string
  onCancel: () => void
  onConfirm: (config: ReviewConfig) => void
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const REVIEW_MODES: { key: ReviewMode; label: string; description: string; icon: typeof Star }[] = [
  { key: "buttons", label: "Buttons", description: "Custom decision labels", icon: MousePointerClick },
  { key: "comments", label: "Comments only", description: "Open written feedback", icon: MessageSquare },
  { key: "stars", label: "Stars (1–5)", description: "Rated score per asset", icon: Star },
]

const CONTENT_ICONS: Record<ReviewContentKind, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  field: FileText,
  note: StickyNote,
  map: MapIcon,
  document: FileText,
}

/** Layout presets, labelled per-vertical so Locations, Cast, etc. read naturally. */
const LAYOUT_PRESETS: {
  key: PlayerLayout
  icon: typeof LayoutGrid
  label: (v: ReviewVertical) => string
  description: (v: ReviewVertical) => string
}[] = [
  {
    key: "spotlight",
    icon: Play,
    label: (v) => (v === "cast" ? "Headshot spotlight" : "Hero spotlight"),
    description: (v) =>
      v === "cast"
        ? "One large headshot with reel below"
        : "One large image with details below",
  },
  {
    key: "gallery",
    icon: LayoutGrid,
    label: (v) => (v === "location" ? "Location gallery" : "Gallery grid"),
    description: (v) =>
      v === "location" ? "All photos in a scannable grid" : "Every image shown as a grid",
  },
  {
    key: "detail",
    icon: Layers,
    label: () => "Detail panel",
    description: (v) =>
      v === "cast" ? "Media beside full profile fields" : "Media beside all specs & notes",
  },
]

/** Recommended default layout for each vertical. */
const DEFAULT_LAYOUT: Record<ReviewVertical, PlayerLayout> = {
  cast: "spotlight",
  location: "gallery",
  prop: "detail",
  costume: "detail",
  generic: "spotlight",
}

const VERTICAL_LABEL: Record<ReviewVertical, string> = {
  cast: "Cast",
  location: "Locations",
  prop: "Props",
  costume: "Costume / HMU",
  generic: "Assets",
}

function toInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** Pick the most common vertical across the selected assets. */
function dominantVertical(assets: ReviewAsset[]): ReviewVertical {
  const counts: Record<string, number> = {}
  for (const a of assets) {
    const v = a.vertical || "generic"
    counts[v] = (counts[v] || 0) + 1
  }
  let best: ReviewVertical = "generic"
  let bestN = -1
  for (const [v, n] of Object.entries(counts)) {
    if (n > bestN) {
      best = v as ReviewVertical
      bestN = n
    }
  }
  return best
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ConfigureReviewModal({
  assets,
  participants,
  defaultTitle,
  sourceLabel,
  onCancel,
  onConfirm,
}: ConfigureReviewModalProps) {
  const vertical = useMemo(() => dominantVertical(assets), [assets])

  const [title, setTitle] = useState(defaultTitle || "New review session")
  const [mode, setMode] = useState<ReviewMode>("buttons")
  const [buttonLabels, setButtonLabels] = useState<string[]>(["Approve", "Maybe", "Pass"])
  const [newLabel, setNewLabel] = useState("")
  const [reviewerIds, setReviewerIds] = useState<string[]>(participants.map((p) => p.id))
  const [deadline, setDeadline] = useState("")
  const [note, setNote] = useState("")
  const [assetIds, setAssetIds] = useState<string[]>(assets.map((a) => a.id))
  const [playerLayout, setPlayerLayout] = useState<PlayerLayout>(DEFAULT_LAYOUT[vertical])
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)

  // Per-asset content selection — everything included by default.
  const [includedContent, setIncludedContent] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {}
    for (const a of assets) init[a.id] = (a.content || []).map((c) => c.id)
    return init
  })

  const includedCount = assetIds.length
  const canStart = includedCount > 0 && reviewerIds.length > 0 && title.trim().length > 0

  const toggleReviewer = (id: string) =>
    setReviewerIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))

  const toggleAsset = (id: string) =>
    setAssetIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]))

  const toggleContent = (assetId: string, contentId: string) =>
    setIncludedContent((prev) => {
      const cur = prev[assetId] || []
      const next = cur.includes(contentId) ? cur.filter((c) => c !== contentId) : [...cur, contentId]
      return { ...prev, [assetId]: next }
    })

  const addLabel = () => {
    const v = newLabel.trim()
    if (!v || buttonLabels.includes(v)) return
    setButtonLabels((prev) => [...prev, v])
    setNewLabel("")
  }

  const removeLabel = (label: string) => setButtonLabels((prev) => prev.filter((l) => l !== label))

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && (e as React.KeyboardEvent).keyCode !== 229) {
      e.preventDefault()
      addLabel()
    }
  }

  const submit = () => {
    if (!canStart) return
    // Only report content for assets that are actually included.
    const scopedContent: Record<string, string[]> = {}
    for (const id of assetIds) scopedContent[id] = includedContent[id] || []
    onConfirm({
      title: title.trim(),
      mode,
      buttonLabels: mode === "buttons" ? buttonLabels : [],
      reviewerIds,
      deadline,
      note: note.trim(),
      assetIds,
      includedContent: scopedContent,
      playerLayout,
      vertical,
    })
  }

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], [])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="configure-review-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Play className="h-5 w-5" />
            </span>
            <div>
              <h2 id="configure-review-title" className="text-base font-semibold text-slate-900">
                Configure review session
              </h2>
              <p className="text-xs text-slate-500">
                {includedCount} {includedCount === 1 ? "asset" : "assets"}
                {vertical !== "generic" ? ` · ${VERTICAL_LABEL[vertical]}` : ""}
                {sourceLabel ? ` from ${sourceLabel}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">
            {/* Session name */}
            <div>
              <label htmlFor="review-title" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Session name
              </label>
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="e.g. Lead casting — first pass"
              />
            </div>

            {/* Review type */}
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Type of reviewing</span>
              <div className="grid grid-cols-3 gap-2">
                {REVIEW_MODES.map((m) => {
                  const Icon = m.icon
                  const active = mode === m.key
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMode(m.key)}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className={`text-xs font-semibold ${active ? "text-emerald-700" : "text-slate-700"}`}>
                        {m.label}
                      </span>
                      <span className="text-[11px] leading-tight text-slate-500">{m.description}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom button labels */}
              {mode === "buttons" && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Decision buttons
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {buttonLabels.map((label) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          aria-label={`Remove ${label}`}
                          className="text-emerald-400 hover:text-emerald-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1">
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={handleLabelKeyDown}
                        placeholder="Add label"
                        className="w-24 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addLabel}
                        aria-label="Add label"
                        className="rounded-full bg-emerald-100 p-1 text-emerald-600 hover:bg-emerald-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Player view layout (per-vertical) */}
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                {VERTICAL_LABEL[vertical]} player view
              </span>
              <div className="grid grid-cols-3 gap-2">
                {LAYOUT_PRESETS.map((preset) => {
                  const Icon = preset.icon
                  const active = playerLayout === preset.key
                  const recommended = DEFAULT_LAYOUT[vertical] === preset.key
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setPlayerLayout(preset.key)}
                      className={`relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      {recommended && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                          Rec
                        </span>
                      )}
                      <Icon className={`h-4 w-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className={`text-xs font-semibold ${active ? "text-emerald-700" : "text-slate-700"}`}>
                        {preset.label(vertical)}
                      </span>
                      <span className="text-[11px] leading-tight text-slate-500">{preset.description(vertical)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reviewers */}
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Reviewers
              </span>
              {participants.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-400">
                  No team members available to invite.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {participants.map((p) => {
                    const checked = reviewerIds.includes(p.id)
                    const initials = p.initials || toInitials(p.name)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleReviewer(p.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                          checked ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: p.bgColor || "#e2e8f0", color: p.color || "#334155" }}
                        >
                          {initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800">{p.name}</span>
                          {p.role && <span className="block truncate text-[11px] text-slate-500">{p.role}</span>}
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="review-deadline" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Response deadline <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="review-deadline"
                type="date"
                min={minDate}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Note */}
            <div>
              <label htmlFor="review-note" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Instructions for reviewers <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                placeholder="Add context or what you'd like feedback on…"
              />
            </div>

            {/* Assets to include (with per-asset content selection) */}
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Assets &amp; content to include ({includedCount}/{assets.length})
              </span>
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {assets.map((a) => {
                  const checked = assetIds.includes(a.id)
                  const content = a.content || []
                  const expanded = expandedAsset === a.id
                  const includedForAsset = includedContent[a.id] || []
                  return (
                    <div
                      key={a.id}
                      className={`rounded-lg transition-colors ${checked ? "bg-emerald-50/60" : "opacity-60"}`}
                    >
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => toggleAsset(a.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            {a.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={a.image || "/placeholder.svg"} alt={a.title} className="h-full w-full object-cover" />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-800">{a.title}</span>
                            {(a.typeLabel || a.subtitle) && (
                              <span className="block truncate text-[11px] text-slate-500">
                                {a.typeLabel}
                                {a.typeLabel && a.subtitle ? " · " : ""}
                                {a.subtitle}
                              </span>
                            )}
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                            }`}
                          >
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                        {content.length > 0 && checked && (
                          <button
                            type="button"
                            onClick={() => setExpandedAsset(expanded ? null : a.id)}
                            aria-expanded={expanded}
                            aria-label={`${expanded ? "Hide" : "Choose"} content for ${a.title}`}
                            className="flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          >
                            {includedForAsset.length}/{content.length}
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                          </button>
                        )}
                      </div>

                      {/* Per-asset content toggles */}
                      {expanded && checked && content.length > 0 && (
                        <div className="ml-11 mr-2 mb-2 grid grid-cols-2 gap-1">
                          {content.map((c) => {
                            const Icon = CONTENT_ICONS[c.kind]
                            const on = includedForAsset.includes(c.id)
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleContent(a.id, c.id)}
                                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-left text-[11px] font-medium transition-colors ${
                                  on
                                    ? "border-emerald-300 bg-white text-emerald-700"
                                    : "border-slate-200 bg-slate-50 text-slate-400"
                                }`}
                              >
                                <Icon className="h-3 w-3 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                                {on && <Check className="h-3 w-3 shrink-0 text-emerald-500" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5">
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canStart}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Play className="h-4 w-4" />
            Start review session
          </button>
        </div>
      </div>
    </div>
  )
}
