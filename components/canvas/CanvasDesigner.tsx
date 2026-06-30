"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  X, ChevronDown, ChevronRight, Sparkles, Loader2, UserCog, Mountain, Plus, Check, ImageOff,
} from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { CanvasItem } from "./CanvasItemCard"

export type DesignerMode = "character" | "location"

export interface DesignerSubject {
  id: string
  name: string
  image?: string
  description?: string
}

export interface DesignerAsset {
  id: string
  name: string
  image?: string
}

interface CanvasDesignerProps {
  item: CanvasItem
  isSelected: boolean
  interactive: boolean
  zoom: number
  mode: DesignerMode
  /** Characters (character mode) or script locations (location mode). */
  subjects: DesignerSubject[]
  /** Character-mode pools */
  actors: DesignerAsset[]
  costumes: DesignerAsset[]
  makeup: DesignerAsset[]
  /** Shared pool */
  props: DesignerAsset[]
  /** Location-mode pool: locations from the database */
  locationAssets: DesignerAsset[]
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, dx: number, dy: number) => void
  onResize: (id: string, width: number, height: number) => void
  onRemove: (id: string) => void
  onDataChange: (id: string, data: Record<string, any>) => void
}

const MIN_W = 380
const MIN_H = 320

function Thumb({ src, name, size = 52 }: { src?: string; name: string; size?: number }) {
  const valid = src && isValidImageUrl(src)
  return valid ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/placeholder.svg"}
      alt={name}
      crossOrigin="anonymous"
      className="rounded-lg object-cover bg-slate-100"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-lg bg-slate-200 text-slate-500 font-semibold flex items-center justify-center"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Section({
  title, count, defaultOpen = true, children,
}: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {title}
          {typeof count === "number" && count > 0 && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5">{count}</span>
          )}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  )
}

