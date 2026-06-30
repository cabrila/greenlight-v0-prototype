"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import {
  X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Search, Trash2,
  User, Package, Shirt, MapPin, PanelLeftClose, PanelLeftOpen,
  Plus, Trash, LayoutGrid, Rows3, Grid2x2, Grid3x3,
  SlidersHorizontal, ArrowUpDown,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { isValidImageUrl } from "@/lib/utils"
import { closeAllModals } from "../modals/ModalManager"
import CanvasItemCard, { type CanvasItem, type CanvasItemType, type ViewSize, TYPE_CONFIG, CARD_DIMENSIONS } from "./CanvasItemCard"
import CanvasElement from "./CanvasElement"
import CanvasToolbar, { type CanvasTool } from "./CanvasToolbar"

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

const VIEW_OPTIONS: { key: ViewSize; label: string; icon: typeof Rows3 }[] = [
  { key: "full", label: "Full", icon: Grid2x2 },
  { key: "medium", label: "Medium", icon: Grid3x3 },
  { key: "small", label: "Small", icon: Rows3 },
]

const ELEMENT_TYPES: CanvasItemType[] = ["text", "rectangle", "rounded", "ellipse", "frame", "image"]
const isElement = (t: CanvasItemType) => ELEMENT_TYPES.includes(t)

const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  frame: { width: 320, height: 240 },
  text: { width: 200, height: 44 },
  rectangle: { width: 180, height: 120 },
  rounded: { width: 180, height: 120 },
  ellipse: { width: 150, height: 150 },
  image: { width: 220, height: 160 },
}

const CREATION_LABEL: Record<string, string> = {
  frame: "Frame",
  text: "Text",
  rectangle: "Rectangle",
  rounded: "Rounded",
  ellipse: "Ellipse",
  image: "Image",
}

const cmpStr = (a?: string, b?: string) =>
  (a || "").localeCompare(b || "", undefined, { sensitivity: "base", numeric: true })

interface SortOption {
  key: string
  label: string
  compare: (a: PaletteItem, b: PaletteItem) => number
}

interface PaletteControls {
  filterLabel: string
  filterAllLabel: string
  filterAccessor: (it: PaletteItem) => string | undefined
  sorts: SortOption[]
}

const NAME_SORTS: SortOption[] = [
  { key: "name-asc", label: "Name (A–Z)", compare: (a, b) => cmpStr(a.title, b.title) },
  { key: "name-desc", label: "Name (Z–A)", compare: (a, b) => cmpStr(b.title, a.title) },
]

const PALETTE_CONTROLS: Record<PaletteTab, PaletteControls> = {
  actor: {
    filterLabel: "Character",
    filterAllLabel: "All characters",
    filterAccessor: (it) => it.subtitle,
    sorts: [
      ...NAME_SORTS,
      { key: "character", label: "Character", compare: (a, b) => cmpStr(a.subtitle, b.subtitle) || cmpStr(a.title, b.title) },
    ],
  },
  prop: {
    filterLabel: "Category",
    filterAllLabel: "All categories",
    filterAccessor: (it) => it.subtitle,
    sorts: [
      ...NAME_SORTS,
      { key: "category", label: "Category", compare: (a, b) => cmpStr(a.subtitle, b.subtitle) || cmpStr(a.title, b.title) },
      { key: "status", label: "Status", compare: (a, b) => cmpStr(a.meta, b.meta) || cmpStr(a.title, b.title) },
    ],
  },
  costume: {
    filterLabel: "Type",
    filterAllLabel: "All types",
    filterAccessor: (it) => it.subtitle,
    sorts: [
      ...NAME_SORTS,
      { key: "type", label: "Type", compare: (a, b) => cmpStr(a.subtitle, b.subtitle) || cmpStr(a.title, b.title) },
      { key: "status", label: "Status", compare: (a, b) => cmpStr(a.meta, b.meta) || cmpStr(a.title, b.title) },
    ],
  },
  location: {
    filterLabel: "Status",
    filterAllLabel: "All statuses",
    filterAccessor: (it) => it.meta,
    sorts: [
      ...NAME_SORTS,
      { key: "status", label: "Status", compare: (a, b) => cmpStr(a.meta, b.meta) || cmpStr(a.title, b.title) },
    ],
  },
}

