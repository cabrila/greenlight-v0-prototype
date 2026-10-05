"use client"

import { useEffect, useMemo, useState } from "react"
import {
  X, ChevronLeft, ChevronRight, Share2, Link2, Check, Star, ThumbsUp, ThumbsDown, MapPin,
  ImageIcon, Video, StickyNote, Calendar, CheckCircle2,
} from "lucide-react"
import type { ReviewConfig } from "@/components/modals/ConfigureReviewModal"
import type { ReviewAssetDetails, AssetMedia } from "./canvasReviewAssets"
import { COLLABORATORS, collaboratorName } from "./canvasCollaborators"

interface CanvasReviewPlayerProps {
  config: ReviewConfig
  assets: ReviewAssetDetails[]
  onClose: () => void
}

interface Response {
  decision?: string
  stars?: number
  comment: string
}

const VERTICAL_CHIP: Record<string, string> = {
  cast: "bg-emerald-100 text-emerald-700",
  prop: "bg-amber-100 text-amber-700",
  costume: "bg-rose-100 text-rose-700",
  location: "bg-sky-100 text-sky-700",
  generic: "bg-slate-100 text-slate-700",
}

const FIELDS_HEADING: Record<string, string> = {
  cast: "Profile",
  prop: "Prop specs",
  costume: "Wardrobe details",
  location: "Location specs",
  generic: "Details",
}

