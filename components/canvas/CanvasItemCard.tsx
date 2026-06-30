"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { User, Package, Shirt, MapPin, StickyNote, X, Check } from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"

export type CanvasItemType = "actor" | "prop" | "costume" | "location" | "note"

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
}

interface CanvasItemCardProps {
  item: CanvasItem
  isSelected: boolean
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, deltaX: number, deltaY: number) => void
  onRemove: (id: string) => void
  onNoteChange?: (id: string, text: string) => void
}

const CARD_WIDTH = 220

export default function CanvasItemCard({ item, isSelected, onSelect, onDrag, onRemove, onNoteChange }: CanvasItemCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)
  const config = TYPE_CONFIG[item.type]
  const Icon = config.icon
  const hasImage = isValidImageUrl(item.image)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".card-control")) return
    onSelect(item.id, e.ctrlKey || e.metaKey)
    setIsDragging(true)
    movedRef.current = false
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
        movedRef.current = true
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

  if (item.type === "note") {
    return (
      <div
        data-canvas-card="true"
        className={`absolute rounded-lg shadow-md bg-yellow-100 border border-yellow-300 select-none ${isSelected ? `ring-2 ${config.ring} ring-offset-2` : ""}`}
        style={{ left: item.x, top: item.y, width: CARD_WIDTH, cursor: isDragging ? "grabbing" : "grab", zIndex: isSelected || isDragging ? 30 : 2 }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between px-2 py-1 bg-yellow-200/70 rounded-t-lg">
          <div className="flex items-center gap-1 text-yellow-800">
            <StickyNote className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Note</span>
          </div>
          <button
            className="card-control text-yellow-700 hover:text-red-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
            aria-label="Remove note"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          className="card-control w-full h-28 resize-none bg-transparent px-3 py-2 text-sm text-yellow-900 placeholder-yellow-600/50 focus:outline-none leading-relaxed"
          value={item.noteText || ""}
          placeholder="Type a note..."
          onChange={(e) => onNoteChange?.(item.id, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    )
  }

  return (
    <div
      data-canvas-card="true"
      className={`group absolute rounded-xl bg-white shadow-md overflow-hidden select-none border border-slate-200 ${isSelected ? `ring-2 ${config.ring} ring-offset-2` : ""}`}
      style={{ left: item.x, top: item.y, width: CARD_WIDTH, cursor: isDragging ? "grabbing" : "grab", zIndex: isSelected || isDragging ? 30 : 2 }}
      onMouseDown={handleMouseDown}
    >
      <div className={`h-1.5 w-full ${config.bar}`} />

      {/* Selection check */}
      <button
        className={`card-control absolute top-2 left-2 z-10 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
          isSelected ? `${config.bar} border-transparent text-white` : "bg-white/90 border-slate-300 text-transparent opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => { e.stopPropagation(); onSelect(item.id, true) }}
        aria-label="Select card"
      >
        <Check className="w-3 h-3" />
      </button>

      {/* Remove */}
      <button
        className="card-control absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
        aria-label="Remove from canvas"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Media */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
        {hasImage ? (
          <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <Icon className="w-10 h-10" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${config.chip}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
          {item.meta && <span className="text-[10px] text-slate-400 truncate max-w-[90px] text-right">{item.meta}</span>}
        </div>
        <h4 className="text-sm font-semibold text-slate-900 leading-tight truncate">{item.title}</h4>
        {item.subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>}
        {item.tags && item.tags.length > 0 && (
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
