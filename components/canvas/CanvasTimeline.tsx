"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  X, Wand2, Sparkles, Trash2, Plus, Film, Music, Layers, ChevronDown, ChevronRight, Pencil, Check,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"

interface CanvasTimelineProps {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

export interface Clip {
  id: string
  title: string
  image?: string
  kind: string // source type: actor/prop/location/image...
  duration: number // seconds
  start?: number // offset in seconds from the timeline start (undefined = auto-packed)
}

export interface Track {
  id: string
  name: string
  type: "video" | "audio"
  clips: Clip[]
  collapsed?: boolean
}

const PX_PER_SEC = 16
const MIN_TIMELINE_SECONDS = 36
const RULER_TICK = 4 // seconds between ruler ticks
const MIN_CLIP_SECONDS = 1
const EXPANDED_H = 80
const COLLAPSED_H = 28

export const DEFAULT_TRACKS: Track[] = [
  { id: "v2", name: "Overlay", type: "video", clips: [] },
  { id: "v1", name: "Scenes", type: "video", clips: [] },
  { id: "a1", name: "Audio", type: "audio", clips: [] },
]

/** The track that newly added scenes/assets are appended to. */
export const SCENES_TRACK_ID = "v1"

/** Build a timeline clip from an asset-like payload. Returns null if invalid. */
export function createTimelineClip(p: any): Clip | null {
  if (!p || !p.title) return null
  const isAudio = p.type === "audio" || p.kind === "audio"
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: p.title,
    image: p.image,
    kind: p.type || p.kind || "image",
    duration: isAudio ? 6 : 4,
  }
}

/** Resolve each clip's start offset, packing any clip without an explicit start
 * directly after the previous clip. Keeps existing (start-less) clips contiguous
 * while honoring explicit positions set by dragging. */
function layoutClips(clips: Clip[]): { clip: Clip; start: number }[] {
  let cursor = 0
  return clips.map((c) => {
    const start = typeof c.start === "number" ? Math.max(0, c.start) : cursor
    cursor = start + c.duration
    return { clip: c, start }
  })
}

/** End time (seconds) of the last clip on a track. */
function trackEnd(clips: Clip[]): number {
  return layoutClips(clips).reduce((max, { clip, start }) => Math.max(max, start + clip.duration), 0)
}

const VISUAL_STYLES = ["Cinematic", "Film Noir", "Vibrant Pop", "Vintage Film", "Documentary", "Anime", "Dreamlike", "High Contrast"]
const GENRES = ["Drama", "Thriller", "Comedy", "Sci-Fi", "Horror", "Romance", "Action", "Fantasy"]
const CUTTING_STYLES = ["Continuity", "Montage", "Jump Cut", "Match Cut", "Long Take", "Cross-Cut", "Smash Cut", "Rhythmic"]

