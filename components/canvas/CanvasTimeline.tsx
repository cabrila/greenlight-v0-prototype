"use client"

import type React from "react"
import { useState } from "react"
import {
  X, Wand2, Sparkles, Trash2, Plus, Film, Music, Layers,
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
}

export interface Track {
  id: string
  name: string
  type: "video" | "audio"
  clips: Clip[]
}

const PX_PER_SEC = 16
const MIN_TIMELINE_SECONDS = 36
const RULER_TICK = 4 // seconds between ruler ticks

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

  const tracks: Track[] = data.tracks || DEFAULT_TRACKS
  const previz = data.previz as { style?: string; genre?: string; cutting?: string } | undefined

  const patch = (next: Record<string, any>) => onChange({ ...data, ...next })
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

  const addTrack = () => {
    const videoCount = tracks.filter((t) => t.type === "video").length
    const newTrack: Track = { id: `v-${Date.now().toString(36)}`, name: `Track ${videoCount + 1}`, type: "video", clips: [] }
    setTracks([newTrack, ...tracks])
  }

  /* ----------------------------- Sizing ---------------------------- */
  const maxTrackSeconds = tracks.reduce((max, t) => {
    const total = t.clips.reduce((sum, c) => sum + c.duration, 0)
    return Math.max(max, total)
  }, 0)
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
          type="button"
          onClick={() => setVisualizeOpen((o) => !o)}
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

        {/* Visualize panel */}
        {visualizeOpen && (
          <div className="absolute left-4 bottom-full mb-2 w-[22rem] max-w-[calc(100%-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 space-y-4">
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
        )}
      </div>

      {/* Editor: track gutter + scrollable lanes */}
      <div className="flex-1 flex min-h-0 bg-slate-900 overflow-hidden">
        {/* Track label gutter */}
        <div className="shrink-0 w-28 bg-slate-950/60 border-r border-slate-700/60">
          <div className="h-7 border-b border-slate-700/60" />
          {tracks.map((t) => (
            <div key={t.id} className="h-20 flex items-center gap-2 px-3 border-b border-slate-700/40">
              <span className="text-slate-400">
                {t.type === "audio" ? <Music className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
              </span>
              <span className="text-xs font-semibold text-slate-300 truncate">{t.name}</span>
            </div>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div className="flex-1 overflow-auto widget-control">
          <div className="relative" style={{ width: contentWidth }}>
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
              return (
                <div
                  key={t.id}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTrack(t.id) }}
                  onDragLeave={() => setDragOverTrack((c) => (c === t.id ? null : c))}
                  onDrop={(e) => handleTrackDrop(t.id, e)}
                  className={`h-20 border-b border-slate-700/40 relative transition-colors ${
                    over ? "bg-emerald-500/10" : "bg-slate-900"
                  } ${t.type === "audio" ? "bg-slate-900/60" : ""}`}
                >
                  {/* striped guide grid */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {ticks.map((sec) => (
                      <span key={sec} className="absolute top-0 bottom-0 border-l border-slate-700/30" style={{ left: sec * PX_PER_SEC }} />
                    ))}
                  </div>

                  {/* clips laid out contiguously */}
                  <div className="absolute inset-y-2 left-0 flex gap-0.5">
                    {t.clips.map((clip) => {
                      const w = Math.max(36, clip.duration * PX_PER_SEC)
                      const hasImg = clip.image && isValidImageUrl(clip.image)
                      return (
                        <div
                          key={clip.id}
                          className={`group relative h-full rounded-md overflow-hidden border shrink-0 ${
                            t.type === "audio"
                              ? "bg-sky-900/70 border-sky-500/50"
                              : "bg-emerald-900/40 border-emerald-500/50"
                          }`}
                          style={{ width: w }}
                          title={clip.title}
                        >
                          {t.type !== "audio" && hasImg && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={clip.image || "/placeholder.svg"}
                              alt={clip.title}
                              crossOrigin="anonymous"
                              className="absolute inset-0 w-full h-full object-cover opacity-70"
                              draggable={false}
                            />
                          )}
                          {t.type === "audio" && (
                            <div className="absolute inset-0 flex items-center gap-px px-1.5 opacity-60">
                              {Array.from({ length: Math.max(4, Math.floor(w / 5)) }, (_, i) => (
                                <span key={i} className="flex-1 bg-sky-300 rounded-full" style={{ height: `${20 + ((i * 37) % 60)}%` }} />
                              ))}
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1">
                            <span className="block text-[10px] font-medium text-white truncate">{clip.title}</span>
                          </div>
                          <button
                            onClick={() => removeClip(t.id, clip.id)}
                            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/50 text-white/80 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${clip.title}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}

                    {/* empty-state hint on the main scenes track */}
                    {t.clips.length === 0 && t.id === "v1" && (
                      <div className="flex items-center gap-2 h-full pl-3 text-slate-500 pointer-events-none">
                        <Layers className="w-4 h-4" />
                        <span className="text-xs italic">Drop images or scenes here to build your timeline</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