export default function CanvasModal({ onClose }: CanvasModalProps) {
  const { state, dispatch } = useCasting()
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingImageIdRef = useRef<string | null>(null)
  // When the load effect populates state, the resulting render must NOT trigger
  // a save (it would persist stale/empty state and clobber storage). This ref
  // tells the save effect to skip exactly that one load-induced run.
  const skipNextSaveRef = useRef(true)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  const [items, setItems] = useState<CanvasItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [groupNames, setGroupNames] = useState<Record<string, string>>({})

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<PaletteTab>("actor")
  const [search, setSearch] = useState("")
  const [filterValues, setFilterValues] = useState<Record<PaletteTab, string>>({
    actor: "all", prop: "all", costume: "all", location: "all",
  })
  const [sortKeys, setSortKeys] = useState<Record<PaletteTab, string>>({
    actor: "name-asc", prop: "name-asc", costume: "name-asc", location: "name-asc",
  })

  const [viewSize, setViewSize] = useState<ViewSize>("full")
  const [activeTool, setActiveTool] = useState<CanvasTool>("select")
  const [newNoteId, setNewNoteId] = useState<string | null>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const storageKey = `canvas-v2-${state.currentFocus.currentProjectId}`

  const cardWidth = CARD_DIMENSIONS[viewSize].width

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

  const activeControls = PALETTE_CONTROLS[activeTab]
  const activeFilter = filterValues[activeTab]
  const activeSort = sortKeys[activeTab]

  /* Distinct filter values derived from the full (unfiltered) palette */
  const filterOptions = (() => {
    const vals = new Set<string>()
    paletteByTab[activeTab].forEach((it) => {
      const v = activeControls.filterAccessor(it)?.trim()
      if (v) vals.add(v)
    })
    return Array.from(vals).sort((a, b) => cmpStr(a, b))
  })()

  const currentPalette = (() => {
    const q = search.trim().toLowerCase()
    const sortOpt = activeControls.sorts.find((s) => s.key === activeSort) || activeControls.sorts[0]
    const applyFilter = activeFilter !== "all" && filterOptions.includes(activeFilter)
    return paletteByTab[activeTab]
      .filter((it) => {
        if (q && !(it.title.toLowerCase().includes(q) || (it.subtitle || "").toLowerCase().includes(q))) return false
        if (applyFilter && (activeControls.filterAccessor(it) || "").trim() !== activeFilter) return false
        return true
      })
      .sort(sortOpt.compare)
  })()

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
        if (data.viewSize) setViewSize(data.viewSize)
        if (data.groupNames && typeof data.groupNames === "object") setGroupNames(data.groupNames)
      } else {
        setItems([])
      }
    } catch {
      /* ignore */
    }
    // The state updates above will trigger the save effect on the next commit;
    // skip that one run so we don't persist stale state over what we just loaded.
    skipNextSaveRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  /* Auto-save: persist on every change (add, move, edit, group, zoom, pan). */
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items, zoom, pan, viewSize, groupNames, savedAt: Date.now() }))
    } catch {
      /* ignore */
    }
  }, [items, zoom, pan, viewSize, groupNames, storageKey])

  /* ---------------------------------------------------------------- */
  /*  Coordinate helpers                                               */
  /* ---------------------------------------------------------------- */

  const clientToCanvas = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const left = rect?.left ?? 0
    const top = rect?.top ?? 0
    return {
      x: (clientX - left - pan.x) / zoom,
      y: (clientY - top - pan.y) / zoom,
    }
  }

  const viewportCenterToCanvas = () => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const w = rect?.width ?? window.innerWidth
    const h = rect?.height ?? window.innerHeight
    return {
      x: (w / 2 - pan.x) / zoom - cardWidth / 2,
      y: (h / 2 - pan.y) / zoom - CARD_DIMENSIONS[viewSize].height / 2,
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Adding palette items                                             */
  /* ---------------------------------------------------------------- */

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
    const offset = items.length % 6
    setItems((prev) => [...prev, makeItem(p, base.x + offset * 24, base.y + offset * 24)])
  }

  const createNoteAt = (canvasX: number, canvasY: number) => {
    const id = `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setItems((prev) => [
      ...prev,
      { id, type: "note", refId: "note", x: canvasX - 18, y: canvasY - 18, title: "Note", noteText: "" },
    ])
    setNewNoteId(id)
    setSelectedIds([id])
    setActiveTool("select")
  }

  /* ---------------------------------------------------------------- */
  /*  Creating tool elements                                           */
  /* ---------------------------------------------------------------- */

  const createElementAt = (type: CanvasItemType, canvasX: number, canvasY: number) => {
    const size = DEFAULT_SIZES[type] || { width: 160, height: 120 }
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newItem: CanvasItem = {
      id,
      type,
      refId: type,
      x: canvasX - size.width / 2,
      y: canvasY - size.height / 2,
      title: CREATION_LABEL[type] || "Element",
      width: size.width,
      height: size.height,
      text: type === "frame" ? "Frame" : "",
    }
    setItems((prev) => [...prev, newItem])
    setSelectedIds([id])
    setActiveTool("select")
    if (type === "image") {
      // defer the file picker so the element renders first
      setTimeout(() => triggerImageUpload(id), 50)
    }
  }

  const triggerImageUpload = (id: string) => {
    pendingImageIdRef.current = id
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const id = pendingImageIdRef.current
    pendingImageIdRef.current = null
    e.target.value = ""
    if (!file || !id) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : ""
      if (dataUrl) {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, image: dataUrl } : it)))
      }
    }
    reader.readAsDataURL(file)
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
    if (!raw) return
    try {
      const p: PaletteItem = JSON.parse(raw)
      const c = clientToCanvas(e.clientX, e.clientY)
      setItems((prev) => [...prev, makeItem(p, c.x - cardWidth / 2, c.y - CARD_DIMENSIONS[viewSize].height / 2)])
    } catch {
      /* ignore */
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Selection & item interactions                                    */
  /* ---------------------------------------------------------------- */

  const groupMembers = useCallback(
    (id: string) => {
      const it = items.find((i) => i.id === id)
      if (it?.groupId) return items.filter((i) => i.groupId === it.groupId).map((i) => i.id)
      return [id]
    },
    [items],
  )

  const handleSelect = (id: string, isMulti: boolean) => {
    const members = groupMembers(id)
    setSelectedIds((prev) => {
      if (isMulti) {
        const allIn = members.every((m) => prev.includes(m))
        return allIn ? prev.filter((p) => !members.includes(p)) : Array.from(new Set([...prev, ...members]))
      }
      return members
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

  const handleResize = useCallback((id: string, width: number, height: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, width, height } : it)))
  }, [])

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  const handleNoteChange = (id: string, text: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, noteText: text } : it)))
  }

  const handleTextChange = (id: string, text: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)))
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
  /*  Grouping                                                         */
  /* ---------------------------------------------------------------- */

  const selectionIsGrouped = useMemo(() => {
    if (selectedIds.length < 2) return false
    const ids = new Set(selectedIds)
    const groups = items.filter((i) => ids.has(i.id)).map((i) => i.groupId)
    return groups.every((g) => g && g === groups[0])
  }, [selectedIds, items])

  const groupSelected = () => {
    if (selectedIds.length < 2) return
    const gid = `grp-${Date.now()}`
    setItems((prev) => prev.map((it) => (selectedIds.includes(it.id) ? { ...it, groupId: gid } : it)))
    setGroupNames((prev) => ({ ...prev, [gid]: "New group" }))
  }

  const ungroupSelected = () => {
    const removedGids = new Set(
      items.filter((it) => selectedIds.includes(it.id) && it.groupId).map((it) => it.groupId as string),
    )
    setItems((prev) => prev.map((it) => (selectedIds.includes(it.id) ? { ...it, groupId: undefined } : it)))
    setGroupNames((prev) => {
      const next = { ...prev }
      removedGids.forEach((g) => delete next[g])
      return next
    })
  }

  const renameGroup = (gid: string, name: string) => {
    setGroupNames((prev) => ({ ...prev, [gid]: name }))
  }

  /* Bounding box for every group, derived from member positions/sizes */
  const groupBoxes = useMemo(() => {
    const PAD = 18
    const byGroup = new Map<string, CanvasItem[]>()
    items.forEach((it) => {
      if (!it.groupId) return
      const arr = byGroup.get(it.groupId) || []
      arr.push(it)
      byGroup.set(it.groupId, arr)
    })
    const boxes: { id: string; x: number; y: number; width: number; height: number; selected: boolean }[] = []
    byGroup.forEach((members, gid) => {
      if (members.length < 2) return
      const minX = Math.min(...members.map((m) => m.x))
      const minY = Math.min(...members.map((m) => m.y))
      const maxX = Math.max(...members.map((m) => m.x + (m.width ?? cardWidth)))
      const maxY = Math.max(...members.map((m) => m.y + (m.height ?? CARD_DIMENSIONS[viewSize].height)))
      boxes.push({
        id: gid,
        x: minX - PAD,
        y: minY - PAD,
        width: maxX - minX + PAD * 2,
        height: maxY - minY + PAD * 2,
        selected: members.some((m) => selectedIds.includes(m.id)),
      })
    })
    return boxes
  }, [items, selectedIds, cardWidth, viewSize])

  /* ---------------------------------------------------------------- */
  /*  Pan, zoom & tool interactions                                    */
  /* ---------------------------------------------------------------- */

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const onCard = !!target.closest("[data-canvas-card]")

    // Comment tool: drop a comment pin where the user clicks.
    if (activeTool === "note") {
      if (onCard) return
      const c = clientToCanvas(e.clientX, e.clientY)
      createNoteAt(c.x, c.y)
      return
    }

    // Creation tools: place a new element where the user clicks.
    if (isElement(activeTool as CanvasItemType)) {
      if (onCard) return
      const c = clientToCanvas(e.clientX, e.clientY)
      createElementAt(activeTool as CanvasItemType, c.x, c.y)
      return
    }

    // Select tool: let cards handle their own drag; clicking empty clears.
    if (activeTool === "select" && onCard) return
    if (activeTool === "select" && !e.ctrlKey && !e.metaKey && !e.shiftKey) setSelectedIds([])

    // Pan (pan tool, or empty-canvas drag in select mode)
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

  const itemDims = (it: CanvasItem) => ({
    w: it.width ?? cardWidth,
    h: it.height ?? CARD_DIMENSIONS[viewSize].height,
  })

  const fitToContent = () => {
    if (items.length === 0) return resetView()
    const rect = canvasRef.current?.getBoundingClientRect()
    const availW = rect?.width ?? window.innerWidth
    const availH = rect?.height ?? window.innerHeight
    const minX = Math.min(...items.map((i) => i.x))
    const minY = Math.min(...items.map((i) => i.y))
    const maxX = Math.max(...items.map((i) => i.x + itemDims(i).w))
    const maxY = Math.max(...items.map((i) => i.y + itemDims(i).h))
    const w = maxX - minX
    const h = maxY - minY
    const pad = 80
    const newZoom = Math.max(0.2, Math.min(1.5, Math.min((availW - pad * 2) / w, (availH - pad * 2) / h)))
    setZoom(newZoom)
    setPan({ x: availW / 2 - ((minX + maxX) / 2) * newZoom, y: availH / 2 - ((minY + maxY) / 2) * newZoom })
  }

  /* ---------------------------------------------------------------- */
  /*  Keyboard shortcuts                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "g") {
          e.preventDefault()
          if (selectionIsGrouped) ungroupSelected()
          else groupSelected()
        }
        return
      }
      switch (e.key.toLowerCase()) {
        case "v": setActiveTool("select"); break
        case "t": setActiveTool("text"); break
        case "c": setActiveTool("note"); break
        case "escape": setActiveTool("select"); setSelectedIds([]); break
        case "delete":
        case "backspace":
          if (selectedIds.length) { e.preventDefault(); removeSelected() }
          break
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, selectionIsGrouped, items])

  const handleClose = () => {
    closeAllModals()
    onClose()
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    items.forEach((i) => (c[i.type] = (c[i.type] || 0) + 1))
    return c
  }, [items])

  const cursorForTool =
    activeTool === "note" || isElement(activeTool as CanvasItemType) ? "crosshair"
      : isPanning ? "grabbing" : "default"

  const interactive = activeTool === "select"

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
        <div className="hidden lg:flex items-center gap-1.5">
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
          {/* View size control */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1" role="group" aria-label="Card view size">
            {VIEW_OPTIONS.map((v) => {
              const Icon = v.icon
              const active = viewSize === v.key
              return (
                <button
                  key={v.key}
                  onClick={() => setViewSize(v.key)}
                  title={`${v.label} view`}
                  aria-pressed={active}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">{v.label}</span>
                </button>
              )
            })}
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={removeSelected}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {selectedIds.length}
            </button>
          )}

          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => zoomBy(0.9)} className="p-1.5 rounded hover:bg-white transition-colors" title="Zoom out"><ZoomOut className="w-4 h-4 text-slate-600" /></button>
            <span className="px-1.5 text-xs font-medium text-slate-600 w-11 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => zoomBy(1.1)} className="p-1.5 rounded hover:bg-white transition-colors" title="Zoom in"><ZoomIn className="w-4 h-4 text-slate-600" /></button>
            <button onClick={fitToContent} className="p-1.5 rounded hover:bg-white transition-colors" title="Fit to content"><Maximize2 className="w-4 h-4 text-slate-600" /></button>
            <button onClick={resetView} className="p-1.5 rounded hover:bg-white transition-colors" title="Reset view"><RotateCcw className="w-4 h-4 text-slate-600" /></button>
          </div>

          <button onClick={clearCanvas} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors" title="Clear canvas"><Trash className="w-4 h-4" /></button>

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
            <div className="p-3 pb-2 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${PALETTE_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()}...`}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Filter & sort */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={activeFilter}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                    aria-label={`Filter by ${activeControls.filterLabel.toLowerCase()}`}
                    className="w-full pl-7 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-700 capitalize"
                  >
                    <option value="all">{activeControls.filterAllLabel}</option>
                    {filterOptions.map((opt) => (
                      <option key={opt} value={opt} className="capitalize">{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={activeSort}
                    onChange={(e) => setSortKeys((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                    aria-label="Sort items"
                    className="w-full pl-7 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-700"
                  >
                    {activeControls.sorts.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-xs text-slate-400 px-0.5">Drag onto the canvas or click to add</p>
              {currentPalette.length === 0 && (
                <div className="text-center py-10 text-sm text-slate-400">No items found.</div>
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
                      <span className={`absolute top-0 left-0 h-full ${cfg.bar}`} style={{ width: 3 }} />
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
            cursor: cursorForTool,
            backgroundImage: "radial-gradient(circle, rgb(203 213 225) 1px, transparent 1px)",
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
          onMouseDown={handleCanvasMouseDown}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* Tool rail */}
          <CanvasToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            canGroup={selectedIds.length >= 2}
            isGrouped={selectionIsGrouped}
            onGroup={groupSelected}
            onUngroup={ungroupSelected}
          />

          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* Group bounding boxes with renameable titles */}
            {groupBoxes.map((box) => (
              <div
                key={box.id}
                className="absolute pointer-events-none"
                style={{ left: box.x, top: box.y, width: box.width, height: box.height, zIndex: 0 }}
              >
                <div
                  className={`absolute inset-0 rounded-xl border-2 ${
                    box.selected ? "border-emerald-500 bg-emerald-500/[0.06]" : "border-emerald-400/50 bg-emerald-500/[0.03]"
                  }`}
                />
                <input
                  className="pointer-events-auto absolute -top-7 left-0 max-w-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-emerald-700 rounded-md px-2 py-0.5 border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={groupNames[box.id] ?? "Group"}
                  onChange={(e) => renameGroup(box.id, e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  aria-label="Group title"
                  spellCheck={false}
                />
              </div>
            ))}

            {items.map((item) =>
              isElement(item.type) ? (
                <CanvasElement
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  interactive={interactive}
                  zoom={zoom}
                  onSelect={handleSelect}
                  onDrag={handleItemDrag}
                  onResize={handleResize}
                  onRemove={handleRemove}
                  onTextChange={handleTextChange}
                  onSetImage={triggerImageUpload}
                />
              ) : (
                <CanvasItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  viewSize={viewSize}
                  interactive={interactive}
                  autoOpenNote={item.id === newNoteId}
                  onSelect={handleSelect}
                  onDrag={handleItemDrag}
                  onRemove={handleRemove}
                  onNoteChange={handleNoteChange}
                />
              ),
            )}
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
                  Add cast, props, costume &amp; makeup, and locations from the library. Use the tool rail to add text, images, and comment pins, then group and rename your arrangements.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden input used by the Image tool / image elements for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  )
}
