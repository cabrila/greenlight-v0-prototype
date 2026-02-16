"use client"

import { useState, useMemo, useRef, useCallback, type DragEvent } from "react"
import {
  X,
  Plus,
  Search,
  MoreVertical,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronDown,
  Check,
  MapPin,
  Upload,
  Trash2,
  Pencil,
  Map,
  Building2,
  TreePine,
  Camera,
  Tag,
  Calendar,
  Clock,
  AlertTriangle,
  Sun,
  Volume2,
  Truck,
  Bath,
  Zap,
  Ruler,
  Users,
  Phone,
  Mail,
  Link,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import type {
  ProjectLocation,
  LocationType,
  LocationStatus,
  LocationMediaItem,
  LocationContact,
  LocationScheduleBlock,
  LocationBlackoutDate,
  LocationSceneTag,
} from "@/types/casting"

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LOCATION_STATUSES: { value: LocationStatus; label: string; color: string }[] = [
  { value: "scouted", label: "Scouted", color: "bg-blue-100 text-blue-700" },
  { value: "pending-approval", label: "Pending Approval", color: "bg-amber-100 text-amber-700" },
  { value: "secured", label: "Secured / Permitted", color: "bg-emerald-100 text-emerald-700" },
  { value: "burned", label: "Burned / Unavailable", color: "bg-red-100 text-red-700" },
]

const VIBE_TAG_OPTIONS = ["Gritty", "Modern", "Dystopian", "Posh", "1980s", "Industrial", "Rustic", "Gothic", "Futuristic", "Suburban", "Tropical", "Noir", "Vintage", "Minimalist", "Spooky", "Forest", "Urban", "Coastal"]

const LOAD_IN_OPTIONS = ["Ground floor", "Stairs only", "Freight elevator"]
const FLOOR_TYPE_OPTIONS = ["Concrete", "Wood", "Paintable", "Epoxy", "Sprung"]
const SOUND_RATING_OPTIONS = ["Soundproof", "Semi-soundproof", "Warehouse shell"]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function generateLocationCode(existing: ProjectLocation[]): string {
  const num = existing.length + 1
  return `LOC-${String(num).padStart(3, "0")}`
}

/* Mock lat/lng near a "production office" for distance calculations */
const OFFICE_LAT = 34.0522
const OFFICE_LNG = -118.2437
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* Parse a pasted Google Maps link for mock auto-fill */
function parseGoogleMapsLink(link: string): { lat: number; lng: number; address: string } | null {
  // Try /@lat,lng pattern
  const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), address: `${parseFloat(atMatch[1]).toFixed(4)}, ${parseFloat(atMatch[2]).toFixed(4)}` }
  // Try /place/ pattern
  const placeMatch = link.match(/\/place\/([^/@]+)/)
  if (placeMatch) {
    const name = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ")
    return { lat: OFFICE_LAT + (Math.random() - 0.5) * 0.1, lng: OFFICE_LNG + (Math.random() - 0.5) * 0.1, address: name }
  }
  // Try q= pattern
  const qMatch = link.match(/[?&]q=([^&]+)/)
  if (qMatch) {
    const coords = decodeURIComponent(qMatch[1]).split(",")
    if (coords.length === 2 && !isNaN(parseFloat(coords[0]))) return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]), address: `${coords[0]}, ${coords[1]}` }
    return { lat: OFFICE_LAT + (Math.random() - 0.5) * 0.1, lng: OFFICE_LNG + (Math.random() - 0.5) * 0.1, address: decodeURIComponent(qMatch[1]) }
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  Mock inventory data                                                */
/* ------------------------------------------------------------------ */

