"use client"

import { useState, useMemo, useRef, useCallback, useEffect, type DragEvent } from "react"
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
  Cloud,
  CloudRain,
  Wind,
  Volume2,
  Truck,
  Zap,
  Ruler,
  Users,
  Phone,
  Mail,
  Link,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Thermometer,
  Droplets,
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

/* Mock weather data per location */
const MOCK_WEATHER: Record<string, { temp: string; condition: "sunny" | "cloudy" | "rainy" | "windy"; humidity: string }> = {
  loc1: { temp: "72F", condition: "sunny", humidity: "45%" },
  loc2: { temp: "68F", condition: "cloudy", humidity: "58%" },
  loc3: { temp: "65F", condition: "sunny", humidity: "40%" },
  loc4: { temp: "70F", condition: "windy", humidity: "52%" },
  loc5: { temp: "58F", condition: "rainy", humidity: "78%" },
  loc6: { temp: "66F", condition: "sunny", humidity: "42%" },
}

function getWeather(id: string) {
  return MOCK_WEATHER[id] || { temp: `${Math.floor(60 + Math.random() * 20)}F`, condition: "sunny" as const, humidity: `${Math.floor(35 + Math.random() * 40)}%` }
}

function WeatherIcon({ condition }: { condition: string }) {
  switch (condition) {
    case "sunny": return <Sun className="w-3.5 h-3.5 text-amber-500" />
    case "cloudy": return <Cloud className="w-3.5 h-3.5 text-gray-400" />
    case "rainy": return <CloudRain className="w-3.5 h-3.5 text-blue-400" />
    case "windy": return <Wind className="w-3.5 h-3.5 text-sky-400" />
    default: return <Sun className="w-3.5 h-3.5 text-amber-500" />
  }
}

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

const OFFICE_LAT = 34.0522
const OFFICE_LNG = -118.2437
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function parseGoogleMapsLink(link: string): { lat: number; lng: number; address: string } | null {
  const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), address: `${parseFloat(atMatch[1]).toFixed(4)}, ${parseFloat(atMatch[2]).toFixed(4)}` }
  const placeMatch = link.match(/\/place\/([^/@]+)/)
  if (placeMatch) {
    const name = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ")
    return { lat: OFFICE_LAT + (Math.random() - 0.5) * 0.1, lng: OFFICE_LNG + (Math.random() - 0.5) * 0.1, address: name }
  }
  const qMatch = link.match(/[?&]q=([^&]+)/)
  if (qMatch) {
    const coords = decodeURIComponent(qMatch[1]).split(",")
    if (coords.length === 2 && !isNaN(parseFloat(coords[0]))) return { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]), address: `${coords[0]}, ${coords[1]}` }
    return { lat: OFFICE_LAT + (Math.random() - 0.5) * 0.1, lng: OFFICE_LNG + (Math.random() - 0.5) * 0.1, address: decodeURIComponent(qMatch[1]) }
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  Mock inventory                                                     */
/* ------------------------------------------------------------------ */

