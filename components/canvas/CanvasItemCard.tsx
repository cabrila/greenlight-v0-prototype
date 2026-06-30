"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  User, Package, Shirt, MapPin, StickyNote, X, Check, Trash2,
  Type, Square, Squircle, Circle, Frame, Image as ImageIcon,
  Clapperboard, Film,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"

export type CanvasItemType =
  | "actor" | "prop" | "costume" | "location" | "note"
  | "text" | "rectangle" | "rounded" | "ellipse" | "frame" | "image"
  | "scene-generator" | "casting-board"

export type ViewSize = "full" | "medium" | "small"

export interface CanvasItem {
  id: string
  type: CanvasItemType
  refId: string
  x: number
  y: number
  title: string
  subtitle?: string
  image?: string
  meta?: string
  tags?: string[]
  noteText?: string
  /* element-only fields */
  width?: number
  height?: number
  text?: string
  groupId?: string
  /* widget-only state (scene generator / casting board) */
  widgetData?: Record<string, any>
}

interface TypeConfig {
  label: string
  icon: typeof User
  chip: string
  bar: string
  ring: string
}

export const TYPE_CONFIG: Record<CanvasItemType, TypeConfig> = {
  actor: { label: "Cast", icon: User, chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", ring: "ring-emerald-500" },
  prop: { label: "Prop", icon: Package, chip: "bg-amber-100 text-amber-700", bar: "bg-amber-500", ring: "ring-amber-500" },
  costume: { label: "Costume / HMU", icon: Shirt, chip: "bg-rose-100 text-rose-700", bar: "bg-rose-500", ring: "ring-rose-500" },
  location: { label: "Location", icon: MapPin, chip: "bg-sky-100 text-sky-700", bar: "bg-sky-500", ring: "ring-sky-500" },
  note: { label: "Note", icon: StickyNote, chip: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-400", ring: "ring-yellow-400" },
  text: { label: "Text", icon: Type, chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500", ring: "ring-slate-500" },
  rectangle: { label: "Rectangle", icon: Square, chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500", ring: "ring-slate-500" },
  rounded: { label: "Rounded", icon: Squircle, chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500", ring: "ring-slate-500" },
  ellipse: { label: "Ellipse", icon: Circle, chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500", ring: "ring-slate-500" },
  frame: { label: "Frame", icon: Frame, chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500", ring: "ring-slate-500" },
  image: { label: "Image", icon: ImageIcon, chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500", ring: "ring-slate-500" },
  "scene-generator": { label: "Scene Generator", icon: Film, chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", ring: "ring-emerald-500" },
  "casting-board": { label: "Character Casting", icon: Clapperboard, chip: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500", ring: "ring-emerald-500" },
}

/* card dimensions per view size (width, approx height for fit calc) */
export const CARD_DIMENSIONS: Record<ViewSize, { width: number; height: number }> = {
  full: { width: 220, height: 268 },
  medium: { width: 168, height: 196 },
  small: { width: 132, height: 60 },
}

interface CanvasItemCardProps {
  item: CanvasItem
  isSelected: boolean
  viewSize: ViewSize
  interactive: boolean
  autoOpenNote?: boolean
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, deltaX: number, deltaY: number) => void
  onRemove: (id: string) => void
  onNoteChange?: (id: string, text: string) => void
}

export default function CanvasItemCard({
  item, isSelected, viewSize, interactive, autoOpenNote, onSelect, onDrag, onRemove, onNoteChange,
}: CanvasItemCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
  const dragStartRef = useRef({ x: 0, y: 0 })
  const hasMovedRef = useRef(false)
  const config = TYPE_CONFIG[item.type]
  const Icon = config.icon
  const hasImage = isValidImageUrl(item.image)
  const width = CARD_DIMENSIONS[viewSize].width

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return
    if ((e.target as HTMLElement).closest(".card-control")) return
    onSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey)
    setIsDragging(true)
    hasMovedRef.current = false
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        hasMovedRef.current = true
        onDrag(item.id, dx, dy)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    const handleUp = () => setIsDragging(false)
    document.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseup", handleUp)
    document.body.style.userSelect = "none"
    return () => {
      document.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseup", handleUp)
      document.body.style.userSelect = ""
    }
  }, [isDragging, item.id, onDrag])

  /* Auto-open the comment bubble for a freshly created pin */
  useEffect(() => {
    if (autoOpenNote && item.type === "note") {
      setNoteDraft(item.noteText || "")
      setNoteOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenNote])

  /* -------------------------- Comment pin -------------------------- */
  if (item.type === "note") {
    const openBubble = () => {
      setNoteDraft(item.noteText || "")
      setNoteOpen(true)
    }
    const handlePinClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (hasMovedRef.current) return // was a drag, not a click
      if (noteOpen) setNoteOpen(false)
      else openBubble()
    }
    const handleSave = () => {
      onNoteChange?.(item.id, noteDraft.trim())
      setNoteOpen(false)
    }
    const handleCancel = () => {
      setNoteOpen(false)
      if (!(item.noteText || "").trim()) onRemove(item.id) // discard empty/never-saved pin
    }
    const hasContent = !!(item.noteText || "").trim()

    return (
      <div
        data-canvas-card="true"
        className="absolute select-none"
        style={{ left: item.x, top: item.y, zIndex: noteOpen ? 60 : isSelected || isDragging ? 50 : 20 }}
      >
        {/* Comment bubble popover */}
        {noteOpen && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 pt-3">
                <span className="w-7 h-7 rounded-full bg-sky-400 text-white text-xs font-semibold flex items-center justify-center shrink-0">Y</span>
                <span className="text-sm font-semibold text-slate-800">You</span>
                <span className="ml-auto text-xs text-slate-400">just now</span>
                <button
                  className="card-control text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleCancel() }}
                  aria-label="Close comment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Editor */}
              <div className="px-4 py-3">
                <textarea
                  autoFocus
                  className="w-full h-24 resize-none rounded-xl border-2 border-emerald-400/70 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  value={noteDraft}
                  placeholder="Add a comment..."
                  onChange={(e) => setNoteDraft(e.target.value)}
                />
              </div>
              {/* Footer */}
              <div className="flex items-center gap-3 px-4 pb-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSave() }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancel() }}
                  className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Cancel
                </button>
                {hasContent && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
                    className="ml-auto text-slate-300 hover:text-red-500 transition-colors"
                    aria-label="Delete comment"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* Pointer tail */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1.5 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
          </div>
        )}

        {/* Avatar pin */}
        <button
          className={`card-control w-9 h-9 rounded-full bg-sky-400 text-white text-sm font-semibold flex items-center justify-center shadow-md border-2 border-white transition-all ${
            noteOpen ? "ring-4 ring-sky-200" : "hover:scale-105"
          }`}
          style={{ cursor: !interactive ? "pointer" : isDragging ? "grabbing" : "grab" }}
          onMouseDown={handleMouseDown}
          onClick={handlePinClick}
          aria-label={hasContent ? `Comment: ${item.noteText}` : "Add a comment"}
          title={hasContent ? item.noteText : "Add a comment"}
        >
          Y
          {hasContent && !noteOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
          )}
        </button>
      </div>
    )
  }

  const selectControls = (
    <>
      <button
        className={`card-control absolute top-2 left-2 z-10 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
          isSelected ? `${config.bar} border-transparent text-white` : "bg-white/90 border-slate-300 text-transparent opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => { e.stopPropagation(); onSelect(item.id, true) }}
        aria-label="Select card"
      >
        <Check className="w-3 h-3" />
      </button>
      <button
        className="card-control absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
        aria-label="Remove from canvas"
      >
        <X className="w-3 h-3" />
      </button>
    </>
  )

  /* --------------------------- Small view -------------------------- */
  if (viewSize === "small") {
    return (
      <div
        data-canvas-card="true"
        className={`group absolute flex items-center gap-2 rounded-lg bg-white shadow-md overflow-hidden select-none border border-slate-200 ${isSelected ? `ring-2 ${config.ring} ring-offset-1` : ""}`}
        style={{ left: item.x, top: item.y, width, cursor: !interactive ? "inherit" : isDragging ? "grabbing" : "grab", zIndex: isSelected || isDragging ? 30 : 2 }}
        onMouseDown={handleMouseDown}
      >
        <div className={`w-1 self-stretch ${config.bar}`} />
        <div className="relative w-9 h-9 my-1.5 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          {hasImage ? (
            <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <Icon className="w-4 h-4 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{item.title}</p>
          {item.subtitle && <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>}
        </div>
        <button
          className="card-control mr-1.5 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          aria-label="Remove from canvas"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  /* ----------------------- Full / Medium view ---------------------- */
  const compact = viewSize === "medium"
  return (
    <div
      data-canvas-card="true"
      className={`group absolute rounded-xl bg-white shadow-md overflow-hidden select-none border border-slate-200 ${isSelected ? `ring-2 ${config.ring} ring-offset-2` : ""}`}
      style={{ left: item.x, top: item.y, width, cursor: !interactive ? "inherit" : isDragging ? "grabbing" : "grab", zIndex: isSelected || isDragging ? 30 : 2 }}
      onMouseDown={handleMouseDown}
    >
      <div className={`h-1.5 w-full ${config.bar}`} />
      {selectControls}

      <div className="relative w-full aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <Icon className={compact ? "w-8 h-8 text-slate-300" : "w-10 h-10 text-slate-300"} strokeWidth={1.5} />
        )}
      </div>

      <div className={compact ? "p-2" : "p-3"}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${config.chip}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          {item.meta && <span className="text-[10px] text-slate-400 truncate max-w-[80px] text-right">{item.meta}</span>}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 leading-tight truncate">{item.title}</h4>
        {item.subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>}
        {!compact && item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