function fmtTime(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = Math.round(totalSec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function PillRow({
  label, options, value, onChange,
}: { label: string; options: string[]; value?: string; onChange: (v?: string) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(active ? undefined : opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Docked multi-track editing timeline. Lives inside CanvasDock (no canvas drag /
 * positioning). Accepts persisted `data` and reports edits via `onChange`.
 */
export default function CanvasTimeline({ data, onChange }: CanvasTimelineProps) {
  const [dragOverTrack, setDragOverTrack] = useState<string | null>(null)
  const [visualizeOpen, setVisualizeOpen] = useState(false)
  const [vizPos, setVizPos] = useState<{ left: number; bottom: number } | null>(null)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const visualizeBtnRef = useRef<HTMLButtonElement>(null)

  const tracks: Track[] = data.tracks || DEFAULT_TRACKS
  const previz = data.previz as { style?: string; genre?: string; cutting?: string } | undefined

  // Refs to avoid stale closures inside window-level drag listeners.
  const dataRef = useRef(data)
  dataRef.current = data
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks

  const patch = (next: Record<string, any>) => onChange({ ...dataRef.current, ...next })
  const setTracks = (next: Track[]) => patch({ tracks: next })

  /* ----------------------------- Clips ----------------------------- */
  const makeClip = createTimelineClip

  const handleTrackDrop = (trackId: string, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverTrack(null)
    const raw = e.dataTransfer.getData("application/json")
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      // Accept a single payload OR a group payload that carries an items[] array.
      const sources = Array.isArray(parsed.items) ? parsed.items : [parsed]
      const newClips = sources.map(makeClip).filter(Boolean) as Clip[]
      if (!newClips.length) return
      setTracks(tracks.map((t) => (t.id === trackId ? { ...t, clips: [...t.clips, ...newClips] } : t)))
    } catch {
      /* ignore malformed payloads */
    }
  }

  const removeClip = (trackId: string, clipId: string) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t)))
  }

  /* ----------------------------- Tracks ---------------------------- */
  const addTrack = () => {
    const videoCount = tracks.filter((t) => t.type === "video").length
    const newTrack: Track = { id: `v-${Date.now().toString(36)}`, name: `Track ${videoCount + 1}`, type: "video", clips: [] }
    setTracks([newTrack, ...tracks])
  }

  const removeTrack = (trackId: string) => {
    setTracks(tracks.filter((t) => t.id !== trackId))
  }

  const toggleCollapse = (trackId: string) => {
    setTracks(tracks.map((t) => (t.id === trackId ? { ...t, collapsed: !t.collapsed } : t)))
  }

  const startRename = (t: Track) => {
    setEditingTrackId(t.id)
    setEditingName(t.name)
  }

  const commitRename = () => {
    if (!editingTrackId) return
    const name = editingName.trim() || "Untitled"
    setTracks(tracks.map((t) => (t.id === editingTrackId ? { ...t, name } : t)))
    setEditingTrackId(null)
  }

  /* --------------------------- Resize clips ------------------------ */
  const resizeRef = useRef<{ trackId: string; clipId: string; startX: number; startDuration: number } | null>(null)

  const onResizeMove = (e: MouseEvent) => {
    const r = resizeRef.current
    if (!r) return
    const deltaSec = (e.clientX - r.startX) / PX_PER_SEC
    // Snap to half-second increments for a clean feel.
    const newDur = Math.max(MIN_CLIP_SECONDS, Math.round((r.startDuration + deltaSec) * 2) / 2)
    const next = tracksRef.current.map((t) =>
      t.id === r.trackId
        ? { ...t, clips: t.clips.map((c) => (c.id === r.clipId ? { ...c, duration: newDur } : c)) }
        : t,
    )
    onChange({ ...dataRef.current, tracks: next })
  }

  const onResizeEnd = () => {
    resizeRef.current = null
    window.removeEventListener("mousemove", onResizeMove)
    window.removeEventListener("mouseup", onResizeEnd)
    document.body.style.cursor = ""
  }

  const startResize = (e: React.MouseEvent, trackId: string, clip: Clip) => {
    e.preventDefault()
    e.stopPropagation()
    resizeRef.current = { trackId, clipId: clip.id, startX: e.clientX, startDuration: clip.duration }
    window.addEventListener("mousemove", onResizeMove)
    window.addEventListener("mouseup", onResizeEnd)
    document.body.style.cursor = "ew-resize"
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onResizeMove)
      window.removeEventListener("mouseup", onResizeEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ----------------------- Move / drag clips ----------------------- */
  // Lane DOM refs so we can detect which track the pointer is over while dragging.
  const laneRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [dragInfo, setDragInfo] = useState<{ clipId: string; trackId: string } | null>(null)
  const dragRef = useRef<{
    clipId: string
    fromTrackId: string
    grabOffsetSec: number // distance from clip start to the pointer, in seconds
  } | null>(null)

  const secondsFromClientX = (clientX: number) => {
    const rect = contentRef.current?.getBoundingClientRect()
    const scrollLeft = contentRef.current?.parentElement?.scrollLeft ?? 0
    const left = rect ? rect.left : 0
    return Math.max(0, (clientX - left + scrollLeft) / PX_PER_SEC)
  }

  const trackAtClientY = (clientY: number): string | null => {
    for (const t of tracksRef.current) {
      const el = laneRefs.current[t.id]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (clientY >= r.top && clientY <= r.bottom) return t.id
    }
    return null
  }

  const onClipDragMove = (e: MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    // New start position, snapped to half-second steps.
    const rawStart = secondsFromClientX(e.clientX) - d.grabOffsetSec
    const newStart = Math.max(0, Math.round(rawStart * 2) / 2)
    const targetTrackId = trackAtClientY(e.clientY) || d.fromTrackId

    let movingClip: Clip | undefined
    const stripped = tracksRef.current.map((t) => {
      const found = t.clips.find((c) => c.id === d.clipId)
      if (found) movingClip = found
      return { ...t, clips: t.clips.filter((c) => c.id !== d.clipId) }
    })
    if (!movingClip) return
    const updatedClip = { ...movingClip, start: newStart }
    const next = stripped.map((t) =>
      t.id === targetTrackId ? { ...t, clips: [...t.clips, updatedClip] } : t,
    )
    if (targetTrackId !== d.fromTrackId) d.fromTrackId = targetTrackId
    setDragInfo({ clipId: d.clipId, trackId: targetTrackId })
    onChange({ ...dataRef.current, tracks: next })
  }

  const onClipDragEnd = () => {
    dragRef.current = null
    setDragInfo(null)
    window.removeEventListener("mousemove", onClipDragMove)
    window.removeEventListener("mouseup", onClipDragEnd)
    document.body.style.cursor = ""
  }

  const startClipDrag = (e: React.MouseEvent, trackId: string, clip: Clip, resolvedStart: number) => {
    // Ignore right/middle clicks and let the resize handle take precedence.
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const grabOffsetSec = secondsFromClientX(e.clientX) - resolvedStart
    dragRef.current = { clipId: clip.id, fromTrackId: trackId, grabOffsetSec }
    setDragInfo({ clipId: clip.id, trackId })
    window.addEventListener("mousemove", onClipDragMove)
    window.addEventListener("mouseup", onClipDragEnd)
    document.body.style.cursor = "grabbing"
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onClipDragMove)
      window.removeEventListener("mouseup", onClipDragEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* --------------------------- Visualize --------------------------- */
  // Anchor the panel with fixed positioning so it is never clipped by the
  // dock's overflow-hidden container and always renders front-most.
  const toggleVisualize = () => {
    setVisualizeOpen((o) => {
      const next = !o
      if (next && visualizeBtnRef.current) {
        const rect = visualizeBtnRef.current.getBoundingClientRect()
        setVizPos({ left: rect.left, bottom: window.innerHeight - rect.top + 8 })
      }
      return next
    })
  }

  /* ----------------------------- Sizing ---------------------------- */
  const trackHeight = (t: Track) => (t.collapsed ? COLLAPSED_H : EXPANDED_H)
  const maxTrackSeconds = tracks.reduce((max, t) => Math.max(max, trackEnd(t.clips)), 0)
  const totalSeconds = Math.max(MIN_TIMELINE_SECONDS, Math.ceil((maxTrackSeconds + 8) / RULER_TICK) * RULER_TICK)
  const contentWidth = totalSeconds * PX_PER_SEC
  const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0)
  const ticks = Array.from({ length: Math.floor(totalSeconds / RULER_TICK) + 1 }, (_, i) => i * RULER_TICK)

  /* ============================ Render ============================ */
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="relative shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-white">
        <button
          ref={visualizeBtnRef}
          type="button"
          onClick={toggleVisualize}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            visualizeOpen ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Visualize
        </button>

        <button
          type="button"
          onClick={addTrack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add track</span>
        </button>

        {previz && (previz.style || previz.genre || previz.cutting) && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            {[previz.style, previz.genre, previz.cutting].filter(Boolean).join(" · ")}
          </span>
        )}

        <span className="ml-auto text-xs text-slate-400">
          {clipCount} clip{clipCount === 1 ? "" : "s"} · {fmtTime(maxTrackSeconds)}
        </span>
      </div>

      {/* Visualize panel — fixed so it is never clipped and stays front-most */}
      {visualizeOpen && vizPos && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setVisualizeOpen(false)} aria-hidden="true" />
          <div
            className="fixed w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-[100] space-y-4"
            style={{ left: vizPos.left, bottom: vizPos.bottom }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-800">Pre-visualize your edit</h4>
              <button
                className="ml-auto text-slate-400 hover:text-slate-600"
                onClick={() => setVisualizeOpen(false)}
                aria-label="Close visualize options"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-pretty">
              Choose a look and feel — your {clipCount} clip{clipCount === 1 ? "" : "s"} will be used to generate a pre-visualization of the movie.
            </p>
            <PillRow label="Visual Style" options={VISUAL_STYLES} value={previz?.style} onChange={(v) => patch({ previz: { ...previz, style: v } })} />
            <PillRow label="Genre" options={GENRES} value={previz?.genre} onChange={(v) => patch({ previz: { ...previz, genre: v } })} />
            <PillRow label="Cutting Style" options={CUTTING_STYLES} value={previz?.cutting} onChange={(v) => patch({ previz: { ...previz, cutting: v } })} />
            <button
              type="button"
              onClick={() => { patch({ previz: { ...previz, generatedAt: Date.now() } }); setVisualizeOpen(false) }}
              disabled={clipCount === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              Generate Pre-visualization
            </button>
          </div>
        </>
      )}

      {/* Editor: track gutter + scrollable lanes */}
      <div className="flex-1 flex min-h-0 bg-slate-900 overflow-hidden">
        {/* Track label gutter */}
        <div className="shrink-0 w-44 bg-slate-950/60 border-r border-slate-700/60">
          <div className="h-7 border-b border-slate-700/60" />
          {tracks.map((t) => {
            const editing = editingTrackId === t.id
            return (
              <div
                key={t.id}
                className="group/track flex items-center gap-1.5 px-2 border-b border-slate-700/40"
                style={{ height: trackHeight(t) }}
              >
                <button
                  type="button"
                  onClick={() => toggleCollapse(t.id)}
                  className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={t.collapsed ? `Expand ${t.name}` : `Collapse ${t.name}`}
                  title={t.collapsed ? "Expand track" : "Collapse track"}
                >
                  {t.collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <span className="shrink-0 text-slate-400">
                  {t.type === "audio" ? <Music className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                </span>

                {editing ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename()
                      if (e.key === "Escape") setEditingTrackId(null)
                    }}
                    className="flex-1 min-w-0 bg-slate-800 text-xs font-semibold text-slate-100 rounded px-1.5 py-1 border border-emerald-500/60 focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onDoubleClick={() => startRename(t)}
                    className="flex-1 min-w-0 text-left text-xs font-semibold text-slate-300 truncate hover:text-white transition-colors"
                    title={`${t.name} (double-click to rename)`}
                  >
                    {t.name}
                  </button>
                )}

                {editing ? (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); commitRename() }}
                    className="shrink-0 text-emerald-400 hover:text-emerald-300"
                    aria-label="Save track name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/track:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startRename(t)}
                      className="text-slate-400 hover:text-slate-200 p-0.5"
                      aria-label={`Rename ${t.name}`}
                      title="Rename track"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTrack(t.id)}
                      className="text-slate-400 hover:text-red-400 p-0.5"
                      aria-label={`Delete ${t.name}`}
                      title="Delete track"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-auto widget-control">
          <div ref={contentRef} className="relative" style={{ width: contentWidth }}>
            {/* Ruler */}
            <div className="h-7 border-b border-slate-700/60 relative">
              {ticks.map((sec) => (
                <div key={sec} className="absolute top-0 bottom-0 flex items-end pb-0.5" style={{ left: sec * PX_PER_SEC }}>
                  <span className="border-l border-slate-700 h-2.5" />
                  <span className="text-[10px] text-slate-500 ml-1 -mb-0.5">{fmtTime(sec)}</span>
                </div>
              ))}
            </div>

            {/* Track lanes */}
            {tracks.map((t) => {
              const over = dragOverTrack === t.id
              const dropTarget = dragInfo?.trackId === t.id
              const collapsed = !!t.collapsed
              const laid = layoutClips(t.clips)
              return (
                <div
                  key={t.id}
                  ref={(el) => { laneRefs.current[t.id] = el }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTrack(t.id) }}
                  onDragLeave={() => setDragOverTrack((c) => (c === t.id ? null : c))}
                  onDrop={(e) => handleTrackDrop(t.id, e)}
                  className={`border-b border-slate-700/40 relative transition-colors ${
                    over || dropTarget ? "bg-emerald-500/10" : "bg-slate-900"
                  } ${t.type === "audio" ? "bg-slate-900/60" : ""}`}
                  style={{ height: trackHeight(t) }}
                >
                  {/* striped guide grid */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {ticks.map((sec) => (
                      <span key={sec} className="absolute top-0 bottom-0 border-l border-slate-700/30" style={{ left: sec * PX_PER_SEC }} />
                    ))}
                  </div>

                  {/* clips positioned by their start offset */}
                  {laid.map(({ clip, start }) => {
                    const w = Math.max(36, clip.duration * PX_PER_SEC)
                    const hasImg = clip.image && isValidImageUrl(clip.image)
                    const dragging = dragInfo?.clipId === clip.id
                    return (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => startClipDrag(e, t.id, clip, start)}
                        className={`group/clip absolute rounded-md overflow-hidden border cursor-grab active:cursor-grabbing ${
                          collapsed ? "top-1 bottom-1" : "top-2 bottom-2"
                        } ${
                          t.type === "audio"
                            ? "bg-sky-900/70 border-sky-500/50"
                            : "bg-emerald-900/40 border-emerald-500/50"
                        } ${dragging ? "ring-2 ring-emerald-300 shadow-lg shadow-black/40 z-10 opacity-90" : ""}`}
                        style={{ width: w, left: start * PX_PER_SEC }}
                        title={`${clip.title} · ${fmtTime(clip.duration)} — drag to move`}
                      >
                        {t.type !== "audio" && hasImg && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={clip.image || "/placeholder.svg"}
                            alt={clip.title}
                            crossOrigin="anonymous"
                            className="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
                            draggable={false}
                          />
                        )}
                        {t.type === "audio" && (
                          <div className="absolute inset-0 flex items-center gap-px px-1.5 opacity-60 pointer-events-none">
                            {Array.from({ length: Math.max(4, Math.floor(w / 5)) }, (_, i) => (
                              <span key={i} className="flex-1 bg-sky-300 rounded-full" style={{ height: `${20 + ((i * 37) % 60)}%` }} />
                            ))}
                          </div>
                        )}
                        {!collapsed && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1 pointer-events-none">
                            <span className="block text-[10px] font-medium text-white truncate">{clip.title}</span>
                          </div>
                        )}
                        {!collapsed && (
                          <button
                            onClick={() => removeClip(t.id, clip.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 text-white/80 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover/clip:opacity-100 transition-opacity"
                            aria-label={`Remove ${clip.title}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {/* Drag-to-resize handle (right edge) */}
                        <div
                          onMouseDown={(e) => startResize(e, t.id, clip)}
                          className="absolute inset-y-0 right-0 w-2 cursor-ew-resize flex items-center justify-center bg-black/0 hover:bg-emerald-400/40 group-hover/clip:bg-emerald-400/20 transition-colors"
                          title="Drag to change duration"
                          role="separator"
                          aria-label={`Resize ${clip.title}`}
                        >
                          <span className="h-1/2 w-0.5 rounded-full bg-white/70" />
                        </div>
                      </div>
                    )
                  })}

                  {/* empty-state hint on the main scenes track */}
                  {t.clips.length === 0 && t.id === "v1" && !collapsed && (
                    <div className="absolute inset-y-2 left-0 flex items-center gap-2 pl-3 text-slate-500 pointer-events-none">
                      <Layers className="w-4 h-4" />
                      <span className="text-xs italic">Drop images or scenes here to build your timeline</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