export default function CanvasReviewPlayer({ config, assets, onClose }: CanvasReviewPlayerProps) {
  const reviewAssets = useMemo(() => assets.filter((a) => config.assetIds.includes(a.id)), [assets, config.assetIds])
  const [index, setIndex] = useState(0)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Response>>({})
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const asset = reviewAssets[index]
  const included = new Set(config.includedContent[asset?.id] || [])
  const images = asset ? asset.images.filter((m) => included.has(m.id)) : []
  const videos = asset ? asset.videos.filter((m) => included.has(m.id)) : []
  const fields = asset ? asset.fields.filter((f) => included.has(f.id)) : []
  const showTags = !!asset && included.has("tags") && asset.tags.length > 0
  const showNotes = !!asset && included.has("notes") && !!asset.notes
  const showMap = !!asset && included.has("map") && !!asset.address
  const response = (asset && responses[asset.id]) || { comment: "" }
  const reviewers = COLLABORATORS.filter((c) => config.reviewerIds.includes(c.id))
  const answered = reviewAssets.filter((a) => {
    const r = responses[a.id]
    return r && (r.decision || r.stars || r.comment.trim())
  }).length
  const shareUrl = `https://gogreenlight.app/review/${encodeURIComponent(config.title.toLowerCase().replace(/\s+/g, "-"))}`

  const go = (delta: number) => {
    setIndex((i) => Math.min(reviewAssets.length - 1, Math.max(0, i + delta)))
    setMediaIndex(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  const update = (patch: Partial<Response>) =>
    asset && setResponses((prev) => ({ ...prev, [asset.id]: { ...(prev[asset.id] || { comment: "" }), ...patch } }))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      /* clipboard may be blocked inside the preview iframe */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (!asset) return null

  const hero: AssetMedia | undefined = images[Math.min(mediaIndex, Math.max(0, images.length - 1))]

  const MediaEmpty = () => (
    <div className="flex h-full min-h-56 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
      <ImageIcon className="mr-2 h-5 w-5" /> No images included
    </div>
  )

  const Thumbs = () =>
    images.length > 1 ? (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMediaIndex(i)}
            aria-label={`Show ${m.label}`}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
              i === mediaIndex ? "border-emerald-500" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <img src={m.url || "/placeholder.svg"} alt={m.label} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    ) : null

  const Videos = () =>
    videos.length ? (
      <div className="space-y-2">
        {videos.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-xl bg-black">
            <video src={v.url} controls className="aspect-video w-full" aria-label={v.label} />
            <p className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
              <Video className="h-3.5 w-3.5" /> {v.label}
            </p>
          </div>
        ))}
      </div>
    ) : null

  const Details = () => (
    <div className="space-y-5">
      {fields.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{FIELDS_HEADING[asset.vertical]}</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.id} className="min-w-0">
                <dt className="text-xs text-slate-500">{f.label}</dt>
                <dd className="text-sm font-medium text-slate-800 text-pretty">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {showTags && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Vibe tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {asset.tags.map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{t}</span>
            ))}
          </div>
        </section>
      )}
      {showMap && asset.address && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Address</h3>
          <a
            href={
              asset.address.lat && asset.address.lng
                ? `https://www.google.com/maps/search/?api=1&query=${asset.address.lat},${asset.address.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(asset.address.text)}`
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 transition-colors"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <span>
              {asset.address.text}
              <span className="block text-xs text-sky-700">Open in Maps</span>
            </span>
          </a>
        </section>
      )}
      {showNotes && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <StickyNote className="h-3.5 w-3.5" /> Notes
          </h3>
          <p className="whitespace-pre-line rounded-lg bg-amber-50 p-3 text-sm text-slate-700 text-pretty">{asset.notes}</p>
        </section>
      )}
      {(asset.reactions.up.length > 0 || asset.reactions.down.length > 0) && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Canvas reactions</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            {asset.reactions.up.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <ThumbsUp className="h-3.5 w-3.5" /> {asset.reactions.up.map(collaboratorName).join(", ")}
              </span>
            )}
            {asset.reactions.down.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                <ThumbsDown className="h-3.5 w-3.5" /> {asset.reactions.down.map(collaboratorName).join(", ")}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  )

  const Body = () => {
    if (config.playerLayout === "gallery") {
      return (
        <div className="space-y-6">
          {images.length ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {images.map((m) => (
                <figure key={m.id} className="overflow-hidden rounded-xl bg-slate-100">
                  <img src={m.url || "/placeholder.svg"} alt={m.label} className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="px-2.5 py-1.5 text-xs text-slate-500 truncate">{m.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <MediaEmpty />
          )}
          <Videos />
          <Details />
        </div>
      )
    }
    if (config.playerLayout === "detail") {
      return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {hero ? (
              <img src={hero.url || "/placeholder.svg"} alt={hero.label} className="aspect-square w-full rounded-xl bg-slate-100 object-contain" />
            ) : (
              <MediaEmpty />
            )}
            <Thumbs />
            <Videos />
          </div>
          <Details />
        </div>
      )
    }
    return (
      <div className="space-y-5">
        {hero ? (
          <img
            src={hero.url || "/placeholder.svg"}
            alt={hero.label}
            className="mx-auto max-h-[46vh] w-full rounded-xl bg-slate-900 object-contain"
          />
        ) : (
          <MediaEmpty />
        )}
        <Thumbs />
        <Videos />
        <Details />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-50" role="dialog" aria-modal="true" aria-label={config.title}>
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Review session</p>
          <h1 className="truncate text-base font-semibold text-slate-900">{config.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {config.deadline && (
            <span className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex">
              <Calendar className="h-3.5 w-3.5" /> Due {new Date(config.deadline).toLocaleDateString()}
            </span>
          )}
          <div className="hidden -space-x-2 sm:flex">
            {reviewers.map((r) => (
              <span
                key={r.id}
                title={r.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
                style={{ backgroundColor: r.color }}
              >
                {r.initials}
              </span>
            ))}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShareOpen((o) => !o)}
              aria-expanded={shareOpen}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            {shareOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                <p className="text-sm font-semibold text-slate-900">Share this review</p>
                <p className="mt-0.5 text-xs text-slate-500">Anyone with the link and access to the project can respond.</p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    aria-label="Review link"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Invited reviewers</p>
                <ul className="space-y-2">
                  {reviewers.map((r) => (
                    <li key={r.id} className="flex items-center gap-2.5 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: r.color }}>
                        {r.initials}
                      </span>
                      <span className="flex-1 text-slate-700">{r.name}</span>
                      <span className="text-xs text-slate-400">{r.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
            <span className="sr-only">Close review</span>
          </button>
        </div>
      </header>

      {submitted ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Review sent</h2>
            <p className="mt-1 text-sm text-slate-500 text-pretty">
              {`You responded to ${answered} of ${reviewAssets.length} items. ${reviewers.length} reviewer${reviewers.length === 1 ? "" : "s"} have been notified.`}
            </p>
            <button type="button" onClick={onClose} className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
              Back to canvas
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <nav aria-label="Review items" className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3 md:block">
            <p className="mb-2 px-1 text-xs text-slate-500 tabular-nums">{`${answered} of ${reviewAssets.length} reviewed`}</p>
            <ul className="space-y-1">
              {reviewAssets.map((a, i) => {
                const r = responses[a.id]
                const done = r && (r.decision || r.stars || r.comment.trim())
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => { setIndex(i); setMediaIndex(0) }}
                      aria-current={i === index}
                      className={`flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors ${
                        i === index ? "bg-emerald-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                        {a.images[0] && <img src={a.images[0].url || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{a.title}</span>
                        <span className="block truncate text-[11px] text-slate-500">{a.typeLabel}</span>
                      </span>
                      {done && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl p-5 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${VERTICAL_CHIP[asset.vertical]}`}>{asset.typeLabel}</span>
                <h2 className="text-2xl font-semibold text-slate-900 text-balance">{asset.title}</h2>
                {asset.subtitle && <span className="text-sm text-slate-500">{asset.subtitle}</span>}
              </div>
              <Body />
            </div>
          </main>

          <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {config.note && (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 text-pretty">
                  <span className="block font-semibold text-slate-700">Instructions</span>
                  {config.note}
                </div>
              )}

              {config.mode === "buttons" && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Your decision</p>
                  <div className="grid gap-2">
                    {config.buttonLabels.map((label) => {
                      const active = response.decision === label
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => update({ decision: active ? undefined : label })}
                          aria-pressed={active}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            active ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {config.mode === "stars" && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">Your rating</p>
                  <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={response.stars === n}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                        onClick={() => update({ stars: n })}
                        className="p-1"
                      >
                        <Star className={`h-7 w-7 ${response.stars && n <= response.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-slate-800">
                  {config.mode === "comments" ? "Your feedback" : "Comment (optional)"}
                </label>
                <textarea
                  id="review-comment"
                  value={response.comment}
                  onChange={(e) => update({ comment: e.target.value })}
                  rows={5}
                  placeholder={`Share your thoughts on ${asset.title}...`}
                  className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous item</span>
              </button>
              <span className="flex-1 text-center text-xs text-slate-500 tabular-nums">{`${index + 1} / ${reviewAssets.length}`}</span>
              {index < reviewAssets.length - 1 ? (
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSubmitted(true)}
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  Submit review
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
