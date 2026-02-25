"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import {
  X,
  Plus,
  Search,
  MoreVertical,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  Check,
  Pencil,
  Trash2,
  Upload,
  Lightbulb,
  Image as ImageIcon,
  Layers,
  Hammer,
  Film,
  MapPin,
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  Paintbrush,
  Settings2,
  GripVertical,
  ArrowRight,
  CheckCircle,
  Clock,
  ChevronUp,
  Eye,
  Tag,
  Ruler,
  Sofa,
  StickyNote,
  Columns3,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"
import type {
  ProductionDesignSet,
  BuildElement,
  SetDecoration,
  LightingFixture,
  MoodBoardImage,
  ConstructionTask,
  SetStatusPhase,
  ConstructionPhase,
} from "@/types/casting"

/* ============================================================
   MOCK DATA
   ============================================================ */

const MOCK_SETS: ProductionDesignSet[] = [
  {
    id: "set-1",
    name: "Grant's Dig Site",
    description: "Badlands excavation camp with exposed fossil bed, canopy tents, and geological equipment. Desert environment with layered sediment walls.",
    status: "camera-ready",
    locationId: "loc1",
    sceneIds: ["scene-1", "scene-3"],
    buildElements: [
      { id: "be-1", name: "Sediment Wall Flat (12x8ft)", material: "Foam + Plaster", dimensions: "12' x 8' x 2'", quantity: 4, notes: "Painted desert strata layers" },
      { id: "be-2", name: "Fossil Bed Platform", material: "MDF + Resin casts", dimensions: "16' x 10'", quantity: 1, notes: "Embedded raptor claw replica" },
      { id: "be-3", name: "Canopy Frame", material: "Steel tube + Canvas", dimensions: "20' x 15'", quantity: 2 },
    ],
    decorations: [
      { id: "sd-1", name: "Geological Survey Maps", source: "fabricated", quantity: 6 },
      { id: "sd-2", name: "Paleontology Field Kit", source: "rental", quantity: 3 },
      { id: "sd-3", name: "Camp Chairs & Table", source: "inventory", propId: "prop-camp", quantity: 4 },
      { id: "sd-4", name: "Amber Specimen Display", source: "fabricated", quantity: 1, notes: "Hero prop, close-up ready" },
    ],
    lighting: [
      { id: "lf-1", name: "Desert Sun Rig (18K HMI)", type: "motivated", wattage: "18,000W", dimmable: false, notes: "Primary key through diffusion" },
      { id: "lf-2", name: "Tent Practicals (Lanterns)", type: "practical", wattage: "60W", dimmable: true },
    ],
    moodBoard: [
      { id: "mb-1", url: "/placeholder.svg?height=300&width=400", caption: "Badlands rock formation reference", tags: ["terrain", "color"], addedAt: Date.now() - 14 * 86400000 },
      { id: "mb-2", url: "/placeholder.svg?height=300&width=400", caption: "Excavation camp layout", tags: ["layout", "camp"], addedAt: Date.now() - 12 * 86400000 },
      { id: "mb-3", url: "/placeholder.svg?height=300&width=400", caption: "Fossil bed texture detail", tags: ["texture", "prop"], addedAt: Date.now() - 10 * 86400000 },
    ],
    estimatedBudget: "$45,000",
    actualBudget: "$42,300",
    notes: "Wind machines needed for exterior shots. Coordinate with SFX for dust effects.",
    createdAt: Date.now() - 30 * 86400000,
    updatedAt: Date.now() - 2 * 86400000,
  },
  {
    id: "set-2",
    name: "Jurassic Park Visitor Center",
    description: "Grand rotunda with dinosaur skeleton displays, amber-themed decor, and park branding. Two-story set with balcony mezzanine.",
    status: "construction",
    locationId: "loc3",
    sceneIds: ["scene-5", "scene-8", "scene-12"],
    buildElements: [
      { id: "be-4", name: "Rotunda Columns (Fluted)", material: "Fibreglass", dimensions: "24' x 3' dia", quantity: 8 },
      { id: "be-5", name: "Mezzanine Balcony", material: "Steel + MDF", dimensions: "40' x 6'", quantity: 1, notes: "Must support 6 actors + camera crew" },
      { id: "be-6", name: "Entrance Arch", material: "Foam sculpted", dimensions: "18' x 12'", quantity: 1, notes: "Jurassic Park logo carved in stone" },
      { id: "be-7", name: "Gift Shop Shelving Units", material: "Pine + Paint", dimensions: "8' x 4'", quantity: 6 },
    ],
    decorations: [
      { id: "sd-5", name: "T-Rex Skeleton (3/4 scale)", source: "rental", quantity: 1, notes: "Mounted on rotating base" },
      { id: "sd-6", name: "Amber Display Cases", source: "fabricated", quantity: 4 },
      { id: "sd-7", name: "JP Branded Merchandise", source: "fabricated", quantity: 50 },
      { id: "sd-8", name: "Visitor Information Plaques", source: "fabricated", quantity: 12 },
    ],
    lighting: [
      { id: "lf-3", name: "Grand Chandelier Practical", type: "practical", wattage: "2,400W", dimmable: true, notes: "Amber glass shades, JP logo" },
      { id: "lf-4", name: "Display Case Spots", type: "ambient", wattage: "150W each", dimmable: true },
      { id: "lf-5", name: "Emergency Red Lights", type: "effect", wattage: "40W", dimmable: false, notes: "Triggered by power-failure scene" },
    ],
    moodBoard: [
      { id: "mb-4", url: "/placeholder.svg?height=300&width=400", caption: "Museum rotunda inspiration", tags: ["architecture", "grand"], addedAt: Date.now() - 20 * 86400000 },
      { id: "mb-5", url: "/placeholder.svg?height=300&width=400", caption: "Amber lighting mood", tags: ["lighting", "warm"], addedAt: Date.now() - 18 * 86400000 },
    ],
    estimatedBudget: "$120,000",
    actualBudget: "$95,500",
    notes: "Skeleton rigging must be inspected by structural engineer before camera day.",
    createdAt: Date.now() - 45 * 86400000,
    updatedAt: Date.now() - 1 * 86400000,
  },
  {
    id: "set-3",
    name: "Raptor Kitchen",
    description: "Industrial commercial kitchen with stainless steel surfaces, walk-in freezer door, and overhead pot racks. Must accommodate raptor animatronic clearance.",
    status: "dressing",
    locationId: "loc3",
    sceneIds: ["scene-42"],
    buildElements: [
      { id: "be-8", name: "Kitchen Island Counter", material: "Steel + Laminate", dimensions: "12' x 4'", quantity: 2 },
      { id: "be-9", name: "Walk-in Freezer Door", material: "Aluminium + Insulation", dimensions: "7' x 4'", quantity: 1, notes: "Functional latch, must lock from inside" },
      { id: "be-10", name: "Overhead Pot Rack", material: "Steel tube", dimensions: "8' x 3'", quantity: 3 },
    ],
    decorations: [
      { id: "sd-9", name: "Stainless Steel Cookware", source: "rental", quantity: 40 },
      { id: "sd-10", name: "Industrial Shelving + Jello Molds", source: "purchase", quantity: 6, notes: "Green jello, hero prop" },
    ],
    lighting: [
      { id: "lf-6", name: "Fluorescent Ceiling Banks", type: "practical", wattage: "120W", dimmable: false },
      { id: "lf-7", name: "Freezer Interior Light", type: "motivated", wattage: "60W", dimmable: true },
    ],
    moodBoard: [
      { id: "mb-6", url: "/placeholder.svg?height=300&width=400", caption: "Industrial kitchen reference", tags: ["steel", "industrial"], addedAt: Date.now() - 8 * 86400000 },
    ],
    estimatedBudget: "$35,000",
    notes: "Animatronic clearance: minimum 9ft ceiling required. Floor protection for raptor feet mechanisms.",
    createdAt: Date.now() - 25 * 86400000,
    updatedAt: Date.now() - 3 * 86400000,
  },
  {
    id: "set-4",
    name: "Control Room",
    description: "High-tech nerve center with CRT monitors, server racks, and custom Unix workstations. Elevated viewing platform overlooking park.",
    status: "design",
    sceneIds: ["scene-15", "scene-20"],
    buildElements: [
      { id: "be-11", name: "Console Desk Array", material: "MDF + Acrylic", dimensions: "20' curved", quantity: 1 },
      { id: "be-12", name: "Server Rack Wall", material: "Steel + LED strips", dimensions: "12' x 8'", quantity: 1 },
    ],
    decorations: [
      { id: "sd-11", name: "CRT Monitors", source: "rental", quantity: 24 },
      { id: "sd-12", name: "Keyboard & Mouse Sets", source: "purchase", quantity: 12 },
      { id: "sd-13", name: "Park Map Backlit Display", source: "fabricated", quantity: 1 },
    ],
    lighting: [
      { id: "lf-8", name: "Monitor Glow (Practical)", type: "practical", wattage: "variable", dimmable: true },
      { id: "lf-9", name: "Overhead Fluorescent Grid", type: "ambient", wattage: "240W", dimmable: true, notes: "Flickers during power cut" },
    ],
    moodBoard: [
      { id: "mb-7", url: "/placeholder.svg?height=300&width=400", caption: "90s control room aesthetic", tags: ["tech", "retro"], addedAt: Date.now() - 5 * 86400000 },
    ],
    estimatedBudget: "$65,000",
    notes: "All monitors need functional screen content. Coordinate with VFX for park tracking UI.",
    createdAt: Date.now() - 20 * 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "set-5",
    name: "Ford Explorer Interior",
    description: "Custom vehicle interior for park tour sequence. Night-vision compatible. Must accommodate camera mounts on all angles.",
    status: "approved",
    sceneIds: ["scene-10", "scene-22", "scene-30"],
    buildElements: [
      { id: "be-13", name: "Explorer Shell (Split)", material: "Fibreglass + Steel", dimensions: "Vehicle scale", quantity: 1, notes: "Driver & passenger side separable" },
      { id: "be-14", name: "Dashboard Electronics", material: "Custom electronics", dimensions: "Standard", quantity: 1 },
    ],
    decorations: [
      { id: "sd-14", name: "Night Vision Goggles", source: "fabricated", quantity: 2 },
      { id: "sd-15", name: "Tour Guide Screens", source: "fabricated", quantity: 2 },
    ],
    lighting: [
      { id: "lf-10", name: "Dashboard Glow", type: "practical", wattage: "30W", dimmable: true },
      { id: "lf-11", name: "T-Rex Attack Lightning Effect", type: "effect", wattage: "6,000W", dimmable: false, notes: "Strobe + rain interaction" },
    ],
    moodBoard: [],
    estimatedBudget: "$55,000",
    notes: "Rain rig coordination with SFX. Breakaway windshield needed for T-Rex attack.",
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now() - 4 * 86400000,
  },
]