function generateMockLocations(): ProjectLocation[] {
  return [
    {
      id: "loc1", code: "LOC-001", name: "Hero House", locationType: "on-location", status: "secured",
      lat: 34.0622, lng: -118.3537, address: "742 Evergreen Terrace, Los Angeles, CA",
      vibeTags: ["Suburban", "1980s", "Vintage"],
      media: [
        { id: "m1a", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Front exterior" },
        { id: "m1b", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Kitchen" },
        { id: "m1c", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Living room" },
        { id: "m1d", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Backyard" },
      ],
      notes: "Perfect mid-century home. Owner very cooperative.", dailyRate: "$3,500", overtimeRate: "$500/hr", securityDeposit: "$5,000",
      basecampParking: "Cul-de-sac, room for 4 trucks", crewParkingCapacity: 8, cateringArea: "Backyard patio",
      sunPathNotes: "Great morning light through east windows", noiseProfile: "Quiet residential",
      loadInDifficulty: "Ground floor", bathroomCount: 3, greenRoomCapability: "Master bedroom",
      makeupAreaSuitability: "Guest bathroom has great lighting",
      contacts: [{ id: "c1", role: "Owner", name: "Margaret Chen", phone: "(310) 555-0142", email: "mchen@email.com" }],
      sceneTags: [{ sceneNumber: "21", sceneTitle: "Family Dinner" }, { sceneNumber: "24" }, { sceneNumber: "55", sceneTitle: "Flashback" }],
      scheduleBlocks: [{ id: "sb1", type: "prep", startDate: "2026-03-10", endDate: "2026-03-11", notes: "Art dept" }, { id: "sb2", type: "shoot", startDate: "2026-03-12", endDate: "2026-03-14" }],
      blackoutDates: [{ id: "bd1", date: "2026-03-20", reason: "Owner holiday" }],
      bookedTo: null,
    },
    {
      id: "loc2", code: "LOC-002", name: "Neon Alley", locationType: "on-location", status: "scouted",
      lat: 34.0400, lng: -118.2500, address: "Downtown Arts District, Los Angeles, CA",
      vibeTags: ["Gritty", "Noir", "Urban", "Dystopian"],
      media: [
        { id: "m2a", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Neon signs at night" },
        { id: "m2b", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Alley view" },
        { id: "m2c", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Side entrance" },
      ],
      notes: "Amazing neon signage at night. Permission needed from 3 businesses.", dailyRate: "$2,000", overtimeRate: "$300/hr", securityDeposit: "$1,500",
      basecampParking: "Public lot 2 blocks away", crewParkingCapacity: 4, noiseProfile: "Urban noise",
      loadInDifficulty: "Ground floor",
      contacts: [{ id: "c2", role: "Site Rep", name: "Danny Vega", phone: "(213) 555-0199", email: "dvega@artsdistrict.com" }],
      sceneTags: [{ sceneNumber: "7", sceneTitle: "Chase Scene" }],
      scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc3", code: "LOC-003", name: "Studio A - Raleigh", locationType: "studio", status: "secured",
      lat: 34.0800, lng: -118.3700, address: "Raleigh Studios, 5300 Melrose Ave, Los Angeles, CA",
      vibeTags: ["Modern", "Minimalist"],
      media: [
        { id: "m3a", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Stage floor" },
        { id: "m3b", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Grid rigging" },
      ],
      notes: "Stage 12. Full soundstage.", dailyRate: "$8,500", overtimeRate: "$1,200/hr", securityDeposit: "$15,000",
      dimensionsL: 120, dimensionsW: 80, dimensionsH: 35, gridHeight: 30, floorType: "Concrete",
      amperage: "3-Phase, 400 Amps", camlockAvailable: true, soundRating: "Soundproof",
      workshopAccess: true, millSpace: true, paintShopProximity: "On-lot, Building 4",
      sceneTags: [{ sceneNumber: "1", sceneTitle: "Opening" }, { sceneNumber: "30", sceneTitle: "Climax" }],
      scheduleBlocks: [{ id: "sb4", type: "prep", startDate: "2026-03-01", endDate: "2026-03-05" }, { id: "sb5", type: "shoot", startDate: "2026-03-06", endDate: "2026-03-20" }],
      blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc4", code: "LOC-004", name: "Abandoned Warehouse", locationType: "on-location", status: "pending-approval",
      lat: 33.9800, lng: -118.3000, address: "1400 Industrial Blvd, Inglewood, CA",
      vibeTags: ["Gritty", "Industrial", "Dystopian", "Spooky"],
      media: [
        { id: "m4a", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Interior wide" },
        { id: "m4b", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Loading dock" },
        { id: "m4c", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Upper floor" },
        { id: "m4d", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Roof access" },
        { id: "m4e", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Exterior" },
      ],
      notes: "Needs structural safety inspection.", dailyRate: "$1,200", overtimeRate: "$200/hr", securityDeposit: "$3,000",
      basecampParking: "Adjacent lot", crewParkingCapacity: 12, noiseProfile: "Flight path overhead",
      loadInDifficulty: "Ground floor", bathroomCount: 1,
      contacts: [{ id: "c3", role: "Owner", name: "Eastside Holdings LLC", phone: "(310) 555-0277", email: "permits@eastsideholdings.com" }],
      sceneTags: [{ sceneNumber: "42", sceneTitle: "Villain Lair" }],
      scheduleBlocks: [], blackoutDates: [{ id: "bd2", date: "2026-04-01", reason: "Building inspection" }],
      bookedTo: "Avatar 3",
    },
    {
      id: "loc5", code: "LOC-005", name: "Redwood Forest Clearing", locationType: "on-location", status: "scouted",
      lat: 37.8000, lng: -122.1800, address: "Muir Woods, Mill Valley, CA",
      vibeTags: ["Forest", "Gothic", "Spooky", "Rustic"],
      media: [
        { id: "m5a", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Clearing" },
        { id: "m5b", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Trail path" },
      ],
      notes: "NPS permit required. 6-week lead.", dailyRate: "$500", overtimeRate: "$100/hr", securityDeposit: "$2,000",
      basecampParking: "Lot 0.5mi away", crewParkingCapacity: 3,
      sunPathNotes: "Canopy blocks most direct sunlight",
      noiseProfile: "Very quiet",
      contacts: [{ id: "c4", role: "Ranger", name: "Tom Whitfield", phone: "(415) 555-0333", email: "twhitfield@nps.gov" }],
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
    {
      id: "loc6", code: "LOC-006", name: "Studio B - Build Stage", locationType: "studio", status: "scouted",
      lat: 34.1500, lng: -118.3400, address: "Universal Studios, 100 Universal City Plaza, CA",
      vibeTags: ["Futuristic", "Modern"],
      media: [
        { id: "m6a", url: "/placeholder.svg?height=400&width=600", type: "photo", caption: "Empty stage" },
      ],
      notes: "Available for sci-fi build. 4-week advance booking.", dailyRate: "$12,000", overtimeRate: "$1,800/hr", securityDeposit: "$25,000",
      dimensionsL: 150, dimensionsW: 100, dimensionsH: 45, gridHeight: 40, floorType: "Epoxy",
      amperage: "3-Phase, 600 Amps", camlockAvailable: true, soundRating: "Soundproof",
      workshopAccess: true, millSpace: true, paintShopProximity: "Adjacent building",
      sceneTags: [], scheduleBlocks: [], blackoutDates: [], bookedTo: null,
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Reusable Form Fields                                               */
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

function TagPicker({ selected, onChange, options }: { selected: string[]; onChange: (tags: string[]) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((tag) => {
        const active = selected.includes(tag)
        return (
          <button key={tag} type="button" onClick={() => onChange(active ? selected.filter((t) => t !== tag) : [...selected, tag])}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {tag}
          </button>
        )
      })}
    </div>
  )
}

function LocationStatusBadge({ status }: { status: LocationStatus }) {
  const cfg = LOCATION_STATUSES.find((s) => s.value === status) || LOCATION_STATUSES[0]
  return <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
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
            <img src={m.url} alt={m.caption || ""} className="w-full h-full object-cover" />
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
/*  Image Carousel                                                     */
/* ------------------------------------------------------------------ */

function ImageCarousel({ media, size = "large" }: { media: LocationMediaItem[]; size?: "large" | "mini" }) {
  const [current, setCurrent] = useState(0)
  if (media.length === 0) return null

  const goTo = (dir: 1 | -1) => {
    setCurrent((c) => {
      const next = c + dir
      if (next < 0) return media.length - 1
      if (next >= media.length) return 0
      return next
    })
  }

  if (size === "mini") {
    return (
      <div className="relative w-full h-full">
        <img src={media[current].url} alt={media[current].caption || ""} className="w-full h-full object-cover" />
        {media.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goTo(-1) }} className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goTo(1) }} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
              <ChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {media.slice(0, 5).map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full group/carousel">
      <img src={media[current].url} alt={media[current].caption || ""} className="w-full h-full object-cover" />
      {media.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goTo(-1) }} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-black/60 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); goTo(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 hover:bg-black/60 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {media.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i) }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
          {media[current].caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
              {media[current].caption}
            </div>
          )}
        </>
      )}
      <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
        {current + 1}/{media.length}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Hover Preview Overlay (Instagram-style top-3 carousel)             */
/* ------------------------------------------------------------------ */

function HoverPreviewOverlay({ media }: { media: LocationMediaItem[] }) {
  const previewMedia = media.slice(0, 3)
  if (previewMedia.length === 0) return null
  return (
    <div className="absolute inset-0 z-10">
      <ImageCarousel media={previewMedia} size="mini" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Interactive Map                                                    */
/* ------------------------------------------------------------------ */

function InteractiveMap({ locations, selectedId, onSelect }: { locations: ProjectLocation[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const bounds = useMemo(() => {
    if (locations.length === 0) return { minLat: 33.8, maxLat: 34.3, minLng: -118.6, maxLng: -118.0 }
    const lats = locations.map((l) => l.lat)
    const lngs = locations.map((l) => l.lng)
    const pad = 0.08
    return { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad }
  }, [locations])

  const toPercent = (lat: number, lng: number) => ({
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100,
  })

  const selectedLoc = selectedId ? locations.find((l) => l.id === selectedId) : null

  return (
    <div className="w-full h-full bg-gradient-to-br from-teal-50 via-sky-50 to-blue-50 rounded-2xl border border-gray-200 relative overflow-hidden">
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="locgrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#locgrid)" />
      </svg>
      {/* Subtle road lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[25%] left-[10%] right-[10%] h-px bg-gray-300/30" />
        <div className="absolute top-[55%] left-[5%] right-[15%] h-px bg-gray-300/30" />
        <div className="absolute top-[75%] left-[20%] right-[5%] h-px bg-gray-300/20" />
        <div className="absolute left-[30%] top-[5%] bottom-[10%] w-px bg-gray-300/30" />
        <div className="absolute left-[60%] top-[10%] bottom-[5%] w-px bg-gray-300/30" />
        <div className="absolute left-[80%] top-[15%] bottom-[20%] w-px bg-gray-300/20" />
      </div>

      {/* Markers */}
      {locations.map((loc) => {
        const pos = toPercent(loc.lat, loc.lng)
        const isSelected = loc.id === selectedId
        const statusColor = loc.status === "secured" ? "bg-emerald-500" : loc.status === "scouted" ? "bg-blue-500" : loc.status === "pending-approval" ? "bg-amber-500" : "bg-red-500"
        const ringColor = loc.status === "secured" ? "ring-emerald-300" : loc.status === "scouted" ? "ring-blue-300" : loc.status === "pending-approval" ? "ring-amber-300" : "ring-red-300"
        return (
          <button
            key={loc.id}
            onClick={() => onSelect(loc.id)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group/marker ${isSelected ? "z-30 scale-110" : "z-10 hover:z-20 hover:scale-105"}`}
            style={{ left: `${Math.min(Math.max(pos.x, 6), 94)}%`, top: `${Math.min(Math.max(pos.y, 6), 94)}%` }}
          >
            {/* Pulse ring for selected */}
            {isSelected && (
              <div className={`absolute inset-0 w-9 h-9 -m-1 rounded-full ${ringColor} opacity-40 animate-ping`} />
            )}
            <div className={`relative w-7 h-7 rounded-full ${statusColor} shadow-lg flex items-center justify-center transition-all ${isSelected ? "ring-2 ring-white shadow-xl" : ""}`}>
              {loc.locationType === "studio" ? <Building2 className="w-3 h-3 text-white" /> : <MapPin className="w-3 h-3 text-white" />}
            </div>
            {/* Tooltip */}
            <div className={`absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900/90 text-white text-[9px] px-2 py-0.5 rounded-md backdrop-blur-sm transition-opacity pointer-events-none ${isSelected ? "opacity-100" : "opacity-0 group-hover/marker:opacity-100"}`}>
              {loc.name}
            </div>
          </button>
        )
      })}

      {/* Selected location info card */}
      {selectedLoc && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg p-3 z-40 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {selectedLoc.media.length > 0 ? (
                <img src={selectedLoc.media[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><MapPin className="w-5 h-5" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400">{selectedLoc.code}</span>
                <LocationStatusBadge status={selectedLoc.status} />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 truncate">{selectedLoc.name}</h4>
              <p className="text-[11px] text-gray-500 truncate">{selectedLoc.address}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-gray-900">{selectedLoc.dailyRate}</p>
              <p className="text-[10px] text-gray-400">per day</p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white/90 rounded-xl px-3 py-2 text-[9px] flex flex-col gap-1.5 backdrop-blur-sm border border-gray-200/60 shadow-sm">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-gray-600">Secured</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-gray-600">Scouted</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-gray-600">Pending</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-gray-600">Burned</span></div>
      </div>

      {/* Map label */}
      <div className="absolute top-3 left-3 bg-white/80 rounded-lg px-2.5 py-1 text-[10px] text-gray-400 font-medium flex items-center gap-1.5 backdrop-blur-sm border border-gray-200/50 shadow-sm">
        <Map className="w-3.5 h-3.5" /> Location Map
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Location Card (Instagram-style with hover preview + drag-drop)     */
/* ------------------------------------------------------------------ */

function LocationCard({ loc, isSelected, isInProject, onSelect, onToggleAdd, onEdit, onDelete, hasProject, onAddMedia }: {
  loc: ProjectLocation; isSelected: boolean; isInProject: boolean;
  onSelect: (id: string) => void; onToggleAdd: (id: string) => void;
  onEdit: (loc: ProjectLocation) => void; onDelete: (id: string) => void;
  hasProject: boolean; onAddMedia: (id: string, items: LocationMediaItem[]) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const dist = haversineDistance(OFFICE_LAT, OFFICE_LNG, loc.lat, loc.lng)
  const weather = getWeather(loc.id)

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      const items: LocationMediaItem[] = []
      for (const file of Array.from(e.dataTransfer.files)) {
        if (file.type.startsWith("image/")) {
          const url = await readFileAsDataUrl(file)
          items.push({ id: uid(), url, type: "photo" })
        }
      }
      if (items.length > 0) onAddMedia(loc.id, items)
    }
  }

  return (
    <div
      onClick={() => onSelect(loc.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false) }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false) }}
      onDrop={handleDrop}
      className={`relative bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? "border-teal-500 ring-2 ring-teal-200 shadow-md" :
        isDragOver ? "border-teal-400 ring-2 ring-teal-100 shadow-md" :
        isInProject ? "border-teal-300/60" :
        "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Image area (square aspect ratio for Instagram feel) */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {loc.media.length > 0 ? (
          <>
            {/* Default: show first image */}
            {!isHovered ? (
              <img src={loc.media[0].url} alt={loc.name} className="w-full h-full object-cover" />
            ) : (
              /* Hover: show mini carousel of top 3 */
              <HoverPreviewOverlay media={loc.media} />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
            <MapPin className="w-8 h-8" />
            <span className="text-[10px] text-gray-400">No photos</span>
          </div>
        )}

        {/* Drag-drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-teal-500/30 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white rounded-xl px-4 py-3 shadow-lg text-center">
              <Upload className="w-6 h-6 text-teal-600 mx-auto mb-1" />
              <p className="text-xs font-medium text-teal-700">Drop to add photos</p>
            </div>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <span className="bg-black/60 text-white text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm">{loc.code}</span>
          <LocationStatusBadge status={loc.status} />
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2 z-10">
          <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${loc.locationType === "studio" ? "bg-purple-100/90 text-purple-700" : "bg-sky-100/90 text-sky-700"}`}>
            {loc.locationType === "studio" ? <Building2 className="w-2.5 h-2.5" /> : <TreePine className="w-2.5 h-2.5" />}
            {loc.locationType === "studio" ? "Studio" : "Location"}
          </span>
        </div>

        {/* Photo count badge */}
        {loc.media.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowGallery(true) }}
            className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1 hover:bg-black/70 transition-colors z-10"
          >
            <ImageIcon className="w-3 h-3" /> {loc.media.length}
          </button>
        )}

        {/* In-project indicator */}
        {isInProject && (
          <div className="absolute bottom-2 left-2 bg-teal-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 z-10">
            <Check className="w-3 h-3" /> In Project
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{loc.name}</h3>
            <p className="text-[11px] text-gray-500 truncate mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />{loc.address}
            </p>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 min-w-[160px] z-30">
                <button onClick={(e) => { e.stopPropagation(); onEdit(loc); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5" /> Edit details
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleAdd(loc.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                  {isInProject ? "Remove from project" : "Add to project"}
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={(e) => { e.stopPropagation(); onDelete(loc.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Weather row */}
        <div className="flex items-center gap-3 mt-2 px-2 py-1.5 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-1">
            <WeatherIcon condition={weather.condition} />
            <span className="text-[11px] font-medium text-gray-700">{weather.temp}</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] text-gray-500">{weather.humidity}</span>
          </div>
          <span className="text-[10px] text-gray-400 ml-auto">{dist.toFixed(1)} mi</span>
        </div>

        {/* Vibe tags */}
        {loc.vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {loc.vibeTags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] rounded-md font-medium">{t}</span>
            ))}
            {loc.vibeTags.length > 3 && <span className="text-[9px] text-gray-400">+{loc.vibeTags.length - 3}</span>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
          {loc.bookedTo ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> {loc.bookedTo}
            </span>
          ) : !isInProject ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleAdd(loc.id) }}
              disabled={!hasProject}
              title={!hasProject ? "Create or open a project first" : "Add to project"}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" /> Add to project
            </button>
          ) : (
            <span className="text-[10px] text-teal-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Added</span>
          )}
          <span className="text-[10px] text-gray-500 font-semibold">{loc.dailyRate}<span className="text-gray-400 font-normal">/day</span></span>
        </div>
      </div>

      {/* Gallery modal */}
      {showGallery && loc.media.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4" onClick={(e) => { e.stopPropagation(); setShowGallery(false) }}>
          <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <ImageCarousel media={loc.media} size="large" />
            <button onClick={(e) => { e.stopPropagation(); setShowGallery(false) }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-50">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
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
    basecampParking: "", crewParkingCapacity: "", cateringArea: "",
    sunPathNotes: "", noiseProfile: "", loadInDifficulty: "",
    bathroomCount: "", greenRoomCapability: "", makeupAreaSuitability: "",
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
          {locType === "on-location" && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Link className="w-3 h-3" /> Paste a Google Maps Link</p>
              <div className="flex gap-2">
                <input type="text" value={mapsLink} onChange={(e) => { setMapsLink(e.target.value); setMapsAutoFilled(false) }}
                  placeholder="https://maps.google.com/..."
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
                <button onClick={handleParseMapsLink} disabled={!mapsLink.trim()} className="px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Auto-Fill</button>
              </div>
              {mapsAutoFilled && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Auto-filled</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Location Name" value={form.name} onChange={(v) => update("name", v)} />
            <FloatingField label="Address" value={form.address} onChange={(v) => update("address", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Latitude" value={form.lat} onChange={(v) => update("lat", v)} type="number" />
            <FloatingField label="Longitude" value={form.lng} onChange={(v) => update("lng", v)} type="number" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Vibe Tags</p>
            <TagPicker selected={vibeTags} onChange={setVibeTags} options={VIBE_TAG_OPTIONS} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Scouting Photos</p>
            <PhotoDropZone media={media} onAdd={(items) => setMedia((prev) => [...prev, ...items])} />
          </div>
          <FloatingTextarea label="Notes" value={form.notes} onChange={(v) => update("notes", v)} />
          <div>
            <h3 className="text-base font-bold text-gray-900">Costing</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FloatingField label="Daily Rate" value={form.dailyRate} onChange={(v) => update("dailyRate", v)} placeholder="$0" />
              <FloatingField label="Overtime Rate" value={form.overtimeRate} onChange={(v) => update("overtimeRate", v)} placeholder="$0/hr" />
              <FloatingField label="Security Deposit" value={form.securityDeposit} onChange={(v) => update("securityDeposit", v)} placeholder="$0" />
            </div>
          </div>
          {locType === "on-location" ? (
            <div>
              <h3 className="text-base font-bold text-gray-900">Logistics</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <FloatingField label="Basecamp Parking" value={form.basecampParking} onChange={(v) => update("basecampParking", v)} />
                <FloatingField label="Crew Parking Capacity" value={form.crewParkingCapacity} onChange={(v) => update("crewParkingCapacity", v)} type="number" />
                <FloatingField label="Sun Path Notes" value={form.sunPathNotes} onChange={(v) => update("sunPathNotes", v)} />
                <FloatingField label="Noise Profile" value={form.noiseProfile} onChange={(v) => update("noiseProfile", v)} />
                <FloatingSelect label="Load-in Difficulty" value={form.loadInDifficulty} onChange={(v) => update("loadInDifficulty", v)} options={LOAD_IN_OPTIONS} />
                <FloatingField label="Bathrooms" value={form.bathroomCount} onChange={(v) => update("bathroomCount", v)} type="number" />
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-gray-900">Technical Specs</h3>
              <div className="grid grid-cols-4 gap-3 mt-2 mb-4">
                <FloatingField label="Length (ft)" value={form.dimL} onChange={(v) => update("dimL", v)} type="number" />
                <FloatingField label="Width (ft)" value={form.dimW} onChange={(v) => update("dimW", v)} type="number" />
                <FloatingField label="Height (ft)" value={form.dimH} onChange={(v) => update("dimH", v)} type="number" />
                <FloatingField label="Grid Height" value={form.gridHeight} onChange={(v) => update("gridHeight", v)} type="number" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <FloatingSelect label="Floor Type" value={form.floorType} onChange={(v) => update("floorType", v)} options={FLOOR_TYPE_OPTIONS} />
                <FloatingField label="Amperage" value={form.amperage} onChange={(v) => update("amperage", v)} />
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
          )}
          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={!form.name.trim()} className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Add Location</button>
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
    onSave({ ...location, ...form, status: form.status as LocationStatus, vibeTags, sceneTags, scheduleBlocks, blackoutDates })
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
          <div>
            <h3 className="text-base font-bold text-gray-900">Vibe Tags</h3>
            <TagPicker selected={vibeTags} onChange={setVibeTags} options={VIBE_TAG_OPTIONS} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Costing</h3>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <FloatingField label="Daily Rate" value={form.dailyRate} onChange={(v) => update("dailyRate", v)} />
              <FloatingField label="Overtime Rate" value={form.overtimeRate} onChange={(v) => update("overtimeRate", v)} />
              <FloatingField label="Security Deposit" value={form.securityDeposit} onChange={(v) => update("securityDeposit", v)} />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Scene Assignments</h3>
            <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
              {sceneTags.map((st) => (
                <span key={st.sceneNumber} className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full">
                  Sc. {st.sceneNumber}{st.sceneTitle ? ` - ${st.sceneTitle}` : ""}
                  <button onClick={() => setSceneTags((prev) => prev.filter((s) => s.sceneNumber !== st.sceneNumber))} className="hover:text-red-600 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSceneNumber} onChange={(e) => setNewSceneNumber(e.target.value)} placeholder="Scene #" className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder-gray-400 w-32" />
              <button onClick={() => { if (newSceneNumber.trim()) { setSceneTags((p) => [...p, { sceneNumber: newSceneNumber.trim() }]); setNewSceneNumber("") } }} disabled={!newSceneNumber.trim()} className="px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50">Add</button>
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Schedule</h3>
            {scheduleBlocks.map((b, idx) => (
              <div key={b.id} className="flex items-center gap-2 mb-2 mt-2">
                <select value={b.type} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, type: e.target.value as "prep" | "shoot" | "strike" }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 appearance-none w-24">
                  <option value="prep">Prep</option><option value="shoot">Shoot</option><option value="strike">Strike</option>
                </select>
                <input type="date" value={b.startDate} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, startDate: e.target.value }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700" />
                <span className="text-xs text-gray-400">to</span>
                <input type="date" value={b.endDate} onChange={(e) => { const u = [...scheduleBlocks]; u[idx] = { ...b, endDate: e.target.value }; setScheduleBlocks(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700" />
                <button onClick={() => setScheduleBlocks((p) => p.filter((s) => s.id !== b.id))} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => setScheduleBlocks((p) => [...p, { id: uid(), type: "shoot", startDate: "", endDate: "", notes: "" }])} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors mt-1">
              <Plus className="w-3 h-3" /> Add Block
            </button>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Blackout Dates</h3>
            {blackoutDates.map((bd, idx) => (
              <div key={bd.id} className="flex items-center gap-2 mb-2 mt-2">
                <input type="date" value={bd.date} onChange={(e) => { const u = [...blackoutDates]; u[idx] = { ...bd, date: e.target.value }; setBlackoutDates(u) }} className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700" />
                <input type="text" value={bd.reason || ""} onChange={(e) => { const u = [...blackoutDates]; u[idx] = { ...bd, reason: e.target.value }; setBlackoutDates(u) }} placeholder="Reason" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder-gray-400" />
                <button onClick={() => setBlackoutDates((p) => p.filter((d) => d.id !== bd.id))} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

interface LocationsModalProps { onClose: () => void }

export default function LocationsModal({ onClose }: LocationsModalProps) {
  const { state, dispatch } = useCasting()
  const projectId = state.currentFocus.currentProjectId
  const currentProject = projectId ? state.projects.find((p) => p.id === projectId) ?? null : null

  const [inventory, setInventory] = useState<ProjectLocation[]>(generateMockLocations)

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
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const projectLocIds = useMemo(() => new Set(projectLocations.map((l) => l.id)), [projectLocations])

  /* When map marker is clicked, scroll the card into view */
  const handleSelectFromMap = useCallback((id: string) => {
    setSelectedId(id)
    const el = cardRefs.current[id]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [])

  /* When card is clicked, update selection (map reacts via selectedId) */
  const handleSelectFromCard = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

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
    if (maxDistance) { const d = parseFloat(maxDistance); if (!isNaN(d)) filtered = filtered.filter((l) => haversineDistance(OFFICE_LAT, OFFICE_LNG, l.lat, l.lng) <= d) }
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

  const handleAddLocation = (loc: ProjectLocation) => setInventory((prev) => [loc, ...prev])

  const handleSaveEdit = (updated: ProjectLocation) => {
    setInventory((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    if (projectLocIds.has(updated.id)) syncProjectLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
    setEditingLocation(null)
  }

  const handleAddMedia = (id: string, items: LocationMediaItem[]) => {
    setInventory((prev) => prev.map((l) => l.id === id ? { ...l, media: [...l.media, ...items] } : l))
    if (projectLocIds.has(id)) syncProjectLocations((prev) => prev.map((l) => l.id === id ? { ...l, media: [...l.media, ...items] } : l))
  }

  const handleRequestDelete = (id: string, source: "inventory" | "project") => { setConfirmDeleteId(id); setConfirmDeleteSource(source) }

  const handleConfirmDelete = () => {
    if (!confirmDeleteId) return
    if (confirmDeleteSource === "inventory") {
      setInventory((prev) => prev.filter((l) => l.id !== confirmDeleteId))
      if (projectLocIds.has(confirmDeleteId)) syncProjectLocations((prev) => prev.filter((l) => l.id !== confirmDeleteId))
    } else {
      syncProjectLocations((prev) => prev.filter((l) => l.id !== confirmDeleteId))
    }
    setConfirmDeleteId(null)
    if (selectedId === confirmDeleteId) setSelectedId(null)
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
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTypeFilter("")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>All</button>
            <button onClick={() => setTypeFilter("on-location")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "on-location" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>On-Location</button>
            <button onClick={() => setTypeFilter("studio")} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${typeFilter === "studio" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Studio</button>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2.5 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Any Status</option>
            {LOCATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500">Within</span>
            <input type="number" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} placeholder="mi" className="w-16 px-2 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
            <span className="text-[11px] text-gray-500">mi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <input type="text" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Vibe tag..." className="w-24 px-2 py-1.5 bg-gray-100 rounded-lg text-[11px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400" />
          </div>
          <button onClick={() => setHasPower(!hasPower)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${hasPower ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            <Zap className="w-3 h-3" /> 3-Phase Power
          </button>
        </div>
      )}

      {/* Main Content: Cards panel + Map panel side by side */}
      <div className="flex-1 overflow-hidden flex">
        {/* Cards Panel (50%) */}
        <div className="w-1/2 overflow-y-auto p-4 border-r border-gray-200">
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
            <div className="grid grid-cols-2 gap-3">
              {displayLocations.map((loc) => (
                <div key={loc.id} ref={(el) => { cardRefs.current[loc.id] = el }}>
                  <LocationCard
                    loc={loc}
                    isSelected={selectedId === loc.id}
                    isInProject={projectLocIds.has(loc.id)}
                    onSelect={handleSelectFromCard}
                    onToggleAdd={handleToggleAdd}
                    onEdit={(l) => setEditingLocation(l)}
                    onDelete={(id) => handleRequestDelete(id, isProjectTab ? "project" : "inventory")}
                    hasProject={!!projectId}
                    onAddMedia={handleAddMedia}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Panel (50%) */}
        <div className="w-1/2 p-4">
          <InteractiveMap locations={displayLocations} selectedId={selectedId} onSelect={handleSelectFromMap} />
        </div>
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
              <p className="text-sm text-gray-500 text-center mt-2">Are you sure? This action cannot be undone.</p>
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
