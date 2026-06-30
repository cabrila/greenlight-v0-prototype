"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  X, ChevronDown, ChevronRight, Film, Clapperboard, Sparkles, UserPlus,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { CanvasItem } from "./CanvasItemCard"

export interface WidgetActor {
  refId: string
  name: string
  image?: string
}

export interface WidgetCharacter {
  id: string
  name: string
  image?: string
}

interface CanvasWidgetProps {
  item: CanvasItem
  isSelected: boolean
  interactive: boolean
  zoom: number
  actors: WidgetActor[]
  characters: WidgetCharacter[]
  locations: { id: string; name: string }[]
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onRemove: (id: string) => void
  onDataChange: (id: string, data: Record<string, any>) => void
}

const MIN_W = 360
const MIN_H = 280

const TIME_OPTIONS = ["Dawn", "Morning", "Midday", "Afternoon", "Dusk", "Night"]
const WEATHER_OPTIONS = ["Clear", "Overcast", "Rain", "Storm", "Fog", "Snow"]

function Avatar({ src, name, size = 56 }: { src?: string; name: string; size?: number }) {
  const valid = src && isValidImageUrl(src)
  return valid ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/placeholder.svg"}
      alt={name}
      crossOrigin="anonymous"
      className="rounded-xl object-cover bg-slate-100"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-xl bg-slate-200 text-slate-500 font-semibold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

/* Collapsible section used by the Scene Generator */
function Section({
  title, defaultOpen = true, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

export default function CanvasWidget({
  item, isSelected, interactive, zoom, actors, characters, locations,
  onSelect, onDrag, onResize, onRemove, onDataChange,
}: CanvasWidgetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const data = item.widgetData || {}
  const width = item.width ?? 460
  const height = item.height ?? 600

  /* -------------------------- Header drag -------------------------- */
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return
    onSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey)
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    if (!isDragging) return
    const move = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (dx !== 0 || dy !== 0) {
        onDrag(item.id, dx, dy)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    const up = () => setIsDragging(false)
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
    document.body.style.userSelect = "none"
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
      document.body.style.userSelect = ""
    }
  }, [isDragging, item.id, onDrag])

  /* --------------------------- Resize ------------------------------ */
  const startResize = (e: React.MouseEvent) => {
    if (!interactive) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(item.id, false)
    setIsResizing(true)
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: width, h: height }
  }

  useEffect(() => {
    if (!isResizing) return
    const move = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStartRef.current.x) / zoom
      const dy = (e.clientY - resizeStartRef.current.y) / zoom
      onResize(item.id, Math.max(MIN_W, resizeStartRef.current.w + dx), Math.max(MIN_H, resizeStartRef.current.h + dy))
    }
    const up = () => setIsResizing(false)
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
    document.body.style.userSelect = "none"
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
      document.body.style.userSelect = ""
    }
  }, [isResizing, item.id, onResize, zoom])

  const patch = (next: Record<string, any>) => onDataChange(item.id, { ...data, ...next })

  const isScene = item.type === "scene-generator"
  const Icon = isScene ? Film : Clapperboard
  const title = isScene ? "Scene Generator" : "Character Casting"

  /* ============================ Header ============================ */
  const header = (
    <div className="shrink-0">
      <div className="h-1.5 bg-emerald-500 rounded-t-2xl" />
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 cursor-grab active:cursor-grabbing"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {!isScene && (
          <span className="hidden md:block ml-auto text-sm text-slate-400">Drop actors from the library into a role</span>
        )}
        <button
          className={`widget-control text-slate-400 hover:text-slate-600 transition-colors ${isScene ? "ml-auto" : ""}`}
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          aria-label={`Remove ${title}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  /* ===================== Scene Generator body ===================== */
  const selectedActorIds: string[] = data.selectedActorIds || []
  const toggleActor = (refId: string) => {
    const set = new Set(selectedActorIds)
    set.has(refId) ? set.delete(refId) : set.add(refId)
    patch({ selectedActorIds: Array.from(set) })
  }

  const sceneBody = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 widget-control">
      {data.generated && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {data.generated}
        </div>
      )}

      <Section title="Actors">
        {actors.length === 0 ? (
          <p className="text-sm text-slate-400">No cast in this project yet.</p>
        ) : (
          <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5">
            {actors.map((a) => {
              const active = selectedActorIds.includes(a.refId)
              return (
                <button
                  key={a.refId}
                  type="button"
                  onClick={() => toggleActor(a.refId)}
                  className="flex flex-col items-center gap-1 group"
                  title={a.name}
                >
                  <span className={`rounded-xl p-0.5 transition-all ${active ? "ring-2 ring-emerald-500" : "ring-1 ring-slate-200 group-hover:ring-slate-300"}`}>
                    <Avatar src={a.image} name={a.name} size={52} />
                  </span>
                  <span className={`text-xs truncate max-w-[60px] ${active ? "text-emerald-700 font-medium" : "text-slate-600"}`}>{a.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Location" defaultOpen={false}>
        {locations.length === 0 ? (
          <p className="text-sm text-slate-400">No locations in this project yet.</p>
        ) : (
          <div className="space-y-1.5">
            {locations.map((loc) => (
              <label key={loc.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name={`loc-${item.id}`}
                  checked={data.location === loc.name}
                  onChange={() => patch({ location: loc.name })}
                  className="accent-emerald-500"
                />
                <span className="text-sm text-slate-700">{loc.name}</span>
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title="Time of Day" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((t) => {
            const active = data.timeOfDay === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => patch({ timeOfDay: active ? undefined : t })}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Weather">
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((w) => {
            const active = data.weather === w
            return (
              <button
                key={w}
                type="button"
                onClick={() => patch({ weather: active ? undefined : w })}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {w}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Scene Description">
        <textarea
          value={data.description || ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Describe the emotional tone, action, or atmosphere of this scene..."
          className="w-full h-24 resize-none rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed"
        />
      </Section>
    </div>
  )

  const sceneFooter = (
    <div className="shrink-0 border-t border-slate-100 p-4">
      <button
        type="button"
        onClick={() => {
          const names = actors.filter((a) => selectedActorIds.includes(a.refId)).map((a) => a.name)
          const parts = [
            names.length ? `${names.join(", ")}` : "An empty stage",
            data.location ? `at ${data.location}` : null,
            data.timeOfDay ? `during ${data.timeOfDay.toLowerCase()}` : null,
            data.weather ? `with ${data.weather.toLowerCase()} skies` : null,
          ].filter(Boolean)
          patch({ generated: `Scene: ${parts.join(", ")}.${data.description ? ` ${data.description}` : ""}` })
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Generate Scene
      </button>
    </div>
  )

  /* ===================== Character Casting body ==================== */
  const assignments: Record<string, WidgetActor[]> = data.assignments || {}

  const assignActor = (charId: string, actor: WidgetActor) => {
    const current = assignments[charId] || []
    if (current.some((a) => a.refId === actor.refId)) return
    patch({ assignments: { ...assignments, [charId]: [...current, actor] } })
  }
  const unassignActor = (charId: string, refId: string) => {
    const current = assignments[charId] || []
    patch({ assignments: { ...assignments, [charId]: current.filter((a) => a.refId !== refId) } })
  }

  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  // True while an actor is being dragged anywhere over the board.
  const [boardDragActive, setBoardDragActive] = useState(false)

  const handleColDrop = (charId: string, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCol(null)
    setBoardDragActive(false)
    const raw = e.dataTransfer.getData("application/json")
    if (!raw) return
    try {
      const p = JSON.parse(raw)
      if (p.type !== "actor") return
      assignActor(charId, { refId: p.refId, name: p.title, image: p.image })
    } catch {
      /* ignore */
    }
  }

  // Board-level catch-all: swallow any drop that lands on the board but not on a
  // specific column (e.g. the header or gaps) so the canvas never creates a loose
  // actor card on top of the casting board.
  const handleBoardDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCol(null)
    setBoardDragActive(false)
  }

  const castingBody = (
    <div
      className={`flex-1 overflow-auto p-4 widget-control transition-colors ${
        boardDragActive ? "bg-emerald-50/40" : ""
      }`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/json")) {
          e.preventDefault()
          e.dataTransfer.dropEffect = "copy"
          setBoardDragActive(true)
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setBoardDragActive(false)
          setDragOverCol(null)
        }
      }}
      onDrop={handleBoardDrop}
    >
      {characters.length === 0 ? (
        <p className="text-sm text-slate-400">No characters in this project yet.</p>
      ) : (
        <div className="flex gap-3 h-full min-w-min">
          {characters.map((char) => {
            const assigned = assignments[char.id] || []
            const over = dragOverCol === char.id
            return (
              <div
                key={char.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = "copy"
                  setDragOverCol(char.id)
                  setBoardDragActive(true)
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverCol((c) => (c === char.id ? null : c))
                  }
                }}
                onDrop={(e) => handleColDrop(char.id, e)}
                className={`flex flex-col w-48 shrink-0 rounded-xl border overflow-hidden transition-all ${
                  over
                    ? "border-emerald-400 bg-emerald-50/70 ring-2 ring-emerald-500 ring-offset-1"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                {/* Column header */}
                <div className="flex flex-col items-center gap-2 px-3 pt-4 pb-3 bg-white border-b-2 border-slate-300">
                  <Avatar src={char.image} name={char.name} size={56} />
                  <span className="text-sm font-bold text-slate-800 text-center text-pretty">{char.name}</span>
                </div>
                {/* Drop hint */}
                <div
                  className={`m-3 mb-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 px-3 py-3 text-sm transition-colors pointer-events-none ${
                    over ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-300 text-slate-400"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="italic">{over ? "Release to cast" : "Drop actor here"}</span>
                </div>
                {/* Assigned actors */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                  {assigned.map((a) => (
                    <div key={a.refId} className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-2 py-1.5 shadow-sm">
                      <Avatar src={a.image} name={a.name} size={32} />
                      <span className="text-sm text-slate-700 truncate flex-1">{a.name}</span>
                      <button
                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        onClick={() => unassignActor(char.id, a.refId)}
                        aria-label={`Remove ${a.name} from ${char.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  /* ============================ Render ============================ */
  return (
    <div
      data-canvas-card="true"
      className={`absolute flex flex-col rounded-2xl bg-white shadow-xl border border-slate-200 select-none ${
        isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""
      }`}
      style={{
        left: item.x,
        top: item.y,
        width,
        height,
        zIndex: isSelected || isDragging || isResizing ? 40 : 10,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      {...(!isScene
        ? {
            onDragOver: (e: React.DragEvent) => {
              if (e.dataTransfer.types.includes("application/json")) {
                e.preventDefault()
                e.dataTransfer.dropEffect = "copy"
              }
            },
            onDrop: handleBoardDrop,
          }
        : {})}
    >
      {header}
      {isScene ? sceneBody : castingBody}
      {isScene && sceneFooter}
      {isSelected && interactive && (
        <span
          className="widget-control absolute -bottom-1.5 -right-1.5 z-20 w-4 h-4 rounded-sm bg-white border-2 border-emerald-500 cursor-se-resize"
          onMouseDown={startResize}
          aria-label="Resize"
        />
      )}
    </div>
  )
}