const MOCK_TASKS: ConstructionTask[] = [
  { id: "ct-1", title: "Build sediment wall flats", phase: "carpentry", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-2", title: "Paint desert strata on flats", phase: "paint", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-3", title: "Install canopy rigging", phase: "rigging", priority: "medium", completed: true, setId: "set-1" },
  { id: "ct-4", title: "Place fossil bed + dress camp", phase: "set-dec", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-5", title: "Final camera walk-through", phase: "on-camera", priority: "high", completed: true, setId: "set-1" },
  { id: "ct-6", title: "Frame rotunda columns", phase: "carpentry", priority: "urgent", completed: true, setId: "set-2" },
  { id: "ct-7", title: "Mezzanine steel structure", phase: "carpentry", priority: "urgent", completed: true, setId: "set-2" },
  { id: "ct-8", title: "Prime & paint columns", phase: "paint", priority: "high", completed: false, setId: "set-2", assignedTo: "Paint Crew A" },
  { id: "ct-9", title: "Rig chandelier + display spots", phase: "rigging", priority: "high", completed: false, setId: "set-2", assignedTo: "Electric Dept" },
  { id: "ct-10", title: "Install T-Rex skeleton", phase: "set-dec", priority: "urgent", completed: false, setId: "set-2", notes: "Structural engineer sign-off needed" },
  { id: "ct-11", title: "Build kitchen islands", phase: "carpentry", priority: "high", completed: true, setId: "set-3" },
  { id: "ct-12", title: "Chrome finish on counters", phase: "paint", priority: "medium", completed: true, setId: "set-3" },
  { id: "ct-13", title: "Install pot racks + freezer door", phase: "rigging", priority: "high", completed: true, setId: "set-3" },
  { id: "ct-14", title: "Dress kitchen with cookware", phase: "set-dec", priority: "high", completed: false, setId: "set-3", assignedTo: "Set Dec Team" },
  { id: "ct-15", title: "Console desk CNC cut", phase: "carpentry", priority: "medium", completed: false, setId: "set-4", dueDate: Date.now() + 7 * 86400000 },
  { id: "ct-16", title: "Explorer shell fabrication", phase: "carpentry", priority: "high", completed: false, setId: "set-5", dueDate: Date.now() + 5 * 86400000 },
]

/* ============================================================
   HELPERS
   ============================================================ */

const STATUS_CONFIG: Record<SetStatusPhase, { label: string; color: string; bg: string }> = {
  concept:        { label: "Concept",        color: "text-gray-700",    bg: "bg-gray-100" },
  design:         { label: "Design",         color: "text-blue-700",    bg: "bg-blue-50" },
  drafting:       { label: "Drafting",       color: "text-indigo-700",  bg: "bg-indigo-50" },
  approved:       { label: "Approved",       color: "text-emerald-700", bg: "bg-emerald-50" },
  construction:   { label: "Construction",   color: "text-amber-700",   bg: "bg-amber-50" },
  dressing:       { label: "Dressing",       color: "text-purple-700",  bg: "bg-purple-50" },
  "camera-ready": { label: "Camera Ready",   color: "text-green-700",   bg: "bg-green-100" },
  wrapped:        { label: "Wrapped",        color: "text-gray-500",    bg: "bg-gray-50" },
}

const PHASE_CONFIG: Record<ConstructionPhase, { label: string; color: string; bg: string; border: string }> = {
  carpentry:  { label: "Carpentry",  color: "text-amber-800",   bg: "bg-amber-50",   border: "border-amber-200" },
  paint:      { label: "Paint",      color: "text-blue-800",    bg: "bg-blue-50",     border: "border-blue-200" },
  rigging:    { label: "Rigging",    color: "text-orange-800",  bg: "bg-orange-50",   border: "border-orange-200" },
  "set-dec":  { label: "Set Dec",    color: "text-purple-800",  bg: "bg-purple-50",   border: "border-purple-200" },
  "on-camera":{ label: "On Camera",  color: "text-green-800",   bg: "bg-green-50",    border: "border-green-200" },
  strike:     { label: "Strike",     color: "text-gray-700",    bg: "bg-gray-50",     border: "border-gray-200" },
}

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/* ============================================================
   COMPONENT
   ============================================================ */

type ModalTab = "sets" | "moodboards" | "construction" | "lighting"

export default function ProductionDesignModal({ onClose }: { onClose: () => void }) {
  const { state } = useCasting()
  const currentProject = state.projects?.[0]
  const scenes = currentProject?.scenes || []
  const locations = currentProject?.locations || []

  const [activeTab, setActiveTab] = useState<ModalTab>("sets")
  const [searchTerm, setSearchTerm] = useState("")
  const [sets, setSets] = useState<ProductionDesignSet[]>(MOCK_SETS)
  const [tasks, setTasks] = useState<ConstructionTask[]>(MOCK_TASKS)
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    buildElements: true,
    decorations: true,
    lighting: true,
    moodBoard: false,
  })

  const selectedSet = useMemo(() => sets.find((s) => s.id === selectedSetId), [sets, selectedSetId])

  const filteredSets = useMemo(() => {
    if (!searchTerm.trim()) return sets
    const q = searchTerm.toLowerCase()
    return sets.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q),
    )
  }, [sets, searchTerm])

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const resolveLocationName = (id?: string) => {
    if (!id) return null
    const loc = locations.find((l: any) => l.id === id)
    return loc ? loc.name : id
  }

  const resolveSceneLabel = (sceneId: string) => {
    const sc = scenes.find((s: any) => s.id === sceneId)
    return sc ? `Sc ${sc.sceneNumber}` : sceneId
  }

  /* Task helpers */
  const toggleTaskComplete = (taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)))
  }

  const tasksByPhase = useMemo(() => {
    const phases: ConstructionPhase[] = ["carpentry", "paint", "rigging", "set-dec", "on-camera", "strike"]
    return phases.map((phase) => ({
      phase,
      tasks: tasks.filter((t) => t.phase === phase),
    }))
  }, [tasks])

  /* Budget summary */
  const budgetSummary = useMemo(() => {
    const parseBudget = (s: string) => parseFloat(s.replace(/[^0-9.]/g, "")) || 0
    const est = sets.reduce((sum, s) => sum + parseBudget(s.estimatedBudget), 0)
    const act = sets.reduce((sum, s) => sum + parseBudget(s.actualBudget || "0"), 0)
    return { estimated: est, actual: act }
  }, [sets])

  /* All mood board images */
  const allMoodImages = useMemo(() => {
    return sets.flatMap((s) => s.moodBoard.map((img) => ({ ...img, setName: s.name, setId: s.id })))
  }, [sets])

  /* All lighting fixtures */
  const allLighting = useMemo(() => {
    return sets.flatMap((s) => s.lighting.map((l) => ({ ...l, setName: s.name, setId: s.id })))
  }, [sets])

  /* ========================================
     RENDER
     ======================================== */

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* -------- HEADER -------- */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-8 w-auto" />
          <div className="inline-flex items-center bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            Production Design
          </div>
          {currentProject ? (
            <span className="hidden sm:inline text-sm text-gray-500">{currentProject.name}</span>
          ) : (
            <span className="hidden sm:inline text-sm text-amber-600 font-medium">No project selected</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* -------- TOOLBAR -------- */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        {/* Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {([
            { key: "sets", label: "Sets", icon: Layers },
            { key: "moodboards", label: "Mood Boards", icon: ImageIcon },
            { key: "construction", label: "Construction", icon: Hammer },
            { key: "lighting", label: "Lighting", icon: Lightbulb },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sets, elements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 transition-shadow"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Budget summary */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg">
              <DollarSign className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-500">Est</span>
              <span className="font-semibold text-gray-800">${budgetSummary.estimated.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-lg">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Actual</span>
              <span className="font-semibold text-emerald-800">${budgetSummary.actual.toLocaleString()}</span>
            </div>
          </div>

          {/* Cross-link buttons */}
          <button
            onClick={() => openModal("locations")}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" /> Locations
          </button>
          <button
            onClick={() => openModal("props")}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <Package className="w-3.5 h-3.5" /> Props
          </button>
        </div>
      </div>

      {/* -------- BODY -------- */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* =================== SETS TAB =================== */}
        {activeTab === "sets" && (
          <div className="flex h-full">
            {/* Left: Set list */}
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
              <div className="p-3 border-b border-gray-100 shrink-0">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {filteredSets.length} Set{filteredSets.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredSets.map((s) => {
                  const st = STATUS_CONFIG[s.status]
                  const isActive = s.id === selectedSetId
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSetId(s.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                        isActive ? "bg-violet-50 border-l-2 border-l-violet-500" : "hover:bg-gray-50 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isActive ? "text-violet-900" : "text-gray-900"}`}>{s.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{s.description}</p>
                        </div>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${st.color} ${st.bg}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {s.locationId && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                            <MapPin className="w-2.5 h-2.5" /> {resolveLocationName(s.locationId) || s.locationId}
                          </span>
                        )}
                        {s.sceneIds.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            <Film className="w-2.5 h-2.5" /> {s.sceneIds.length} scene{s.sceneIds.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">{s.estimatedBudget}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right: Set detail */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              {selectedSet ? (
                <div className="p-6 space-y-6 max-w-4xl">
                  {/* Set header */}
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedSet.name}</h2>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{selectedSet.description}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_CONFIG[selectedSet.status].color} ${STATUS_CONFIG[selectedSet.status].bg}`}>
                        {STATUS_CONFIG[selectedSet.status].label}
                      </span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-3">
                      {selectedSet.locationId && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-medium">
                          <MapPin className="w-3.5 h-3.5" /> {resolveLocationName(selectedSet.locationId) || selectedSet.locationId}
                        </span>
                      )}
                      {selectedSet.sceneIds.map((sid) => (
                        <span key={sid} className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg font-medium">
                          <Film className="w-3 h-3" /> {resolveSceneLabel(sid)}
                        </span>
                      ))}
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                        <DollarSign className="w-3.5 h-3.5" /> Est {selectedSet.estimatedBudget}
                        {selectedSet.actualBudget && (
                          <span className="text-emerald-700"> / Actual {selectedSet.actualBudget}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Build Elements */}
                  <CollapsibleSection
                    title="Build Elements"
                    icon={<Hammer className="w-4 h-4 text-amber-600" />}
                    count={selectedSet.buildElements.length}
                    isOpen={expandedSections.buildElements}
                    onToggle={() => toggleSection("buildElements")}
                  >
                    <div className="space-y-2">
                      {selectedSet.buildElements.map((el) => (
                        <div key={el.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                            <Hammer className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">{el.name}</p>
                              <span className="text-xs text-gray-500 shrink-0">x{el.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                              <span>{el.material}</span>
                              <span className="text-gray-300">|</span>
                              <span>{el.dimensions}</span>
                            </div>
                            {el.notes && <p className="text-[11px] text-gray-400 mt-1 italic">{el.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Set Decorations */}
                  <CollapsibleSection
                    title="Set Decorations"
                    icon={<Sofa className="w-4 h-4 text-purple-600" />}
                    count={selectedSet.decorations.length}
                    isOpen={expandedSections.decorations}
                    onToggle={() => toggleSection("decorations")}
                  >
                    <div className="space-y-2">
                      {selectedSet.decorations.map((dec) => (
                        <div key={dec.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                            <Sofa className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">{dec.name}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  dec.source === "inventory" ? "bg-emerald-50 text-emerald-700" :
                                  dec.source === "rental" ? "bg-blue-50 text-blue-700" :
                                  dec.source === "purchase" ? "bg-amber-50 text-amber-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {dec.source}
                                </span>
                                <span className="text-xs text-gray-500">x{dec.quantity}</span>
                              </div>
                            </div>
                            {dec.propId && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                                <Package className="w-2.5 h-2.5" /> Linked prop
                              </span>
                            )}
                            {dec.notes && <p className="text-[11px] text-gray-400 mt-1 italic">{dec.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Lighting */}
                  <CollapsibleSection
                    title="Lighting & Practicals"
                    icon={<Lightbulb className="w-4 h-4 text-yellow-600" />}
                    count={selectedSet.lighting.length}
                    isOpen={expandedSections.lighting}
                    onToggle={() => toggleSection("lighting")}
                  >
                    <div className="space-y-2">
                      {selectedSet.lighting.map((lf) => (
                        <div key={lf.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            lf.type === "practical" ? "bg-yellow-50" :
                            lf.type === "motivated" ? "bg-orange-50" :
                            lf.type === "effect" ? "bg-red-50" :
                            "bg-gray-50"
                          }`}>
                            <Lightbulb className={`w-4 h-4 ${
                              lf.type === "practical" ? "text-yellow-600" :
                              lf.type === "motivated" ? "text-orange-600" :
                              lf.type === "effect" ? "text-red-600" :
                              "text-gray-500"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">{lf.name}</p>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                lf.type === "practical" ? "bg-yellow-50 text-yellow-700" :
                                lf.type === "motivated" ? "bg-orange-50 text-orange-700" :
                                lf.type === "effect" ? "bg-red-50 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {lf.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                              {lf.wattage && <span>{lf.wattage}</span>}
                              <span className={lf.dimmable ? "text-emerald-600" : "text-gray-400"}>
                                {lf.dimmable ? "Dimmable" : "Non-dimmable"}
                              </span>
                            </div>
                            {lf.notes && <p className="text-[11px] text-gray-400 mt-1 italic">{lf.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Mood Board */}
                  <CollapsibleSection
                    title="Mood Board"
                    icon={<ImageIcon className="w-4 h-4 text-pink-600" />}
                    count={selectedSet.moodBoard.length}
                    isOpen={expandedSections.moodBoard}
                    onToggle={() => toggleSection("moodBoard")}
                  >
                    {selectedSet.moodBoard.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedSet.moodBoard.map((img) => (
                          <div key={img.id} className="group rounded-xl overflow-hidden border border-gray-200 bg-white">
                            <div className="aspect-[4/3] bg-gray-100">
                              <img src={img.url} alt={img.caption || "Mood board"} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2.5">
                              {img.caption && <p className="text-xs text-gray-700 font-medium line-clamp-1">{img.caption}</p>}
                              <div className="flex items-center gap-1.5 mt-1">
                                {img.tags.map((t) => (
                                  <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-medium">{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No mood board images yet</p>
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* Notes */}
                  {selectedSet.notes && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StickyNote className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Notes</span>
                      </div>
                      <p className="text-sm text-amber-900 leading-relaxed">{selectedSet.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Select a Set</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Choose a set from the list to view build elements, decorations, lighting plans, and mood boards.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================== MOOD BOARDS TAB =================== */}
        {activeTab === "moodboards" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-1">All Mood Boards</h2>
              <p className="text-sm text-gray-500 mb-6">Reference images across all sets</p>

              {allMoodImages.length > 0 ? (
                <div className="space-y-8">
                  {sets.filter((s) => s.moodBoard.length > 0).map((s) => (
                    <div key={s.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-bold text-gray-900">{s.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_CONFIG[s.status].color} ${STATUS_CONFIG[s.status].bg}`}>
                          {STATUS_CONFIG[s.status].label}
                        </span>
                        <span className="text-xs text-gray-400">{s.moodBoard.length} image{s.moodBoard.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {s.moodBoard.map((img) => (
                          <div key={img.id} className="rounded-xl overflow-hidden border border-gray-200 bg-white group hover:shadow-md transition-shadow">
                            <div className="aspect-[4/3] bg-gray-100">
                              <img src={img.url} alt={img.caption || ""} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-2">
                              {img.caption && <p className="text-[11px] text-gray-700 font-medium line-clamp-1">{img.caption}</p>}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {img.tags.map((t) => (
                                  <span key={t} className="px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-[8px] font-medium">{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No mood board images yet</p>
                  <p className="text-xs mt-1">Add images to individual sets to see them here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================== CONSTRUCTION TAB (KANBAN) =================== */}
        {activeTab === "construction" && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Kanban header */}
            <div className="px-5 py-3 bg-white border-b border-gray-200 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Construction Tracker</h2>
                <p className="text-xs text-gray-500">
                  {tasks.filter((t) => t.completed).length} of {tasks.length} tasks complete
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-[10px]">
                  {(["low", "medium", "high", "urgent"] as const).map((p) => (
                    <span key={p} className="flex items-center gap-1 text-gray-500 capitalize">
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} /> {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Kanban columns */}
            <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-3 p-5 h-full" style={{ minWidth: `${tasksByPhase.length * 260}px` }}>
                {tasksByPhase.map(({ phase, tasks: phaseTasks }) => {
                  const cfg = PHASE_CONFIG[phase]
                  const done = phaseTasks.filter((t) => t.completed).length
                  return (
                    <div key={phase} className={`w-60 shrink-0 flex flex-col rounded-xl border ${cfg.border} bg-white overflow-hidden`}>
                      {/* Column header */}
                      <div className={`px-3 py-2.5 ${cfg.bg} border-b ${cfg.border} shrink-0`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                          <span className={`text-[10px] font-semibold ${cfg.color}`}>
                            {done}/{phaseTasks.length}
                          </span>
                        </div>
                        {phaseTasks.length > 0 && (
                          <div className="w-full h-1 bg-gray-200 rounded-full mt-1.5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                phase === "carpentry" ? "bg-amber-500" :
                                phase === "paint" ? "bg-blue-500" :
                                phase === "rigging" ? "bg-orange-500" :
                                phase === "set-dec" ? "bg-purple-500" :
                                phase === "on-camera" ? "bg-green-500" :
                                "bg-gray-400"
                              }`}
                              style={{ width: phaseTasks.length > 0 ? `${(done / phaseTasks.length) * 100}%` : "0%" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Tasks */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {phaseTasks.map((task) => {
                          const taskSet = sets.find((s) => s.id === task.setId)
                          return (
                            <div
                              key={task.id}
                              className={`p-2.5 rounded-lg border transition-colors ${
                                task.completed ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() => toggleTaskComplete(task.id)}
                                  className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                                    task.completed
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                >
                                  {task.completed && <Check className="w-2.5 h-2.5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium leading-snug ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                                    {task.title}
                                  </p>
                                  {taskSet && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{taskSet.name}</p>
                                  )}
                                </div>
                                <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
                              </div>
                              {(task.assignedTo || task.dueDate || task.notes) && (
                                <div className="flex items-center flex-wrap gap-1.5 mt-2 ml-6">
                                  {task.assignedTo && (
                                    <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">{task.assignedTo}</span>
                                  )}
                                  {task.dueDate && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${
                                      task.dueDate < Date.now() && !task.completed
                                        ? "text-red-700 bg-red-50"
                                        : "text-gray-500 bg-gray-100"
                                    }`}>
                                      <Calendar className="w-2.5 h-2.5" /> {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  {task.notes && (
                                    <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Note
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {phaseTasks.length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-[10px] text-gray-300">No tasks</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================== LIGHTING TAB =================== */}
        {activeTab === "lighting" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Lighting & Practicals</h2>
              <p className="text-sm text-gray-500 mb-6">All fixtures across every set</p>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {(["practical", "motivated", "ambient", "effect"] as const).map((type) => {
                  const count = allLighting.filter((l) => l.type === type).length
                  const colorMap = {
                    practical: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", icon: "text-yellow-600" },
                    motivated: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", icon: "text-orange-600" },
                    ambient:   { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-800",   icon: "text-gray-500" },
                    effect:    { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     icon: "text-red-600" },
                  }
                  const c = colorMap[type]
                  return (
                    <div key={type} className={`${c.bg} border ${c.border} rounded-xl p-3.5`}>
                      <div className="flex items-center justify-between">
                        <Lightbulb className={`w-5 h-5 ${c.icon}`} />
                        <span className={`text-2xl font-bold ${c.text}`}>{count}</span>
                      </div>
                      <p className={`text-xs font-semibold ${c.text} capitalize mt-1`}>{type}</p>
                    </div>
                  )
                })}
              </div>

              {/* Fixtures by set */}
              {sets.filter((s) => s.lighting.length > 0).map((s) => (
                <div key={s.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{s.name}</h3>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_CONFIG[s.status].color} ${STATUS_CONFIG[s.status].bg}`}>
                      {STATUS_CONFIG[s.status].label}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {s.lighting.map((lf) => (
                      <div key={lf.id} className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          lf.type === "practical" ? "bg-yellow-50" :
                          lf.type === "motivated" ? "bg-orange-50" :
                          lf.type === "effect" ? "bg-red-50" :
                          "bg-gray-50"
                        }`}>
                          <Lightbulb className={`w-5 h-5 ${
                            lf.type === "practical" ? "text-yellow-600" :
                            lf.type === "motivated" ? "text-orange-600" :
                            lf.type === "effect" ? "text-red-600" :
                            "text-gray-500"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">{lf.name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              lf.type === "practical" ? "bg-yellow-50 text-yellow-700" :
                              lf.type === "motivated" ? "bg-orange-50 text-orange-700" :
                              lf.type === "effect" ? "bg-red-50 text-red-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {lf.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                            {lf.wattage && <span>{lf.wattage}</span>}
                            {lf.wattage && <span className="text-gray-300">|</span>}
                            <span className={lf.dimmable ? "text-emerald-600 font-medium" : "text-gray-400"}>
                              {lf.dimmable ? "Dimmable" : "Non-dimmable"}
                            </span>
                          </div>
                          {lf.notes && <p className="text-[11px] text-gray-400 mt-1 italic">{lf.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Collapsible Section Sub-Component
   ============================================================ */

function CollapsibleSection({
  title,
  icon,
  count,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  count: number
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-bold">{count}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && <div className="p-4 bg-gray-50/50">{children}</div>}
    </div>
  )
}
