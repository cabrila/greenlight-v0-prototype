"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  X, Clapperboard, MapPin, Plus, Sparkles, Package, Users, GalleryHorizontalEnd, RefreshCw,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { CanvasItem } from "./CanvasItemCard"

export interface WidgetSceneCast {
  name: string
  image?: string
}

export interface WidgetScene {
  id: string
  sceneNumber: string
  intExt: string
  dayNight: string
  location: string
  cast: WidgetSceneCast[]
  props: string[]
  summary: string
}

/** A clip payload handed up to the timeline. */
export interface SceneTimelineClip {
  title: string
  image?: string
  kind: string
}

interface CanvasSceneCardsProps {
  item: CanvasItem
  isSelected: boolean
  interactive: boolean
  zoom: number
  /** Pre-filled scenes resolved from the project. */
  scenes: WidgetScene[]
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onRemove: (id: string) => void
  onDataChange: (id: string, data: Record<string, any>) => void
  onAddToTimeline: (clips: SceneTimelineClip[]) => void
}

const MIN_W = 420
const MIN_H = 300

const INT_EXT_OPTIONS = ["INT", "EXT", "INT/EXT"]
const DAY_NIGHT_OPTIONS = ["Day", "Night", "Dawn", "Dusk"]

function Avatar({ src, name }: { src?: string; name: string }) {
  const valid = src && isValidImageUrl(src)
  return valid ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/placeholder.svg"}
      alt={name}
      crossOrigin="anonymous"
      className="w-5 h-5 rounded-full object-cover bg-slate-100 shrink-0"
    />
  ) : (
    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export default function CanvasSceneCards({
  item, isSelected, interactive, zoom, scenes,
  onSelect, onDrag, onResize, onRemove, onDataChange, onAddToTimeline,
}: CanvasSceneCardsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const data = item.widgetData || {}
  const width = item.width ?? 920
  const height = item.height ?? 600

  // The widget keeps its own editable snapshot of the scenes in widgetData.
  const workingScenes: WidgetScene[] = data.scenes || []

  /* Seed the editable snapshot from the project the first time. */
  useEffect(() => {
    if (!data.scenes && scenes.length > 0) {
      onDataChange(item.id, { ...data, scenes })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, data.scenes])

  const patch = (next: Record<string, any>) => onDataChange(item.id, { ...data, ...next })
  const setScenes = (next: WidgetScene[]) => patch({ scenes: next })

  const updateScene = (id: string, changes: Partial<WidgetScene>) =>
    setScenes(workingScenes.map((s) => (s.id === id ? { ...s, ...changes } : s)))

  const removeScene = (id: string) => setScenes(workingScenes.filter((s) => s.id !== id))

  const reloadFromProject = () => setScenes(scenes)

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

  /* ----------------------- Add to timeline ------------------------- */
  const sceneToClip = (s: WidgetScene): SceneTimelineClip => ({
    title: `Sc ${s.sceneNumber || "?"} — ${s.location || "Scene"}`,
    image: s.cast.find((c) => c.image)?.image,
    kind: "scene",
  })

  const addSceneToTimeline = (s: WidgetScene) => onAddToTimeline([sceneToClip(s)])
  const addAllToTimeline = () => {
    if (workingScenes.length) onAddToTimeline(workingScenes.map(sceneToClip))
  }

  /* ============================ Header ============================ */
  const header = (
    <div className="shrink-0">
      <div className="h-1.5 bg-emerald-500 rounded-t-2xl" />
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 cursor-grab active:cursor-grabbing"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Clapperboard className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-800 leading-tight">Scene Cards</h3>
          <p className="text-xs text-slate-400">{workingScenes.length} scene{workingScenes.length === 1 ? "" : "s"} from your project</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            className="widget-control flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-40"
            onClick={(e) => { e.stopPropagation(); addAllToTimeline() }}
            disabled={workingScenes.length === 0}
          >
            <GalleryHorizontalEnd className="w-3.5 h-3.5" />
            Add all to timeline
          </button>
          <button
            className="widget-control p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); reloadFromProject() }}
            title="Reload scenes from project"
            aria-label="Reload scenes from project"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            className="widget-control p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
            aria-label="Remove Scene Cards"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )

  /* ============================= Body ============================= */
  const body = (
    <div className="flex-1 overflow-auto p-4 widget-control bg-slate-50/40">
      {workingScenes.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-10">
          <Clapperboard className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm text-slate-400 max-w-xs">
            No scenes found in this project yet. Scenes from your script &amp; schedule will appear here as editable cards.
          </p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {workingScenes.map((s) => (
            <SceneCard
              key={s.id}
              scene={s}
              onChange={(changes) => updateScene(s.id, changes)}
              onRemove={() => removeScene(s.id)}
              onAddToTimeline={() => addSceneToTimeline(s)}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div
      className={`absolute rounded-2xl bg-white shadow-xl flex flex-col overflow-hidden transition-shadow ${
        isSelected ? "ring-2 ring-emerald-500" : "ring-1 ring-slate-200"
      }`}
      style={{
        left: item.x,
        top: item.y,
        width,
        height,
        zIndex: isSelected || isDragging || isResizing ? 40 : 10,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {header}
      {body}
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

/* ------------------------------------------------------------------ */
/*  Single editable scene card                                         */
/* ------------------------------------------------------------------ */

function SceneCard({
  scene, onChange, onRemove, onAddToTimeline,
}: {
  scene: WidgetScene
  onChange: (changes: Partial<WidgetScene>) => void
  onRemove: () => void
  onAddToTimeline: () => void
}) {
  const [castInput, setCastInput] = useState("")
  const [propInput, setPropInput] = useState("")

  const addCast = () => {
    const name = castInput.trim()
    if (!name) return
    onChange({ cast: [...scene.cast, { name }] })
    setCastInput("")
  }
  const removeCast = (idx: number) => onChange({ cast: scene.cast.filter((_, i) => i !== idx) })

  const addProp = () => {
    const p = propInput.trim()
    if (!p) return
    onChange({ props: [...scene.props, p] })
    setPropInput("")
  }
  const removeProp = (idx: number) => onChange({ props: scene.props.filter((_, i) => i !== idx) })

  const submitOnEnter = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault()
      fn()
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-slate-200">
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5 shrink-0">SC</span>
        <input
          value={scene.sceneNumber}
          onChange={(e) => onChange({ sceneNumber: e.target.value })}
          className="w-12 bg-transparent text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-400 rounded px-1"
          aria-label="Scene number"
        />
        <select
          value={scene.intExt}
          onChange={(e) => onChange({ intExt: e.target.value })}
          className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          aria-label="Interior or exterior"
        >
          {INT_EXT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          value={scene.dayNight}
          onChange={(e) => onChange({ dayNight: e.target.value })}
          className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          aria-label="Time of day"
        >
          {DAY_NIGHT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <button
          className="ml-auto text-slate-300 hover:text-red-500 transition-colors shrink-0"
          onClick={onRemove}
          aria-label={`Remove scene ${scene.sceneNumber}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {/* Location */}
        <label className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={scene.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Location"
            className="flex-1 min-w-0 text-sm text-slate-700 bg-transparent focus:outline-none focus:bg-slate-50 focus:ring-1 focus:ring-emerald-400 rounded px-1 py-0.5"
          />
        </label>

        {/* Cast */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Cast</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scene.cast.map((c, idx) => (
              <span key={`${c.name}-${idx}`} className="flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                <Avatar src={c.image} name={c.name} />
                <span className="text-xs font-medium text-slate-700">{c.name}</span>
                <button className="text-slate-400 hover:text-red-500 transition-colors" onClick={() => removeCast(idx)} aria-label={`Remove ${c.name}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <span className="flex items-center gap-1 rounded-full bg-white border border-dashed border-slate-300 pl-2 pr-1 py-0.5">
              <input
                value={castInput}
                onChange={(e) => setCastInput(e.target.value)}
                onKeyDown={(e) => submitOnEnter(e, addCast)}
                placeholder="Add cast"
                className="w-16 text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
              />
              <button className="text-emerald-600 hover:text-emerald-700" onClick={addCast} aria-label="Add cast member">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        </div>

        {/* Props */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Props</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scene.props.map((p, idx) => (
              <span key={`${p}-${idx}`} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-800">{p}</span>
                <button className="text-amber-400 hover:text-red-500 transition-colors" onClick={() => removeProp(idx)} aria-label={`Remove ${p}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <span className="flex items-center gap-1 rounded-md bg-white border border-dashed border-slate-300 pl-2 pr-1 py-0.5">
              <input
                value={propInput}
                onChange={(e) => setPropInput(e.target.value)}
                onKeyDown={(e) => submitOnEnter(e, addProp)}
                placeholder="Add prop"
                className="w-16 text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
              />
              <button className="text-emerald-600 hover:text-emerald-700" onClick={addProp} aria-label="Add prop">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        </div>

        {/* AI summary */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">AI Summary</span>
          </div>
          <textarea
            value={scene.summary}
            onChange={(e) => onChange({ summary: e.target.value })}
            rows={2}
            placeholder="Describe what happens in this scene…"
            className="w-full text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>

        {/* Add to timeline */}
        <button
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          onClick={onAddToTimeline}
        >
          <GalleryHorizontalEnd className="w-4 h-4" />
          Add to timeline
        </button>
      </div>
    </div>
  )
}
