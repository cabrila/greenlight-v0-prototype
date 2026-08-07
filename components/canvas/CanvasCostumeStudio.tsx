"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  X, Shirt, Sparkles, Loader2, Check, Plus, Wand2, User, ImageOff, Palette, Scissors,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { CanvasItem } from "./CanvasItemCard"

export interface CostumeAsset {
  id: string
  name: string
  image?: string
}

interface CanvasCostumeStudioProps {
  item: CanvasItem
  isSelected: boolean
  interactive: boolean
  zoom: number
  /** Wardrobe inventory used as inspiration references. */
  inspiration: CostumeAsset[]
  /** Cast the finished dress can be merged onto. */
  actors: CostumeAsset[]
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onRemove: (id: string) => void
  onDataChange: (id: string, data: Record<string, any>) => void
}

const MIN_W = 400
const MIN_H = 360

const FABRICS = [
  "Silk", "Satin", "Velvet", "Chiffon", "Linen", "Lace",
  "Tweed", "Leather", "Denim", "Wool", "Organza", "Sequin",
]

const SILHOUETTES = [
  "A-line", "Ball gown", "Sheath", "Mermaid", "Wrap", "Slip", "Empire", "Jumpsuit",
]

const COLOR_SWATCHES = [
  { name: "Ivory", hex: "#f5f0e6" },
  { name: "Blush", hex: "#e8c4c0" },
  { name: "Crimson", hex: "#a11e2e" },
  { name: "Burgundy", hex: "#5c1a2b" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Forest", hex: "#1f4d3a" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Navy", hex: "#1e2a4a" },
  { name: "Cobalt", hex: "#2f52c9" },
  { name: "Gold", hex: "#c8a24b" },
  { name: "Charcoal", hex: "#2f3439" },
  { name: "Onyx", hex: "#14171a" },
]

function Chip({
  label, active, onClick, swatch,
}: { label: string; active: boolean; onClick: () => void; swatch?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
      }`}
    >
      {swatch && <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 shrink-0" style={{ backgroundColor: swatch }} />}
      {label}
      {active && <Check className="w-3 h-3" strokeWidth={3} />}
    </button>
  )
}

export default function CanvasCostumeStudio({
  item, isSelected, interactive, zoom, inspiration, actors,
  onSelect, onDrag, onResize, onRemove, onDataChange,
}: CanvasCostumeStudioProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [phase, setPhase] = useState<null | "dress" | "merge">(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const data = item.widgetData || {}
  const width = item.width ?? 460
  const height = item.height ?? 660

  const fabrics: string[] = data.fabrics || []
  const colors: string[] = data.colors || [] // hex strings
  const silhouette: string = data.silhouette || ""
  const inspirationIds: string[] = data.inspirationIds || []
  const notes: string = data.notes || ""
  const actorId: string = data.actorId || ""
  const customColor: string = data.customColor || "#8b3a52"

  const dress = data.dress as
    | { colors: string[]; fabrics: string[]; silhouette: string; inspirationImages: string[]; notes: string; createdAt: number }
    | undefined
  const merged = data.merged as
    | { actorName: string; actorImage?: string; createdAt: number }
    | undefined

  const patch = (next: Record<string, any>) => onDataChange(item.id, { ...data, ...next })

  const toggleArr = (key: string, arr: string[], v: string) => {
    const set = new Set(arr)
    set.has(v) ? set.delete(v) : set.add(v)
    patch({ [key]: Array.from(set) })
  }

  const chosenActor = actors.find((a) => a.id === actorId)
  const selectedInspiration = inspiration.filter((c) => inspirationIds.includes(c.id))
  const canGenerateDress = (fabrics.length > 0 || colors.length > 0 || !!silhouette) && phase === null
  const canMerge = !!dress && !!chosenActor && phase === null

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

  useEffect(() => () => { if (genTimer.current) clearTimeout(genTimer.current) }, [])

  /* -------------------------- Generate ----------------------------- */
  const generateDress = () => {
    if (!canGenerateDress) return
    setPhase("dress")
    const inspirationImages = selectedInspiration.map((c) => c.image).filter((u): u is string => isValidImageUrl(u))
    genTimer.current = setTimeout(() => {
      patch({
        dress: {
          colors,
          fabrics,
          silhouette,
          inspirationImages,
          notes,
          createdAt: Date.now(),
        },
        merged: undefined,
      })
      setPhase(null)
    }, 1500)
  }

  const mergeWithActor = () => {
    if (!canMerge || !chosenActor) return
    setPhase("merge")
    genTimer.current = setTimeout(() => {
      patch({
        merged: { actorName: chosenActor.name, actorImage: chosenActor.image, createdAt: Date.now() },
      })
      setPhase(null)
    }, 1500)
  }

  const dressGradient = (cols: string[]) => {
    if (!cols.length) return "linear-gradient(135deg, #475569, #1e293b)"
    if (cols.length === 1) return `linear-gradient(135deg, ${cols[0]}, ${cols[0]})`
    return `linear-gradient(135deg, ${cols.slice(0, 3).join(", ")})`
  }

  /* ============================ Header ============================ */
  const header = (
    <div className="shrink-0">
      <div className="h-1.5 bg-rose-500 rounded-t-2xl" />
      <div
        className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 cursor-grab active:cursor-grabbing"
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <Shirt className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-800 leading-tight">Costume Studio</h3>
          <p className="text-xs text-slate-400">Combine fabric, color &amp; inspiration into a look</p>
        </div>
        <button
          className="widget-control ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          aria-label="Remove Costume Studio"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  /* ============================= Body ============================= */
  const body = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 widget-control">
      {/* Result: merged actor look, or dress concept */}
      {(dress || merged) && (
        <div className="rounded-xl border border-rose-200 overflow-hidden">
          <div className="relative aspect-[4/3] bg-slate-900">
            {merged ? (
              merged.actorImage && isValidImageUrl(merged.actorImage) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={merged.actorImage || "/placeholder.svg"} alt={merged.actorName} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500"><ImageOff className="w-8 h-8" /></div>
              )
            ) : (
              <div className="absolute inset-0" style={{ background: dressGradient(dress?.colors || []) }} />
            )}

            {/* Fabric / swatch strip */}
            {dress && (
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {dress.colors.slice(0, 4).map((c, i) => (
                  <span key={`${c}-${i}`} className="w-6 h-6 rounded-md ring-2 ring-white/70 shadow" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}

            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-rose-300" />
              <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                {merged ? "Actor + Costume" : "Dress Concept"}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2.5">
              <h4 className="text-white font-bold text-sm truncate">
                {merged ? `${merged.actorName} — ${dress?.silhouette || "custom"} look` : `${dress?.silhouette || "Custom"} dress`}
              </h4>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {(dress?.fabrics || []).slice(0, 4).map((f) => (
                  <span key={f} className="text-[10px] font-medium text-white/90 bg-white/15 rounded px-1.5 py-0.5">{f}</span>
                ))}
                {dress && dress.inspirationImages.length > 0 && (
                  <span className="text-[10px] font-medium text-white/70">+{dress.inspirationImages.length} ref</span>
                )}
              </div>
            </div>
          </div>
          {dress?.notes && (
            <p className="text-xs text-slate-500 leading-relaxed px-3 py-2 bg-rose-50/50 border-t border-rose-100 line-clamp-2">{dress.notes}</p>
          )}
        </div>
      )}

      {/* Fabrics */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1.5">
          <Scissors className="w-4 h-4 text-slate-400" /> Fabrics
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FABRICS.map((f) => (
            <Chip key={f} label={f} active={fabrics.includes(f)} onClick={() => toggleArr("fabrics", fabrics, f)} />
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1.5">
          <Palette className="w-4 h-4 text-slate-400" /> Colors
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {COLOR_SWATCHES.map((c) => {
            const active = colors.includes(c.hex)
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => toggleArr("colors", colors, c.hex)}
                title={c.name}
                aria-label={c.name}
                className={`relative w-7 h-7 rounded-full ring-2 transition-transform hover:scale-110 ${active ? "ring-emerald-500" : "ring-black/10"}`}
                style={{ backgroundColor: c.hex }}
              >
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white drop-shadow" strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
          {/* Custom color */}
          <label className="flex items-center gap-1 cursor-pointer" title="Custom color">
            <input
              type="color"
              value={customColor}
              onChange={(e) => patch({ customColor: e.target.value })}
              className="w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer p-0"
            />
            <button
              type="button"
              onClick={() => toggleArr("colors", colors, customColor)}
              className="flex items-center gap-0.5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </label>
        </div>
      </div>

      {/* Silhouette */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">Silhouette</label>
        <div className="flex flex-wrap gap-1.5">
          {SILHOUETTES.map((s) => (
            <Chip key={s} label={s} active={silhouette === s} onClick={() => patch({ silhouette: silhouette === s ? "" : s })} />
          ))}
        </div>
      </div>

      {/* Inspiration */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          Inspiration <span className="text-slate-400 font-normal">from wardrobe</span>
        </label>
        {inspiration.length === 0 ? (
          <p className="text-sm text-slate-400">No wardrobe references available for this project.</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {inspiration.map((c) => {
              const active = inspirationIds.includes(c.id)
              const img = isValidImageUrl(c.image) ? c.image : undefined
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleArr("inspirationIds", inspirationIds, c.id)}
                  title={c.name}
                  className={`relative aspect-square rounded-lg overflow-hidden ring-2 transition-all ${active ? "ring-emerald-500" : "ring-slate-200 hover:ring-slate-300"}`}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img || "/placeholder.svg"} alt={c.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">{c.name.charAt(0)}</span>
                  )}
                  {active && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Describe the mood, era, or detailing…"
          className="w-full h-16 resize-none rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed"
        />
      </div>

      {/* Merge target */}
      {dress && (
        <div>
          <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 mb-1.5">
            <User className="w-4 h-4 text-slate-400" /> Merge onto actor
          </label>
          {actors.length === 0 ? (
            <p className="text-sm text-slate-400">No cast available for this project.</p>
          ) : (
            <div className="relative">
              <select
                value={actorId}
                onChange={(e) => patch({ actorId: e.target.value, merged: undefined })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select an actor…</option>
                {actors.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )

  /* ============================ Footer ============================ */
  const footer = (
    <div className="shrink-0 border-t border-slate-100 p-4 space-y-2">
      <button
        type="button"
        onClick={generateDress}
        disabled={!canGenerateDress}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {phase === "dress" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Designing dress…</>
        ) : (
          <><Wand2 className="w-4 h-4" /> {dress ? "Regenerate dress" : "Generate dress"}</>
        )}
      </button>
      {dress && (
        <button
          type="button"
          onClick={mergeWithActor}
          disabled={!canMerge}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {phase === "merge" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Merging with actor…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> {merged ? "Re-merge with actor" : "Merge dress with actor"}</>
          )}
        </button>
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
    >
      {header}
      {body}
      {footer}
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
