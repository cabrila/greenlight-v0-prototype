"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import {
  X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, Trash2,
  User, Package, Shirt, MapPin, StickyNote, PanelLeftClose, PanelLeftOpen,
  Plus, Save, Trash, LayoutGrid,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { isValidImageUrl } from "@/lib/utils"
import { closeAllModals } from "../modals/ModalManager"
import CanvasItemCard, { type CanvasItem, type CanvasItemType, TYPE_CONFIG } from "./CanvasItemCard"

interface CanvasModalProps {
  onClose: () => void
}

interface PaletteItem {
  refId: string
  type: CanvasItemType
  title: string
  subtitle?: string
  image?: string
  meta?: string
  tags?: string[]
}

type PaletteTab = "actor" | "prop" | "costume" | "location"

const PALETTE_TABS: { key: PaletteTab; label: string; icon: typeof User }[] = [
  { key: "actor", label: "Cast", icon: User },
  { key: "prop", label: "Props", icon: Package },
  { key: "costume", label: "Costume & Makeup", icon: Shirt },
  { key: "location", label: "Locations", icon: MapPin },
]

const CARD_WIDTH = 220
const CARD_HEIGHT = 230

export default function CanvasModal({ onClose }: CanvasModalProps) {
  const { state, dispatch } = useCasting()
  const canvasRef = useRef<HTMLDivElement>(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  const [items, setItems] = useState<CanvasItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<PaletteTab>("actor")
  const [search, setSearch] = useState("")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const storageKey = `canvas-v2-${state.currentFocus.currentProjectId}`

  /* ---------------------------------------------------------------- */
  /*  Build palette data from project                                  */
  /* ---------------------------------------------------------------- */

  const actorItems = useMemo<PaletteItem[]>(() => {
    if (!currentProject) return []
    const seen = new Set<string>()
    const out: PaletteItem[] = []
    currentProject.characters.forEach((char) => {
      const lists: any[] = []
      state.tabDefinitions.forEach((tabDef) => {
        if (tabDef.key === "shortLists") {
          char.actors.shortLists.forEach((sl) => lists.push(...sl.actors))
        } else {
          lists.push(...((char.actors as any)[tabDef.key] || []))
        }
      })
      lists.forEach((actor: any) => {
        if (seen.has(actor.id)) return
        seen.add(actor.id)
        out.push({
          refId: actor.id,
          type: "actor",
          title: actor.name,
          subtitle: char.name,
          image: actor.headshots?.find((h: string) => isValidImageUrl(h)),
          meta: actor.age ? `Age ${actor.age}` : actor.location,
        })
      })
    })
    return out
  }, [currentProject, state.tabDefinitions])

  const propItems = useMemo<PaletteItem[]>(() => {
    if (!currentProject) return []
    const source = (currentProject.propInventory?.length ? currentProject.propInventory : currentProject.props) || []
    return source.map((p: any) => ({
      refId: p.id,
      type: "prop" as const,
      title: p.name,
      subtitle: p.category,
      image: p.imageUrl,
      meta: p.status,
    }))
  }, [currentProject])

  const costumeItems = useMemo<PaletteItem[]>(() => {
    const inv = currentProject?.costumes?.inventory || []
    return inv.map((c) => ({
      refId: c.id,
      type: "costume" as const,
      title: c.name,
      subtitle: c.type?.replace(/-/g, " "),
      image: c.imageUrl,
      meta: c.status,
      tags: c.vibeTags,
    }))
  }, [currentProject])

  const locationItems = useMemo<PaletteItem[]>(() => {
    const source = (currentProject?.locationInventory?.length ? currentProject?.locationInventory : currentProject?.locations) || []
    return source.map((l) => ({
      refId: l.id,
      type: "location" as const,
      title: l.name,
      subtitle: l.address,
      image: l.media?.find((m) => m.type === "photo")?.url,
      meta: l.status?.replace(/-/g, " "),
      tags: l.vibeTags,
    }))
  }, [currentProject])

  const paletteByTab: Record<PaletteTab, PaletteItem[]> = {
    actor: actorItems,
    prop: propItems,
    costume: costumeItems,
    location: locationItems,
  }

  const currentPalette = paletteByTab[activeTab].filter((it) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return it.title.toLowerCase().includes(q) || (it.subtitle || "").toLowerCase().includes(q)
  })

  const placedRefIds = useMemo(() => new Set(items.map((i) => `${i.type}:${i.refId}`)), [items])

  /* ---------------------------------------------------------------- */
  /*  Persistence                                                      */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        setItems(Array.isArray(data.items) ? data.items : [])
        if (data.zoom) setZoom(data.zoom)
        if (data.pan) setPan(data.pan)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items, zoom, pan, savedAt: Date.now() }))
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `canvas-save-${Date.now()}`,
          type: "system",
          title: "Canvas saved",
          message: `${items.length} item(s) saved to this project's canvas`,
          timestamp: Date.now(),
          read: false,
          priority: "low",
        },
      })
    } catch {
      /* ignore */
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Adding items                                                     */
  /* ---------------------------------------------------------------- */

  const viewportCenterToCanvas = () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const w = rect?.width ?? window.innerWidth
    const h = rect?.height ?? window.innerHeight
    return {
      x: (w / 2 - pan.x) / zoom - CARD_WIDTH / 2,
      y: (h / 2 - pan.y) / zoom - CARD_HEIGHT / 2,
    }
  }

  const makeItem = (p: PaletteItem, x: number, y: number): CanvasItem => ({
    id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: p.type,
    refId: p.refId,
    x,
    y,
    title: p.title,
    subtitle: p.subtitle,
    image: p.image,
    meta: p.meta,
    tags: p.tags,
  })

  const addPaletteItem = (p: PaletteItem) => {
    const base = viewportCenterToCanvas()
    // stagger so multiple adds don't perfectly overlap
    const offset = items.length % 6
    setItems((prev) => [...prev, makeItem(p, base.x + offset * 24, base.y + offset * 24)])
  }

  const addNote = () => {
    const base = viewportCenterToCanvas()
    setItems((prev) => [
      ...prev,
      {
        id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "note",
        refId: "note",
        x: base.x,
        y: base.y,
        title: "Note",
        noteText: "",
      },
    ])
  }

  /* ---------------------------------------------------------------- */
  /*  Drag & drop from palette                                         */
  /* ---------------------------------------------------------------- */

  const handleDragStart = (e: React.DragEvent, p: PaletteItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(p))
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData("application/json")
    if (!raw || !canvasRef.current) return
    try {
      const p: PaletteItem = JSON.parse(raw)
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom - CARD_WIDTH / 2
      const y = (e.clientY - rect.top - pan.y) / zoom - CARD_HEIGHT / 2
      setItems((prev) => [...prev, makeItem(p, x, y)])
    } catch {
      /* ignore */
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Card interactions                                                */
  /* ---------------------------------------------------------------- */

  const handleSelect = (id: string, isMulti: boolean) => {
    setSelectedIds((prev) => {
      if (isMulti) return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      return [id]
    })
  }

  const handleItemDrag = useCallback(
    (id: string, dx: number, dy: number) => {
      setSelectedIds((sel) => {
        const movingIds = sel.includes(id) ? sel : [id]
        setItems((prev) =>
          prev.map((it) => (movingIds.includes(it.id) ? { ...it, x: it.x + dx / zoom, y: it.y + dy / zoom } : it)),
        )
        return sel
      })
    },
    [zoom],
  )

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  const handleNoteChange = (id: string, text: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, noteText: text } : it)))
  }

  const removeSelected = () => {
    setItems((prev) => prev.filter((it) => !selectedIds.includes(it.id)))
    setSelectedIds([])
  }

  const clearCanvas = () => {
    if (items.length === 0) return
    if (confirm("Clear all items from the canvas?")) {
      setItems([])
      setSelectedIds([])
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Pan & zoom                                                       */
  /* ---------------------------------------------------------------- */

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("[data-canvas-card]")) return
    if (!e.ctrlKey && !e.metaKey) setSelectedIds([])
    setIsPanning(true)
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }

  useEffect(() => {
    if (!isPanning) return
    const move = (e: MouseEvent) => setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y })
    const up = () => setIsPanning(false)
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
    }
  }, [isPanning])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!canvasRef.current) return
      e.preventDefault()
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const canvasX = (mouseX - pan.x) / zoom
      const canvasY = (mouseY - pan.y) / zoom
      const delta = e.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.max(0.2, Math.min(3, zoom * delta))
      setZoom(newZoom)
      setPan({ x: mouseX - canvasX * newZoom, y: mouseY - canvasY * newZoom })
    },
    [pan, zoom],
  )

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const zoomBy = (factor: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const cx = (rect?.width ?? window.innerWidth) / 2
    const cy = (rect?.height ?? window.innerHeight) / 2
    const canvasX = (cx - pan.x) / zoom
    const canvasY = (cy - pan.y) / zoom
    const newZoom = Math.max(0.2, Math.min(3, zoom * factor))
    setZoom(newZoom)
    setPan({ x: cx - canvasX * newZoom, y: cy - canvasY * newZoom })
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const fitToContent = () => {
    if (items.length === 0) return resetView()
    const rect = canvasRef.current?.getBoundingClientRect()
    const availW = rect?.width ?? window.innerWidth
    const availH = rect?.height ?? window.innerHeight
    const minX = Math.min(...items.map((i) => i.x))
    const minY = Math.min(...items.map((i) => i.y))
    const maxX = Math.max(...items.map((i) => i.x + CARD_WIDTH))
    const maxY = Math.max(...items.map((i) => i.y + CARD_HEIGHT))
    const w = maxX - minX
    const h = maxY - minY
    const pad = 80
    const newZoom = Math.max(0.2, Math.min(1.5, Math.min((availW - pad * 2) / w, (availH - pad * 2) / h)))
    setZoom(newZoom)
    setPan({ x: availW / 2 - ((minX + maxX) / 2) * newZoom, y: availH / 2 - ((minY + maxY) / 2) * newZoom })
  }

  const handleClose = () => {
    closeAllModals()
    onClose()
  }

  // counts per type currently on canvas
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    items.forEach((i) => (c[i.type] = (c[i.type] || 0) + 1))
    return c
  }, [items])

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 bg-white border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title={sidebarOpen ? "Hide library" : "Show library"}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-900 leading-tight truncate">Production Canvas</h1>
              <p className="text-xs text-slate-500 truncate">{currentProject?.name || "No project"}</p>
            </div>
          </div>
        </div>

        {/* Type counts */}
        <div className="hidden md:flex items-center gap-1.5">
          {(["actor", "prop", "costume", "location"] as CanvasItemType[]).map((t) => {
            const cfg = TYPE_CONFIG[t]
            const Icon = cfg.icon
            return (
              <span key={t} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${cfg.chip}`}>
                <Icon className="w-3.5 h-3.5" />
                {counts[t] || 0}
              </span>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={removeSelected}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {selectedIds.length}
            </button>
          )}

          <button onClick={addNote} className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors text-sm font-medium" title="Add a sticky note">
            <StickyNote className="w-4 h-4" />
            Note
          </button>

          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => zoomBy(0.9)} className="p-1.5 rounded hover:bg-white transition-colors" title="Zoom out"><ZoomOut className="w-4 h-4 text-slate-600" /></button>
            <span className="px-1.5 text-xs font-medium text-slate-600 w-11 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => zoomBy(1.1)} className="p-1.5 rounded hover:bg-white transition-colors" title="Zoom in"><ZoomIn className="w-4 h-4 text-slate-600" /></button>
            <button onClick={fitToContent} className="p-1.5 rounded hover:bg-white transition-colors" title="Fit to content"><Maximize2 className="w-4 h-4 text-slate-600" /></button>
            <button onClick={resetView} className="p-1.5 rounded hover:bg-white transition-colors" title="Reset view"><RotateCcw className="w-4 h-4 text-slate-600" /></button>
          </div>

          <button onClick={clearCanvas} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="Clear canvas"><Trash className="w-4 h-4" /></button>

          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium">
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button onClick={handleClose} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" title="Close canvas"><X className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Library sidebar */}
        {sidebarOpen && (
          <aside className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col">
            {/* Tabs */}
            <div className="grid grid-cols-4 gap-1 p-2 border-b border-slate-200">
              {PALETTE_TABS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                      active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"
                    }`}
                    title={tab.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium leading-none text-center">{tab.label.split(" ")[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${PALETTE_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-xs text-slate-400 px-0.5">Drag onto the canvas or click to add</p>
              {currentPalette.length === 0 && (
                <div className="text-center py-10 text-sm text-slate-400">
                  No items found.
                </div>
              )}
              {currentPalette.map((p) => {
                const cfg = TYPE_CONFIG[p.type]
                const Icon = cfg.icon
                const placed = placedRefIds.has(`${p.type}:${p.refId}`)
                const hasImg = isValidImageUrl(p.image)
                return (
                  <button
                    key={`${p.type}-${p.refId}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p)}
                    onClick={() => addPaletteItem(p)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors text-left group cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative w-12 h-12 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {hasImg ? (
                        <img src={p.image || "/placeholder.svg"} alt={p.title} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <Icon className="w-5 h-5 text-slate-300" />
                      )}
                      <span className={`absolute -top-0 -left-0 w-2 h-full ${cfg.bar}`} style={{ width: 3 }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      {p.subtitle && <p className="text-xs text-slate-500 truncate">{p.subtitle}</p>}
                    </div>
                    {placed ? (
                      <span className="text-[10px] text-emerald-600 font-medium shrink-0">On canvas</span>
                    ) : (
                      <Plus className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative flex-1 overflow-hidden bg-slate-100"
          style={{
            cursor: isPanning ? "grabbing" : "default",
            backgroundImage: "radial-gradient(circle, rgb(203 213 225) 1px, transparent 1px)",
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
          onMouseDown={handleCanvasMouseDown}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {items.map((item) => (
              <CanvasItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.includes(item.id)}
                onSelect={handleSelect}
                onDrag={handleItemDrag}
                onRemove={handleRemove}
                onNoteChange={handleNoteChange}
              />
            ))}
          </div>

          {/* Empty state */}
          {items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-sm px-6">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <LayoutGrid className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Build your production board</h3>
                <p className="text-sm text-slate-500 mt-1 text-pretty">
                  Add cast, props, costume &amp; makeup, and locations from the library on the left. Drag cards to arrange, scroll to zoom, and drag the background to pan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