function generateMockLocations(): ProjectLocation[] {
  return [
    {
      id: "loc1", code: "LOC-001", name: "Hero House", locationType: "on-location", status: "secured",
      lat: 34.0622, lng: -118.3537, address: "742 Evergreen Terrace, Los Angeles, CA",
      vibeTags: ["Suburban", "1980s", "Vintage"], media: [{ id: "m1", url: "/placeholder.svg?height=200&width=300", type: "photo" }],
      notes: "Perfect mid-century home. Owner very cooperative.", dailyRate: "$3,500", overtimeRate: "$500/hr", securityDeposit: "$5,000",
      basecampParking: "Cul-de-sac, room for 4 trucks", crewParkingCapacity: 8, cateringArea: "Backyard patio",
      sunPathNotes: "Great morning light through east windows", noiseProfile: "Quiet residential, occasional dog barking",
      loadInDifficulty: "Ground floor", bathroomCount: 3, greenRoomCapability: "Master bedroom works well",
      makeupAreaSuitability: "Guest bathroom has great lighting",
      contacts: [{ id: "c1", role: "Owner", name: "Margaret Chen", phone: "(310) 555-0142", email: "mchen@email.com" }],
      sceneTags: [{ sceneNumber: "21", sceneTitle: "Family Dinner" }, { sceneNumber: "24" }, { sceneNumber: "55", sceneTitle: "Flashback" }],
      scheduleBlocks: [{ id: "sb1", type: "prep", startDate: "2026-03-10", endDate: "2026-03-11", notes: "Art dept dressing" }, { id: "sb2", type: "shoot", startDate: "2026-03-12", endDate: "2026-03-14" }, { id: "sb3", type: "strike", startDate: "2026-03-15", endDate: "2026-03-15" }],
      blackoutDates: [{ id: "bd1", date: "2026-03-20", reason: "Owner holiday party" }],
      bookedTo: null,
    },
    {
      id: "loc2", code: "LOC-002", name: "Neon Alley", locationType: "on-location", status: "scouted",
      lat: 34.0400, lng: -118.2500, address: "Downtown Arts District, Los Angeles, CA",
      vibeTags: ["Gritty", "Noir", "Urban", "Dystopian"], media: [{ id: "m2", url: "/placeholder.svg?height=200&width=300", type: "photo" }],
      notes: "Amazing neon signage at night. Permission needed from 3 businesses.", dailyRate: "$2,000", overtimeRate: "$300/hr", securityDeposit: "$1,500",
      basecampParking: "Public lot 2 blocks away", crewParkingCapacity: 4, cateringArea: "Tents in the alley",
      sunPathNotes: "Narrow alley, limited direct sun", noiseProfile: "Urban noise, nightclub bass on weekends",
      loadInDifficulty: "Ground floor",
      contacts: [{ id: "c2", role: "Site Rep", name: "Danny Vega", phone: "(213) 555-0199", email: "dvega@artsdistrict.com" }],
      sceneTags: [{ sceneNumber: "7", sceneTitle: "Chase Scene" }],
      scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc3", code: "LOC-003", name: "Studio A - Raleigh", locationType: "studio", status: "secured",
      lat: 34.0800, lng: -118.3700, address: "Raleigh Studios, 5300 Melrose Ave, Los Angeles, CA",
      vibeTags: ["Modern", "Minimalist"], media: [{ id: "m3", url: "/placeholder.svg?height=200&width=300", type: "photo" }],
      notes: "Stage 12. Full soundstage with green room.", dailyRate: "$8,500", overtimeRate: "$1,200/hr", securityDeposit: "$15,000",
      dimensionsL: 120, dimensionsW: 80, dimensionsH: 35, gridHeight: 30, floorType: "Concrete",
      amperage: "3-Phase, 400 Amps", camlockAvailable: true, soundRating: "Soundproof",
      workshopAccess: true, millSpace: true, paintShopProximity: "On-lot, Building 4",
      sceneTags: [{ sceneNumber: "1", sceneTitle: "Opening" }, { sceneNumber: "12" }, { sceneNumber: "30", sceneTitle: "Climax" }],
      scheduleBlocks: [{ id: "sb4", type: "prep", startDate: "2026-03-01", endDate: "2026-03-05" }, { id: "sb5", type: "shoot", startDate: "2026-03-06", endDate: "2026-03-20" }],
      blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc4", code: "LOC-004", name: "Abandoned Warehouse", locationType: "on-location", status: "pending-approval",
      lat: 33.9800, lng: -118.3000, address: "1400 Industrial Blvd, Inglewood, CA",
      vibeTags: ["Gritty", "Industrial", "Dystopian", "Spooky"], media: [{ id: "m4", url: "/placeholder.svg?height=200&width=300", type: "photo" }],
      notes: "Needs structural safety inspection. Incredible raw look.", dailyRate: "$1,200", overtimeRate: "$200/hr", securityDeposit: "$3,000",
      basecampParking: "Adjacent lot", crewParkingCapacity: 12, noiseProfile: "Flight path overhead, loud during peak hours",
      loadInDifficulty: "Ground floor", bathroomCount: 1,
      contacts: [{ id: "c3", role: "Owner", name: "Eastside Holdings LLC", phone: "(310) 555-0277", email: "permits@eastsideholdings.com" }],
      sceneTags: [{ sceneNumber: "42", sceneTitle: "Villain Lair" }],
      scheduleBlocks: [], blackoutDates: [{ id: "bd2", date: "2026-04-01", reason: "Building inspection" }],
      bookedTo: "Avatar 3",
    },
    {
      id: "loc5", code: "LOC-005", name: "Redwood Forest Clearing", locationType: "on-location", status: "scouted",
      lat: 37.8000, lng: -122.1800, address: "Muir Woods, Mill Valley, CA",
      vibeTags: ["Forest", "Gothic", "Spooky", "Rustic"], media: [{ id: "m5", url: "/placeholder.svg?height=200&width=300", type: "photo" }],
      notes: "National Park Service permit required. 6-week lead time.", dailyRate: "$500", overtimeRate: "$100/hr", securityDeposit: "$2,000",
      basecampParking: "Parking lot 0.5mi from set", crewParkingCapacity: 3,
      sunPathNotes: "Canopy blocks most direct sunlight, dappled light all day",
      noiseProfile: "Very quiet, occasional hikers",
      contacts: [{ id: "c4", role: "Site Rep", name: "Ranger Tom Whitfield", phone: "(415) 555-0333", email: "twhitfield@nps.gov" }],
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc6", code: "LOC-006", name: "Studio B - Build Stage", locationType: "studio", status: "scouted",
      lat: 34.1500, lng: -118.3400, address: "Universal Studios, 100 Universal City Plaza, CA",
      vibeTags: ["Futuristic", "Modern"], media: [{ id: "m6", url: "/placeholder.svg?height=200&width=300", type: "photo" }],
      notes: "Available for sci-fi build. Needs 4-week advance booking.", dailyRate: "$12,000", overtimeRate: "$1,800/hr", securityDeposit: "$25,000",
      dimensionsL: 150, dimensionsW: 100, dimensionsH: 45, gridHeight: 40, floorType: "Epoxy",
      amperage: "3-Phase, 600 Amps", camlockAvailable: true, soundRating: "Soundproof",
      workshopAccess: true, millSpace: true, paintShopProximity: "Adjacent building",
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Reusable form fields                                               */
/* ------------------------------------------------------------------ */

function FloatingField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 peer placeholder-transparent" placeholder={placeholder || label} />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="relative">
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none peer placeholder-transparent" placeholder={label} />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] | string[] }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none">
        <option value="">Select...</option>
        {opts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tag Picker                                                         */
/* ------------------------------------------------------------------ */

function TagPicker({ selected, onChange, options }: { selected: string[]; onChange: (tags: string[]) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((tag) => {
        const active = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(active ? selected.filter((t) => t !== tag) : [...selected, tag])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function LocationStatusBadge({ status }: { status: LocationStatus }) {
  const cfg = LOCATION_STATUSES.find((s) => s.value === status) || LOCATION_STATUSES[0]
  return <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
}

/* ------------------------------------------------------------------ */
/*  Mock Map Component                                                 */
/* ------------------------------------------------------------------ */

function MockMap({ locations, selectedId, onSelect }: { locations: ProjectLocation[]; selectedId: string | null; onSelect: (id: string) => void }) {
  /* Renders a stylised placeholder map with dot markers */
  const bounds = useMemo(() => {
    if (locations.length === 0) return { minLat: 33.8, maxLat: 34.3, minLng: -118.6, maxLng: -118.0 }
    const lats = locations.map((l) => l.lat)
    const lngs = locations.map((l) => l.lng)
    const pad = 0.05
    return { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad }
  }, [locations])

  const toPercent = (lat: number, lng: number) => ({
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100,
  })

  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-50 via-sky-50 to-blue-100 rounded-xl border border-gray-200 relative overflow-hidden">
      {/* Grid lines for map feel */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#mapgrid)" />
      </svg>
      {/* Road-like lines */}
      <div className="absolute inset-0">
        <div className="absolute top-[30%] left-0 right-0 h-px bg-gray-300/40" />
        <div className="absolute top-[60%] left-0 right-0 h-px bg-gray-300/40" />
        <div className="absolute left-[25%] top-0 bottom-0 w-px bg-gray-300/40" />
        <div className="absolute left-[65%] top-0 bottom-0 w-px bg-gray-300/40" />
      </div>
      {/* Markers */}
      {locations.map((loc) => {
        const pos = toPercent(loc.lat, loc.lng)
        const isSelected = loc.id === selectedId
        const statusColor = loc.status === "secured" ? "bg-emerald-500" : loc.status === "scouted" ? "bg-blue-500" : loc.status === "pending-approval" ? "bg-amber-500" : "bg-red-500"
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 group z-10 ${isSelected ? "z-20" : ""}`}
            style={{ left: `${Math.min(Math.max(pos.x, 5), 95)}%`, top: `${Math.min(Math.max(pos.y, 5), 95)}%` }}
            title={`${loc.code} - ${loc.name}`}
          >
            <div className={`relative flex items-center justify-center ${isSelected ? "scale-125" : "hover:scale-110"} transition-transform`}>
              <div className={`w-7 h-7 rounded-full ${statusColor} shadow-lg flex items-center justify-center ${isSelected ? "ring-3 ring-white ring-offset-1" : ""}`}>
                {loc.locationType === "studio" ? <Building2 className="w-3.5 h-3.5 text-white" /> : <MapPin className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900/80 text-white text-[9px] px-1.5 py-0.5 rounded ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity pointer-events-none`}>
                {loc.code}
              </div>
            </div>
          </button>
        )
      })}
      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg px-2.5 py-1.5 text-[9px] flex flex-col gap-1 backdrop-blur-sm border border-gray-200/60">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-gray-600">Secured</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-gray-600">Scouted</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-gray-600">Pending</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-gray-600">Burned</span></div>
      </div>
      {/* Mock "Map" watermark */}
      <div className="absolute top-2 left-2 bg-white/80 rounded-md px-2 py-1 text-[10px] text-gray-400 font-medium flex items-center gap-1 backdrop-blur-sm border border-gray-200/50">
        <Map className="w-3 h-3" /> Mock Map View
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Gantt-lite Schedule View                                           */
/* ------------------------------------------------------------------ */

function GanttSchedule({ blocks, blackoutDates }: { blocks: LocationScheduleBlock[]; blackoutDates: LocationBlackoutDate[] }) {
  if (blocks.length === 0 && blackoutDates.length === 0) return <p className="text-xs text-gray-400 italic">No schedule set</p>

  const typeColors: Record<string, string> = { prep: "bg-amber-400", shoot: "bg-emerald-500", strike: "bg-blue-400" }
  const typeLabels: Record<string, string> = { prep: "Prep", shoot: "Shoot", strike: "Strike" }

  return (
    <div className="space-y-1.5">
      {blocks.map((b) => {
        const days = Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000) + 1)
        return (
          <div key={b.id} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-10 shrink-0 font-medium">{typeLabels[b.type]}</span>
            <div className={`h-5 rounded-md ${typeColors[b.type]} flex items-center px-2 min-w-[60px]`} style={{ width: `${Math.min(days * 24, 200)}px` }}>
              <span className="text-[9px] text-white font-medium truncate">{b.startDate.slice(5)} - {b.endDate.slice(5)}</span>
            </div>
            <span className="text-[10px] text-gray-400">{days}d</span>
          </div>
        )
      })}
      {blackoutDates.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-red-500 w-10 shrink-0 font-medium flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Block</span>
          <div className="flex flex-wrap gap-1">
            {blackoutDates.map((bd) => (
              <span key={bd.id} className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-medium rounded-full">
                {bd.date.slice(5)} {bd.reason ? `- ${bd.reason}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Photo Drop Zone                                                    */
/* ------------------------------------------------------------------ */

function PhotoDropZone({ media, onAdd }: { media: LocationMediaItem[]; onAdd: (items: LocationMediaItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFiles = async (files: FileList | File[]) => {
    const items: LocationMediaItem[] = []
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const url = await readFileAsDataUrl(file)
        items.push({ id: uid(), url, type: "photo" })
      }
    }
    if (items.length > 0) onAdd(items)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {media.map((m) => (
          <div key={m.id} className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img src={m.url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
        onDrop={async (e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDragOver ? "border-teal-400 bg-teal-50" : "border-gray-300 hover:border-teal-300 hover:bg-gray-50"}`}
      >
        <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
        <p className="text-xs text-gray-500">Drop scouting photos here or click to upload</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = "" }} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add Location Modal                                                 */
/* ------------------------------------------------------------------ */

function AddLocationModal({ onClose, onAdd, existingLocations }: { onClose: () => void; onAdd: (loc: ProjectLocation) => void; existingLocations: ProjectLocation[] }) {
  const [locType, setLocType] = useState<LocationType>("on-location")
  const [mapsLink, setMapsLink] = useState("")
  const [mapsAutoFilled, setMapsAutoFilled] = useState(false)
  const [form, setForm] = useState({
    name: "", address: "", lat: "", lng: "",
    notes: "", dailyRate: "", overtimeRate: "", securityDeposit: "",
    /* on-location */
    basecampParking: "", crewParkingCapacity: "", cateringArea: "",
    sunPathNotes: "", noiseProfile: "", loadInDifficulty: "",
    bathroomCount: "", greenRoomCapability: "", makeupAreaSuitability: "",
    /* studio */
    dimL: "", dimW: "", dimH: "", gridHeight: "", floorType: "",
    amperage: "", soundRating: "",
  })
  const [vibeTags, setVibeTags] = useState<string[]>([])
  const [media, setMedia] = useState<LocationMediaItem[]>([])
  const [camlockAvailable, setCamlockAvailable] = useState(false)
  const [workshopAccess, setWorkshopAccess] = useState(false)
  const [millSpace, setMillSpace] = useState(false)

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleParseMapsLink = () => {
    const result = parseGoogleMapsLink(mapsLink)
    if (result) {
      setForm((f) => ({ ...f, lat: String(result.lat), lng: String(result.lng), address: result.address || f.address }))
      setMapsAutoFilled(true)
    }
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const loc: ProjectLocation = {
      id: `loc-${uid()}`, code: generateLocationCode(existingLocations), name: form.name,
      locationType: locType, status: "scouted",
      lat: parseFloat(form.lat) || OFFICE_LAT + (Math.random() - 0.5) * 0.1,
      lng: parseFloat(form.lng) || OFFICE_LNG + (Math.random() - 0.5) * 0.1,
      address: form.address, vibeTags, media, notes: form.notes,
      dailyRate: form.dailyRate || "$0", overtimeRate: form.overtimeRate || "$0", securityDeposit: form.securityDeposit || "$0",
      ...(locType === "on-location" ? {
        basecampParking: form.basecampParking, crewParkingCapacity: parseInt(form.crewParkingCapacity) || undefined,
        cateringArea: form.cateringArea, sunPathNotes: form.sunPathNotes, noiseProfile: form.noiseProfile,
        loadInDifficulty: form.loadInDifficulty, bathroomCount: parseInt(form.bathroomCount) || undefined,
        greenRoomCapability: form.greenRoomCapability, makeupAreaSuitability: form.makeupAreaSuitability,
        contacts: [],
      } : {
        dimensionsL: parseFloat(form.dimL) || undefined, dimensionsW: parseFloat(form.dimW) || undefined,
        dimensionsH: parseFloat(form.dimH) || undefined, gridHeight: parseFloat(form.gridHeight) || undefined,
        floorType: form.floorType, amperage: form.amperage, camlockAvailable,
        soundRating: form.soundRating, workshopAccess, millSpace,
      }),
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    }
    onAdd(loc)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Location</h2>
              <p className="text-sm text-gray-500 mt-0.5">Scout a new filming location</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Type toggle */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Location Type</p>
            <div className="flex gap-2">
              <button onClick={() => setLocType("on-location")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${locType === "on-location" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                <TreePine className="w-4 h-4" /> On-Location
              </button>
              <button onClick={() => setLocType("studio")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${locType === "studio" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
                <Building2 className="w-4 h-4" /> Studio / Build
              </button>
            </div>
          </div>

          {/* Google Maps paste */}
          {locType === "on-location" && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Link className="w-3 h-3" /> Paste a Google Maps Link (auto-fills address & coordinates)</p>
              <div className="flex gap-2">
                <input
                  type="text" value={mapsLink} onChange={(e) => { setMapsLink(e.target.value); setMapsAutoFilled(false) }}
                  placeholder="https://maps.google.com/..."
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400"
                />
                <button onClick={handleParseMapsLink} disabled={!mapsLink.trim()} className="px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Auto-Fill
                </button>
              </div>
              {mapsAutoFilled && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Address and coordinates auto-filled</p>}
            </div>
          )}

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Location Name" value={form.name} onChange={(v) => update("name", v)} />
            <FloatingField label="Address" value={form.address} onChange={(v) => update("address", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Latitude" value={form.lat} onChange={(v) => update("lat", v)} type="number" />
            <FloatingField label="Longitude" value={form.lng} onChange={(v) => update("lng", v)} type="number" />
          </div>

          {/* Vibe tags */}
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Vibe Tags</p>
            <TagPicker selected={vibeTags} onChange={setVibeTags} options={VIBE_TAG_OPTIONS} />
          </div>

          {/* Media */}
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Scouting Photos</p>
            <PhotoDropZone media={media} onAdd={(items) => setMedia((prev) => [...prev, ...items])} />
          </div>

          {/* Notes */}
          <FloatingTextarea label="Notes" value={form.notes} onChange={(v) => update("notes", v)} />

          {/* Costing */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Costing</h3>
            <p className="text-xs text-gray-500 mb-3">Daily rates and deposits.</p>
            <div className="grid grid-cols-3 gap-4">
              <FloatingField label="Daily Rate" value={form.dailyRate} onChange={(v) => update("dailyRate", v)} placeholder="$0" />
              <FloatingField label="Overtime Rate" value={form.overtimeRate} onChange={(v) => update("overtimeRate", v)} placeholder="$0/hr" />
              <FloatingField label="Security Deposit" value={form.securityDeposit} onChange={(v) => update("securityDeposit", v)} placeholder="$0" />
            </div>
          </div>

          {/* Type-specific fields */}
          {locType === "on-location" ? (
            <>
              <div>
                <h3 className="text-base font-bold text-gray-900">Logistics & Environment</h3>
                <p className="text-xs text-gray-500 mb-3">On-location specifics for the crew.</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FloatingField label="Basecamp Parking" value={form.basecampParking} onChange={(v) => update("basecampParking", v)} />
                  <FloatingField label="Crew Parking Capacity (trucks)" value={form.crewParkingCapacity} onChange={(v) => update("crewParkingCapacity", v)} type="number" />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FloatingField label="Sun Path Notes" value={form.sunPathNotes} onChange={(v) => update("sunPathNotes", v)} />
                  <FloatingField label="Noise Profile" value={form.noiseProfile} onChange={(v) => update("noiseProfile", v)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FloatingSelect label="Load-in Difficulty" value={form.loadInDifficulty} onChange={(v) => update("loadInDifficulty", v)} options={LOAD_IN_OPTIONS} />
                  <FloatingField label="Bathrooms" value={form.bathroomCount} onChange={(v) => update("bathroomCount", v)} type="number" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-base font-bold text-gray-900">Technical Specs</h3>
                <p className="text-xs text-gray-500 mb-3">Stage dimensions and power.</p>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <FloatingField label="Length (ft)" value={form.dimL} onChange={(v) => update("dimL", v)} type="number" />
                  <FloatingField label="Width (ft)" value={form.dimW} onChange={(v) => update("dimW", v)} type="number" />
                  <FloatingField label="Height (ft)" value={form.dimH} onChange={(v) => update("dimH", v)} type="number" />
                  <FloatingField label="Grid Height (ft)" value={form.gridHeight} onChange={(v) => update("gridHeight", v)} type="number" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <FloatingSelect label="Floor Type" value={form.floorType} onChange={(v) => update("floorType", v)} options={FLOOR_TYPE_OPTIONS} />
                  <FloatingField label="Amperage" value={form.amperage} onChange={(v) => update("amperage", v)} placeholder="e.g. 3-Phase, 400 Amps" />
                  <FloatingSelect label="Sound Rating" value={form.soundRating} onChange={(v) => update("soundRating", v)} options={SOUND_RATING_OPTIONS} />
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Camlock Available", value: camlockAvailable, set: setCamlockAvailable },
                    { label: "Workshop Access", value: workshopAccess, set: setWorkshopAccess },
                    { label: "Mill Space", value: millSpace, set: setMillSpace },
                  ].map((opt) => (
                    <button key={opt.label} type="button" onClick={() => opt.set(!opt.value)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${opt.value ? "bg-teal-50 border-teal-300 text-teal-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${opt.value ? "bg-teal-600 border-teal-600" : "border-gray-300"}`}>
                        {opt.value && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={!form.name.trim()} className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              Add Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Location Modal                                                */
/* ------------------------------------------------------------------ */

function EditLocationModal({ location, onClose, onSave }: { location: ProjectLocation; onClose: () => void; onSave: (updated: ProjectLocation) => void }) {
  const [form, setForm] = useState({
    name: location.name, address: location.address, notes: location.notes,
    dailyRate: location.dailyRate, overtimeRate: location.overtimeRate, securityDeposit: location.securityDeposit,
    status: location.status as string,
  })
  const [vibeTags, setVibeTags] = useState(location.vibeTags)
  const [sceneTags, setSceneTags] = useState(location.sceneTags)
  const [newSceneNumber, setNewSceneNumber] = useState("")
  const [scheduleBlocks, setScheduleBlocks] = useState(location.scheduleBlocks)
  const [blackoutDates, setBlackoutDates] = useState(location.blackoutDates)

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSave = () => {
    onSave({
      ...location,
      ...form,
      status: form.status as LocationStatus,
      vibeTags, sceneTags, scheduleBlocks, blackoutDates,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Location</h2>
              <p className="text-sm text-gray-500 mt-0.5">{location.code} - {location.name}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Location Name" value={form.name} onChange={(v) => update("name", v)} />
            <FloatingSelect label="Status" value={form.status} onChange={(v) => update("status", v)} options={LOCATION_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          </div>
          <FloatingField label="Address" value={form.address} onChange={(v) => update("address", v)} />
          <FloatingTextarea label="Notes" value={form.notes} onChange={(v) => update("notes", v)} />

          {/* Vibe Tags */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Vibe Tags</h3>
            <p className="text-xs text-gray-500 mb-2">Define the visual feel of this location.</p>
            <TagPicker selected={vibeTags} onChange={setVibeTags} options={VIBE_TAG_OPTIONS} />
          </div>

          {/* Costing */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Costing</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FloatingField label="Daily Rate" value={form.dailyRate} onChange={(v) => update("dailyRate", v)} />
              <FloatingField label="Overtime Rate" value={form.overtimeRate} onChange={(v) => update("overtimeRate", v)} />
              <FloatingField label="Security Deposit" value={form.securityDeposit} onChange={(v) => update("securityDeposit", v)} />
            </div>
          </div>

          {/* Scene Tags */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Scene Assignments</h3>
            <p className="text-xs text-gray-500 mb-2">Tag this location to specific scene numbers.</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {sceneTags.map((st) => (
                <span key={st.sceneNumber} className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                  Sc. {st.sceneNumber}{st.sceneTitle ? ` - ${st.sceneTitle}` : ""}
                  <button onClick={() => setSceneTags((prev) => prev.filter((s) => s.sceneNumber !== st.sceneNumber))} className="hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSceneNumber} onChange={(e) => setNewSceneNumber(e.target.value)} placeholder="Scene # (e.g. 21)" className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder-gray-400 w-40" />
              <button onClick={() => { if (newSceneNumber.trim()) { setSceneTags((p) => [...p, { sceneNumber: newSceneNumber.trim() }]); setNewSceneNumber("") } }} disabled={!newSceneNumber.trim()} className="px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50">Add Scene</button>
            </div>
          </div>

          {/* Schedule Blocks */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Schedule</h3>
            <p className="text-xs text-gray-500 mb-2">Prep, Shoot, and Strike days.</p>
            {scheduleBlocks.map((b, idx) => (
              <div key={b.id} className="flex items-center gap-2 mb-2">
                <select value={b.type} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, type: e.target.value as any }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none w-24">
                  <option value="prep">Prep</option><option value="shoot">Shoot</option><option value="strike">Strike</option>
                </select>
                <input type="date" value={b.startDate} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, startDate: e.target.value }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <span className="text-xs text-gray-400">to</span>
                <input type="date" value={b.endDate} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, endDate: e.target.value }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button onClick={() => setScheduleBlocks((p) => p.filter((s) => s.id !== b.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setScheduleBlocks((p) => [...p, { id: uid(), type: "shoot", startDate: "", endDate: "", notes: "" }])} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors mt-1">
              <Plus className="w-3 h-3" /> Add Block
            </button>
          </div>

          {/* Blackout Dates */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Blackout Dates</h3>
            <p className="text-xs text-gray-500 mb-2">Dates when the location is unavailable.</p>
            {blackoutDates.map((bd, idx) => (
              <div key={bd.id} className="flex items-center gap-2 mb-2">
                <input type="date" value={bd.date} onChange={(e) => { const u = [...blackoutDates]; u[idx] = { ...bd, date: e.target.value }; setBlackoutDates(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <input type="text" value={bd.reason || ""} onChange={(e) => { const u = [...blackoutDates]; u[idx] = { ...bd, reason: e.target.value }; setBlackoutDates(u) }} placeholder="Reason" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
                <button onClick={() => setBlackoutDates((p) => p.filter((d) => d.id !== bd.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setBlackoutDates((p) => [...p, { id: uid(), date: "", reason: "" }])} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors mt-1">
              <Plus className="w-3 h-3" /> Add Blackout Date
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Location Card                                                      */
/* ------------------------------------------------------------------ */

function LocationCard({ loc, isInProject, onToggleAdd, onEdit, onDelete, hasProject }: { loc: ProjectLocation; isInProject: boolean; onToggleAdd: (id: string) => void; onEdit: (loc: ProjectLocation) => void; onDelete: (id: string) => void; hasProject: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isBooked = !!loc.bookedTo
  const dist = haversineDistance(OFFICE_LAT, OFFICE_LNG, loc.lat, loc.lng)

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden group ${isInProject ? "border-teal-300 ring-1 ring-teal-200" : isBooked ? "border-orange-200 bg-orange-50/30" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
      {/* Thumbnail */}
      <div className="relative h-32 bg-gray-100 overflow-hidden">
        {loc.media.length > 0 ? (
          <img src={loc.media[0].url} alt={loc.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MapPin className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="bg-gray-900/70 text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">{loc.code}</span>
          <LocationStatusBadge status={loc.status} />
        </div>
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm ${loc.locationType === "studio" ? "bg-purple-100/90 text-purple-700" : "bg-sky-100/90 text-sky-700"}`}>
            {loc.locationType === "studio" ? <Building2 className="w-2.5 h-2.5" /> : <TreePine className="w-2.5 h-2.5" />}
            {loc.locationType === "studio" ? "Studio" : "On-Location"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{loc.name}</h3>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors shrink-0"><MoreVertical className="w-4 h-4" /></button>
            {menuOpen && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                <button onClick={() => { onEdit(loc); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Edit details</button>
                <button onClick={() => { onToggleAdd(loc.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">{isInProject ? "Remove from project" : "Add to project"}</button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={() => { onDelete(loc.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{loc.address}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{dist.toFixed(1)} mi from office</p>

        {/* Tags */}
        {loc.vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {loc.vibeTags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded-md font-medium">{t}</span>
            ))}
            {loc.vibeTags.length > 3 && <span className="text-[9px] text-gray-400">+{loc.vibeTags.length - 3}</span>}
          </div>
        )}

        {/* Scene tags */}
        {loc.sceneTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {loc.sceneTags.map((st) => (
              <span key={st.sceneNumber} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[9px] rounded-md font-medium">Sc.{st.sceneNumber}</span>
            ))}
          </div>
        )}

        {/* Schedule mini bar */}
        {loc.scheduleBlocks.length > 0 && (
          <div className="mt-2">
            <GanttSchedule blocks={loc.scheduleBlocks} blackoutDates={loc.blackoutDates} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex items-center justify-between">
        {isBooked ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {loc.bookedTo}</span>
        ) : isInProject ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> In Project</span>
        ) : (
          <button onClick={() => onToggleAdd(loc.id)} disabled={!hasProject} title={!hasProject ? "Create or open a project first" : "Add to project"} className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus className="w-3 h-3" /> Add to project
          </button>
        )}
        <span className="text-[10px] text-gray-400 font-medium">{loc.dailyRate}/day</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

interface LocationsModalProps {
  onClose: () => void
}

export default function LocationsModal({ onClose }: LocationsModalProps) {
  const { state, dispatch } = useCasting()
  const projectId = state.currentFocus.currentProjectId
  const currentProject = projectId ? state.projects.find((p) => p.id === projectId) ?? null : null

  /* Global location inventory (component state) */
  const [inventory, setInventory] = useState<ProjectLocation[]>(generateMockLocations)

  /* Project locations (persisted via context) */
  const projectLocations: ProjectLocation[] = currentProject?.locations || []
  const projectLocRef = useRef(projectLocations)
  projectLocRef.current = projectLocations

  const syncProjectLocations = useCallback(
    (updater: (prev: ProjectLocation[]) => ProjectLocation[]) => {
      if (!projectId) return
      const next = updater(projectLocRef.current)
      dispatch({ type: "SET_PROJECT_LOCATIONS", payload: { projectId, locations: next } })
    },
    [projectId, dispatch],
  )

  /* UI State */
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "project">("all")
  const [viewMode, setViewMode] = useState<"grid" | "split">("split")
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<"" | "on-location" | "studio">("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState("")
  const [maxDistance, setMaxDistance] = useState("")
  const [hasPower, setHasPower] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<ProjectLocation | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteSource, setConfirmDeleteSource] = useState<"inventory" | "project">("inventory")
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)

  const projectLocIds = useMemo(() => new Set(projectLocations.map((l) => l.id)), [projectLocations])

  /* Filtering */
  const applyFilters = useCallback((items: ProjectLocation[]) => {
    let filtered = items
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter((l) =>
        l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) ||
        l.vibeTags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (typeFilter) filtered = filtered.filter((l) => l.locationType === typeFilter)
    if (statusFilter) filtered = filtered.filter((l) => l.status === statusFilter)
    if (tagFilter) filtered = filtered.filter((l) => l.vibeTags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase())))
    if (maxDistance) {
      const d = parseFloat(maxDistance)
      if (!isNaN(d)) filtered = filtered.filter((l) => haversineDistance(OFFICE_LAT, OFFICE_LNG, l.lat, l.lng) <= d)
    }
    if (hasPower) filtered = filtered.filter((l) => l.amperage && l.amperage.includes("3-Phase"))
    return filtered
  }, [searchTerm, typeFilter, statusFilter, tagFilter, maxDistance, hasPower])

  const filteredInventory = useMemo(() => applyFilters(inventory), [inventory, applyFilters])
  const filteredProjectLocs = useMemo(() => applyFilters(projectLocations), [projectLocations, applyFilters])

  const displayLocations = activeTab === "project" ? filteredProjectLocs : filteredInventory

  /* Handlers */
  const handleToggleAdd = (id: string) => {
    if (!projectId) return
    if (projectLocIds.has(id)) {
      syncProjectLocations((prev) => prev.filter((l) => l.id !== id))
    } else {
      const inv = inventory.find((l) => l.id === id)
      if (!inv) return
      syncProjectLocations((prev) => [...prev, { ...inv }])
    }
  }

  const handleAddLocation = (loc: ProjectLocation) => {
    setInventory((prev) => [loc, ...prev])
  }

  const handleSaveEdit = (updated: ProjectLocation) => {
    setInventory((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    if (projectLocIds.has(updated.id)) {
      syncProjectLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    }
    setEditingLocation(null)
  }

  const handleRequestDelete = (id: string, source: "inventory" | "project") => {
    setConfirmDeleteId(id)
    setConfirmDeleteSource(source)
  }

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    if (confirmDeleteSource === "inventory") {
      setInventory((prev) => prev.filter((l) => l.id !== confirmDeleteId))
      if (projectLocIds.has(confirmDeleteId)) syncProjectLocations((prev) => prev.filter((l) => l.id !== confirmDeleteId))
    } else {
      syncProjectLocations((prev) => prev.filter((l) => l.id !== confirmDeleteId))
    }
    setConfirmDeleteId(null)
  }

  const isProjectTab = activeTab === "project"

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-8 w-auto" />
          <div className="inline-flex items-center bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">Locations</div>
          {currentProject ? (
            <span className="hidden sm:inline text-sm text-gray-500">{currentProject.name}</span>
          ) : (
            <span className="hidden sm:inline text-sm text-amber-600 font-medium">No project selected</span>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"><X className="w-5 h-5" /></button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setActiveTab("all")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All Locations</button>
          <button onClick={() => setActiveTab("project")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === "project" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            My Project
            {projectLocations.length > 0 && <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{projectLocations.length}</span>}
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setViewMode("split")} className={`p-1.5 rounded-md transition-colors ${viewMode === "split" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`} title="Split view"><Map className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`} title="Grid view"><Grid3X3 className="w-4 h-4" /></button>
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-lg border transition-colors ${showFilters ? "border-teal-300 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`} title="Filters">
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search locations, tags..." className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder-gray-400 text-gray-900" />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Smart Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 bg-white border-b border-gray-200 shrink-0">
          <span className="text-xs text-gray-500 shrink-0">Filters:</span>
          {/* Type */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTypeFilter("")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>All</button>
            <button onClick={() => setTypeFilter("on-location")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "on-location" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>On-Location</button>
            <button onClick={() => setTypeFilter("studio")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "studio" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Studio</button>
          </div>
          {/* Status */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Any Status</option>
            {LOCATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {/* Distance */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500">Within</span>
            <input type="number" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} placeholder="mi" className="w-16 px-2 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
            <span className="text-[11px] text-gray-500">mi of office</span>
          </div>
          {/* Tag search */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <input type="text" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Vibe tag..." className="w-24 px-2 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
          </div>
          {/* 3-Phase Power */}
          <button onClick={() => setHasPower(!hasPower)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${hasPower ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            <Zap className="w-3 h-3" /> 3-Phase Power
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === "split" ? (
          /* Split view: list on left, map on right */
          <>
            <div className="w-1/2 lg:w-[45%] overflow-y-auto p-4 border-r border-gray-200">
              {isProjectTab && !projectId ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No project selected</p>
                  <p className="text-gray-400 text-xs mt-1">Create or open a project first</p>
                </div>
              ) : displayLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">{isProjectTab ? "No locations in project" : "No locations found"}</p>
                  <p className="text-gray-400 text-xs mt-1">{isProjectTab ? "Browse All Locations to add some" : "Try adjusting your search or filters"}</p>
                  {isProjectTab && (
                    <button onClick={() => setActiveTab("all")} className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">Browse All Locations</button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayLocations.map((loc) => (
                    <LocationCard
                      key={loc.id} loc={loc}
                      isInProject={projectLocIds.has(loc.id)}
                      onToggleAdd={handleToggleAdd}
                      onEdit={(l) => setEditingLocation(l)}
                      onDelete={(id) => handleRequestDelete(id, isProjectTab ? "project" : "inventory")}
                      hasProject={!!projectId}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <MockMap locations={displayLocations} selectedId={selectedMapId} onSelect={setSelectedMapId} />
            </div>
          </>
        ) : (
          /* Grid view */
          <div className="flex-1 overflow-y-auto p-5">
            {isProjectTab && !projectId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium">No project selected</p>
                <p className="text-gray-400 text-xs mt-1">Create or open a project first</p>
              </div>
            ) : displayLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-medium">{isProjectTab ? "No locations in project" : "No locations found"}</p>
                <p className="text-gray-400 text-xs mt-1">{isProjectTab ? "Browse All Locations to add some" : "Try adjusting your search or filters"}</p>
                {isProjectTab && (
                  <button onClick={() => setActiveTab("all")} className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">Browse All Locations</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayLocations.map((loc) => (
                  <LocationCard
                    key={loc.id} loc={loc}
                    isInProject={projectLocIds.has(loc.id)}
                    onToggleAdd={handleToggleAdd}
                    onEdit={(l) => setEditingLocation(l)}
                    onDelete={(id) => handleRequestDelete(id, isProjectTab ? "project" : "inventory")}
                    hasProject={!!projectId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-modals */}
      {showAddModal && <AddLocationModal onClose={() => setShowAddModal(false)} onAdd={handleAddLocation} existingLocations={inventory} />}
      {editingLocation && <EditLocationModal location={editingLocation} onClose={() => setEditingLocation(null)} onSave={handleSaveEdit} />}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">Delete Location</h3>
              <p className="text-sm text-gray-500 text-center mt-2">Are you sure you want to delete this location? This action cannot be undone.</p>
            </div>
            <div className="flex border-t border-gray-200">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <div className="w-px bg-gray-200" />
              <button onClick={handleConfirmDelete} className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