/** A grid of selectable asset chips (single- or multi-select). */
function AssetGrid({
  assets, selectedIds, onToggle, emptyHint, single = false,
}: {
  assets: DesignerAsset[]
  selectedIds: string[]
  onToggle: (id: string) => void
  emptyHint: string
  single?: boolean
}) {
  if (assets.length === 0) return <p className="text-sm text-slate-400">{emptyHint}</p>
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5">
      {assets.map((a) => {
        const active = selectedIds.includes(a.id)
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onToggle(a.id)}
            className="flex flex-col items-center gap-1 group"
            title={a.name}
          >
            <span className={`relative rounded-lg p-0.5 transition-all ${active ? "ring-2 ring-emerald-500" : "ring-1 ring-slate-200 group-hover:ring-slate-300"}`}>
              <Thumb src={a.image} name={a.name} size={50} />
              {active && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                </span>
              )}
            </span>
            <span className={`text-xs truncate max-w-[64px] ${active ? "text-emerald-700 font-medium" : "text-slate-600"}`}>{a.name}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Free-form tag input for items with no database inventory (makeup notes, set elements). */
function TagInput({
  tags, onChange, placeholder,
}: { tags: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [value, setValue] = useState("")
  const add = () => {
    const t = value.trim()
    if (!t) return
    onChange([...tags, t])
    setValue("")
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, idx) => (
        <span key={`${t}-${idx}`} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
          <span className="text-xs text-emerald-800">{t}</span>
          <button className="text-emerald-400 hover:text-red-500 transition-colors" onClick={() => onChange(tags.filter((_, i) => i !== idx))} aria-label={`Remove ${t}`}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <span className="flex items-center gap-1 rounded-md bg-white border border-dashed border-slate-300 pl-2 pr-1 py-0.5">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="w-24 text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
        />
        <button className="text-emerald-600 hover:text-emerald-700" onClick={add} aria-label="Add">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </span>
    </div>
  )
}

/** Inline single-line input to add a custom named asset to a section. */
function AddAssetInline({ onAdd, placeholder }: { onAdd: (name: string) => void; placeholder: string }) {
  const [value, setValue] = useState("")
  const add = () => {
    const t = value.trim()
    if (!t) return
    onAdd(t)
    setValue("")
  }
  return (
    <div className="flex items-center gap-1.5 mt-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
            e.preventDefault()
            add()
          }
        }}
        placeholder={placeholder}
        className="flex-1 text-xs rounded-lg bg-white border border-dashed border-slate-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  )
}

export default function CanvasDesigner({
  item, isSelected, interactive, zoom, mode,
  subjects, actors, costumes, makeup, props, locationAssets,
  onSelect, onDrag, onResize, onRemove, onDataChange,
}: CanvasDesignerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const data = item.widgetData || {}
  const width = item.width ?? 460
  const height = item.height ?? 640
  const isChar = mode === "character"

  const subjectId: string = data.subjectId || ""
  const actorId: string = data.actorId || ""
  const costumeIds: string[] = data.costumeIds || []
  const makeupIds: string[] = data.makeupIds || []
  const propIds: string[] = data.propIds || []
  const locationIds: string[] = data.locationIds || []
  const makeupTags: string[] = data.makeupTags || []
  const elementTags: string[] = data.elementTags || []
  const prompt: string = data.prompt || ""
  const promptEdited: boolean = !!data.promptEdited
  const result = data.result as
    | { title: string; prompt: string; baseImage?: string; assets: { name: string; image?: string }[]; createdAt: number }
    | undefined

  // Custom (user-added) entries persisted alongside project data, so the tool
  // stays fully usable even when the project has no cast/inventory yet.
  const customSubjects: DesignerSubject[] = data.customSubjects || []
  const customActors: DesignerAsset[] = data.customActors || []
  const customCostumes: DesignerAsset[] = data.customCostumes || []
  const customMakeup: DesignerAsset[] = data.customMakeup || []
  const customProps: DesignerAsset[] = data.customProps || []
  const customLocations: DesignerAsset[] = data.customLocations || []

  const patch = (next: Record<string, any>) => onDataChange(item.id, { ...data, ...next })

  // Merge project pools with custom additions.
  const allSubjects = [...subjects, ...customSubjects]
  const allActors = [...actors, ...customActors]
  const allCostumes = [...costumes, ...customCostumes]
  const allMakeup = [...makeup, ...customMakeup]
  const allProps = [...props, ...customProps]
  const allLocations = [...locationAssets, ...customLocations]
  const subject = allSubjects.find((s) => s.id === subjectId)

  const newId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`

  // Add a custom asset to a pool and immediately select it.
  const addCustomAsset = (poolKey: string, selKey: string, name: string, single: boolean) => {
    const id = newId()
    const pool = (data[poolKey] || []) as DesignerAsset[]
    if (single) {
      patch({ [poolKey]: [...pool, { id, name }], [selKey]: id })
    } else {
      const sel = (data[selKey] || []) as string[]
      patch({ [poolKey]: [...pool, { id, name }], [selKey]: [...sel, id] })
    }
  }

  const addCustomSubject = (name: string) => {
    const id = newId()
    patch({ customSubjects: [...customSubjects, { id, name, description: "" }], subjectId: id, promptEdited: false })
  }

  /* Pre-fill the prompt from the subject's script description (until the user edits it). */
  useEffect(() => {
    if (!subject || promptEdited) return
    const desc = subject.description?.trim()
    const seed = desc
      ? desc
      : isChar
        ? `${subject.name} — describe wardrobe, makeup, and overall look.`
        : `${subject.name} — describe the set dressing, mood, and atmosphere.`
    if (seed !== prompt) patch({ prompt: seed })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, promptEdited])

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

  /* --------------------------- Toggles ----------------------------- */
  const toggleIn = (key: string, ids: string[], id: string) => {
    const set = new Set(ids)
    set.has(id) ? set.delete(id) : set.add(id)
    patch({ [key]: Array.from(set) })
  }

  /* -------------------------- Generate ----------------------------- */
  const chosenActor = allActors.find((a) => a.id === actorId)
  const selectedAssets: DesignerAsset[] = isChar
    ? [
        ...allCostumes.filter((c) => costumeIds.includes(c.id)),
        ...allMakeup.filter((m) => makeupIds.includes(m.id)),
        ...allProps.filter((p) => propIds.includes(p.id)),
        ...makeupTags.map((t) => ({ id: `tag-${t}`, name: t })),
      ]
    : [
        ...allLocations.filter((l) => locationIds.includes(l.id)),
        ...allProps.filter((p) => propIds.includes(p.id)),
        ...elementTags.map((t) => ({ id: `tag-${t}`, name: t })),
      ]

  const canGenerate = !!subject && !generating

  const handleGenerate = () => {
    if (!subject) return
    setGenerating(true)
    const baseImage = isChar
      ? chosenActor?.image || subject.image
      : selectedAssets.find((a) => a.image)?.image || subject.image
    const assets = selectedAssets.map((a) => ({ name: a.name, image: a.image }))
    if (isChar && chosenActor) assets.unshift({ name: chosenActor.name, image: chosenActor.image })
    // Simulate an image-composition pass (prototype – no generation backend).
    genTimer.current = setTimeout(() => {
      patch({
        result: {
          title: subject.name,
          prompt,
          baseImage,
          assets,
          createdAt: Date.now(),
        },
      })
      setGenerating(false)
    }, 1500)
  }

  const Icon = isChar ? UserCog : Mountain
  const title = isChar ? "Character Designer" : "Location Designer"
  const subjectLabel = isChar ? "Character" : "Location"

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
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
          <p className="text-xs text-slate-400">Compose a {isChar ? "character" : "location"} concept from your assets</p>
        </div>
        <button
          className="widget-control ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
          aria-label={`Remove ${title}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  /* ============================= Body ============================= */
  const body = (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 widget-control">
      {/* Generated composite preview */}
      {result && (
        <div className="rounded-xl border border-emerald-200 overflow-hidden">
          <div className="relative aspect-video bg-slate-900">
            {result.baseImage && isValidImageUrl(result.baseImage) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.baseImage || "/placeholder.svg"}
                alt={result.title}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500">
                <ImageOff className="w-8 h-8" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span className="text-[10px] font-semibold text-white uppercase tracking-wide">AI Composite</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2.5">
              <h4 className="text-white font-bold text-sm truncate">{result.title}</h4>
              {result.assets.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {result.assets.slice(0, 6).map((a, i) => (
                    <span key={`${a.name}-${i}`} className="w-7 h-7 rounded-md overflow-hidden ring-1 ring-white/40 bg-slate-700 shrink-0" title={a.name}>
                      {a.image && isValidImageUrl(a.image) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.image || "/placeholder.svg"} alt={a.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/80">{a.name.charAt(0)}</span>
                      )}
                    </span>
                  ))}
                  {result.assets.length > 6 && (
                    <span className="text-[10px] font-medium text-white/80">+{result.assets.length - 6}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {result.prompt && (
            <p className="text-xs text-slate-500 leading-relaxed px-3 py-2 bg-emerald-50/50 border-t border-emerald-100 line-clamp-3">
              {result.prompt}
            </p>
          )}
        </div>
      )}

      {/* Subject selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">{subjectLabel}</label>
        <div className="relative">
          <select
            value={subjectId}
            onChange={(e) => patch({ subjectId: e.target.value, promptEdited: false })}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select a {subjectLabel.toLowerCase()}…</option>
            {subjects.length > 0 && (
              <optgroup label="From script">
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            )}
            {customSubjects.length > 0 && (
              <optgroup label="Custom">
                {customSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <AddAssetInline onAdd={addCustomSubject} placeholder={`Add a custom ${subjectLabel.toLowerCase()}…`} />
      </div>

      {isChar ? (
        <>
          <Section title="Actor" count={actorId ? 1 : 0}>
            <AssetGrid
              assets={allActors}
              selectedIds={actorId ? [actorId] : []}
              onToggle={(id) => patch({ actorId: actorId === id ? "" : id })}
              emptyHint="No cast yet — add one below to cast this role."
              single
            />
            <AddAssetInline onAdd={(name) => addCustomAsset("customActors", "actorId", name, true)} placeholder="Add an actor by name…" />
          </Section>
          <Section title="Costumes" count={costumeIds.length} defaultOpen={false}>
            <AssetGrid assets={allCostumes} selectedIds={costumeIds} onToggle={(id) => toggleIn("costumeIds", costumeIds, id)} emptyHint="No costumes yet — add one below." />
            <AddAssetInline onAdd={(name) => addCustomAsset("customCostumes", "costumeIds", name, false)} placeholder="Add a costume…" />
          </Section>
          <Section title="Makeup & HMU" count={makeupIds.length + makeupTags.length} defaultOpen={false}>
            <AssetGrid assets={allMakeup} selectedIds={makeupIds} onToggle={(id) => toggleIn("makeupIds", makeupIds, id)} emptyHint="No HMU items yet — add notes or items below." />
            <AddAssetInline onAdd={(name) => addCustomAsset("customMakeup", "makeupIds", name, false)} placeholder="Add a makeup / HMU item…" />
            <div className="mt-3">
              <TagInput tags={makeupTags} onChange={(next) => patch({ makeupTags: next })} placeholder="Quick note" />
            </div>
          </Section>
          <Section title="Props" count={propIds.length} defaultOpen={false}>
            <AssetGrid assets={allProps} selectedIds={propIds} onToggle={(id) => toggleIn("propIds", propIds, id)} emptyHint="No props yet — add one below." />
            <AddAssetInline onAdd={(name) => addCustomAsset("customProps", "propIds", name, false)} placeholder="Add a prop…" />
          </Section>
        </>
      ) : (
        <>
          <Section title="Reference Locations" count={locationIds.length}>
            <AssetGrid assets={allLocations} selectedIds={locationIds} onToggle={(id) => toggleIn("locationIds", locationIds, id)} emptyHint="No locations yet — add one below." />
            <AddAssetInline onAdd={(name) => addCustomAsset("customLocations", "locationIds", name, false)} placeholder="Add a reference location…" />
          </Section>
          <Section title="Props" count={propIds.length} defaultOpen={false}>
            <AssetGrid assets={allProps} selectedIds={propIds} onToggle={(id) => toggleIn("propIds", propIds, id)} emptyHint="No props yet — add one below." />
            <AddAssetInline onAdd={(name) => addCustomAsset("customProps", "propIds", name, false)} placeholder="Add a prop…" />
          </Section>
          <Section title="Set Elements" count={elementTags.length} defaultOpen={false}>
            <TagInput tags={elementTags} onChange={(next) => patch({ elementTags: next })} placeholder="Add element" />
          </Section>
        </>
      )}

      {/* Prompt */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-slate-800">Prompt</label>
          <span className="text-[11px] text-slate-400">From script · editable</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => patch({ prompt: e.target.value, promptEdited: true })}
          placeholder={`Describe the ${isChar ? "character's look" : "location"}…`}
          className="w-full h-24 resize-none rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white leading-relaxed"
        />
      </div>
    </div>
  )

  const footer = (
    <div className="shrink-0 border-t border-slate-100 p-4">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating visuals…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {result ? "Regenerate visuals" : "Generate visuals"}
          </>
        )}
      </button>
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
