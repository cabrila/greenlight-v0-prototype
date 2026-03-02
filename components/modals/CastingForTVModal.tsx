"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"
import {
  X,
  Home,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Star,
  Archive,
  Phone,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Users,
  User,
  Tv,
  Flag,
  Instagram,
  Video,
  FileText,
  BarChart3,
  Inbox,
  CheckCircle,
  AlertTriangle,
  Clock,
  Grid3X3,
  List,
  GripVertical,
  ExternalLink,
  Eye,
  Edit3,
  Trash2,
  Send,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Database,
  Link,
  UserPlus,
  Columns,
  LayoutGrid,
  Settings,
  Shuffle,
  PieChart,
  Target,
} from "lucide-react"

interface CastingForTVModalProps {
  onClose: () => void
}

// Participant status stages for Kanban
const FUNNEL_STAGES = [
  { id: "inbox", label: "Inbox", color: "bg-slate-100 text-slate-700 border-slate-300" },
  { id: "first-pass", label: "First Pass", color: "bg-blue-50 text-blue-700 border-blue-300" },
  { id: "phone-interview", label: "Phone Interview", color: "bg-cyan-50 text-cyan-700 border-cyan-300" },
  { id: "zoom-audition", label: "Zoom Audition", color: "bg-purple-50 text-purple-700 border-purple-300" },
  { id: "background-check", label: "Background Check", color: "bg-amber-50 text-amber-700 border-amber-300" },
  { id: "psych-eval", label: "Psych Eval", color: "bg-orange-50 text-orange-700 border-orange-300" },
  { id: "final-mix", label: "Final Mix", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { id: "locked", label: "Locked", color: "bg-green-100 text-green-800 border-green-400" },
] as const

type FunnelStage = (typeof FUNNEL_STAGES)[number]["id"]

// Cast lists for organization
interface CastList {
  id: string
  name: string
  description?: string
  participantIds: string[]
  color: string
  createdAt: number
}

// Mock participant data for Non-Fiction TV
interface Participant {
  id: string
  name: string
  age: number
  location: string
  occupation: string
  photo?: string
  archetype: string[]
  socialHandles: {
    instagram?: string
    tiktok?: string
    followerCount?: number
  }
  stage: FunnelStage
  status: "new" | "contacted" | "on-hold" | "rejected" | "cast"
  starred: boolean
  redFlags?: { type: string; note: string }[]
  score?: number
  appliedDate: number
  lastContact?: number
  notes?: string
  listIds?: string[]
}

const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    name: "Marcus Chen",
    age: 28,
    location: "Los Angeles, CA",
    occupation: "Personal Trainer",
    archetype: ["The Heartthrob", "The Competitor"],
    socialHandles: { instagram: "@marcusfitlife", followerCount: 45000 },
    stage: "first-pass",
    status: "contacted",
    starred: true,
    score: 8.5,
    appliedDate: Date.now() - 86400000 * 3,
    lastContact: Date.now() - 86400000,
    notes: "Great energy, very photogenic",
  },
  {
    id: "p2",
    name: "Jasmine Williams",
    age: 32,
    location: "Atlanta, GA",
    occupation: "Event Planner",
    archetype: ["The Expert", "The Peacemaker"],
    socialHandles: { instagram: "@jasmineevents", tiktok: "@jasminew", followerCount: 120000 },
    stage: "zoom-audition",
    status: "contacted",
    starred: true,
    score: 9.2,
    appliedDate: Date.now() - 86400000 * 5,
    lastContact: Date.now() - 86400000 * 2,
  },
  {
    id: "p3",
    name: "Derek Thompson",
    age: 41,
    location: "Chicago, IL",
    occupation: "Restaurant Owner",
    archetype: ["The Villain", "The Wild Card"],
    socialHandles: { instagram: "@derekseats" },
    stage: "phone-interview",
    status: "contacted",
    starred: false,
    redFlags: [{ type: "risk", note: "Previous contract breach with competitor network" }],
    score: 7.8,
    appliedDate: Date.now() - 86400000 * 2,
  },
  {
    id: "p4",
    name: "Sophia Rodriguez",
    age: 25,
    location: "Miami, FL",
    occupation: "Influencer",
    archetype: ["The Heartthrob", "The Underdog"],
    socialHandles: { instagram: "@sophiarodri", tiktok: "@sophiamia", followerCount: 890000 },
    stage: "final-mix",
    status: "contacted",
    starred: true,
    score: 9.5,
    appliedDate: Date.now() - 86400000 * 7,
  },
  {
    id: "p5",
    name: "Tyler Jackson",
    age: 29,
    location: "Nashville, TN",
    occupation: "Musician",
    archetype: ["The Artist", "The Romantic"],
    socialHandles: { instagram: "@tylerjmusic", followerCount: 35000 },
    stage: "inbox",
    status: "new",
    starred: false,
    appliedDate: Date.now() - 86400000,
  },
  {
    id: "p6",
    name: "Amanda Foster",
    age: 34,
    location: "Denver, CO",
    occupation: "Firefighter",
    archetype: ["The Hero", "The Fish out of Water"],
    socialHandles: { instagram: "@amandaf_fd" },
    stage: "background-check",
    status: "contacted",
    starred: true,
    score: 8.9,
    appliedDate: Date.now() - 86400000 * 4,
  },
  {
    id: "p7",
    name: "Kevin Park",
    age: 27,
    location: "Seattle, WA",
    occupation: "Software Engineer",
    archetype: ["The Nerd", "The Underdog"],
    socialHandles: { instagram: "@kevinpcodes", followerCount: 8000 },
    stage: "inbox",
    status: "new",
    starred: false,
    appliedDate: Date.now() - 3600000 * 6,
  },
  {
    id: "p8",
    name: "Rachel Green",
    age: 30,
    location: "New York, NY",
    occupation: "Fashion Designer",
    archetype: ["The Expert", "The Diva"],
    socialHandles: { instagram: "@rachelgdesigns", followerCount: 250000 },
    stage: "locked",
    status: "cast",
    starred: true,
    score: 9.8,
    appliedDate: Date.now() - 86400000 * 14,
  },
]

export default function CastingForTVModal({ onClose }: CastingForTVModalProps) {
  const { state } = useCasting()
  const [activeView, setActiveView] = useState<"pipeline" | "grid" | "list" | "mix">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS)
  const [filterArchetype, setFilterArchetype] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [draggedParticipant, setDraggedParticipant] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [castMixSlots, setCastMixSlots] = useState<Record<string, string | null>>({
    "lead-male": null,
    "lead-female": null,
    "villain": null,
    "wildcard": null,
    "underdog": null,
    "expert": null,
  })
  const [lists, setLists] = useState<CastList[]>([
    { id: "list-1", name: "Top Picks", description: "Best candidates for final review", participantIds: ["p1", "p2", "p4"], color: "bg-emerald-500", createdAt: Date.now() - 86400000 * 5 },
    { id: "list-2", name: "Backup Options", description: "Strong alternatives", participantIds: ["p3", "p6"], color: "bg-blue-500", createdAt: Date.now() - 86400000 * 3 },
    { id: "list-3", name: "Social Stars", description: "High follower count", participantIds: ["p2", "p4", "p8"], color: "bg-pink-500", createdAt: Date.now() - 86400000 },
  ])
  const addDropdownRef = useRef<HTMLDivElement>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const isNonFictionProject = currentProject?.details.type === "Non-Fiction TV"

  // Get unique archetypes
  const allArchetypes = useMemo(() => {
    const archetypes = new Set<string>()
    participants.forEach((p) => p.archetype.forEach((a) => archetypes.add(a)))
    return Array.from(archetypes).sort()
  }, [participants])

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.occupation.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesArchetype = !filterArchetype || p.archetype.includes(filterArchetype)
      return matchesSearch && matchesArchetype
    })
  }, [participants, searchQuery, filterArchetype])

  // Group by stage for Kanban
  const participantsByStage = useMemo(() => {
    const grouped: Record<FunnelStage, Participant[]> = {
      inbox: [],
      "first-pass": [],
      "phone-interview": [],
      "zoom-audition": [],
      "background-check": [],
      "psych-eval": [],
      "final-mix": [],
      locked: [],
    }
    filteredParticipants.forEach((p) => {
      grouped[p.stage].push(p)
    })
    return grouped
  }, [filteredParticipants])

  const handleDragStart = (participantId: string) => {
    setDraggedParticipant(participantId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStage(stageId)
  }

  const handleDrop = (stageId: FunnelStage) => {
    if (draggedParticipant) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === draggedParticipant ? { ...p, stage: stageId } : p))
      )
    }
    setDraggedParticipant(null)
    setDragOverStage(null)
  }

  const toggleStar = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, starred: !p.starred } : p))
    )
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatFollowers = (count?: number) => {
    if (!count) return null
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

  const renderParticipantCard = (participant: Participant, compact = false) => (
    <div
      key={participant.id}
      draggable
      onDragStart={() => handleDragStart(participant.id)}
      onDragEnd={() => { setDraggedParticipant(null); setDragOverStage(null) }}
      onClick={() => setSelectedParticipant(participant)}
      className={`bg-white rounded-xl border border-gray-200 hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer group ${
        draggedParticipant === participant.id ? "opacity-50 scale-95" : ""
      } ${selectedParticipant?.id === participant.id ? "ring-2 ring-cyan-500 border-cyan-400" : ""}`}
    >
      <div className={`p-3 ${compact ? "space-y-2" : "space-y-3"}`}>
        {/* Header with photo and name */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className={`${compact ? "w-10 h-10" : "w-12 h-12"} rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-sm overflow-hidden`}>
              {participant.photo ? (
                <img src={participant.photo} alt={participant.name} className="w-full h-full object-cover" />
              ) : (
                participant.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>
            {participant.starred && (
              <Star className="absolute -top-1 -right-1 w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={`font-semibold text-gray-900 truncate ${compact ? "text-xs" : "text-sm"}`}>
                {participant.name}
              </h4>
              {participant.redFlags && participant.redFlags.length > 0 && (
                <Flag className="w-3 h-3 text-red-500 shrink-0" />
              )}
            </div>
            <p className={`text-gray-500 truncate ${compact ? "text-[10px]" : "text-xs"}`}>
              {participant.age} • {participant.location}
            </p>
            <p className={`text-gray-600 truncate ${compact ? "text-[10px]" : "text-xs"}`}>
              {participant.occupation}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleStar(participant.id) }}
            className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Star className={`w-4 h-4 ${participant.starred ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
          </button>
        </div>

        {/* Archetypes */}
        <div className="flex flex-wrap gap-1">
          {participant.archetype.map((arch) => (
            <span key={arch} className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px] font-medium">
              {arch}
            </span>
          ))}
        </div>

        {/* Social + Score */}
        {!compact && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {participant.socialHandles.instagram && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Instagram className="w-3 h-3" />
                  {formatFollowers(participant.socialHandles.followerCount)}
                </div>
              )}
            </div>
            {participant.score && (
              <div className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">{participant.score}</span>
              </div>
            )}
          </div>
        )}

        {/* Applied date */}
        <div className={`flex items-center gap-1 text-gray-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
          <Clock className="w-3 h-3" />
          Applied {formatDate(participant.appliedDate)}
        </div>
      </div>
    </div>
  )

  const renderPipelineView = () => (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-3 p-4 min-w-max h-full">
        {FUNNEL_STAGES.map((stage) => {
          const stageParticipants = participantsByStage[stage.id]
          const isOver = dragOverStage === stage.id
          return (
            <div
              key={stage.id}
              className={`w-72 flex flex-col bg-gray-50/50 rounded-xl border transition-all ${
                isOver ? "border-cyan-400 bg-cyan-50/30 ring-2 ring-cyan-200" : "border-gray-200"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.id as FunnelStage)}
            >
              {/* Stage header */}
              <div className={`px-3 py-2.5 border-b ${stage.color.replace("text-", "border-").split(" ")[2]} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${stage.color}`}>
                      {stageParticipants.length}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-800">{stage.label}</h3>
                  </div>
                  <button className="p-1 rounded hover:bg-white/50 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stageParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Inbox className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No participants</p>
                  </div>
                ) : (
                  stageParticipants.map((p) => renderParticipantCard(p, true))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredParticipants.map((p) => renderParticipantCard(p))}
      </div>
    </div>
  )

  const renderParticipantDetail = () => {
    if (!selectedParticipant) return null
    const p = selectedParticipant
    const stage = FUNNEL_STAGES.find((s) => s.id === p.stage)

    return (
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Participant Details</h3>
          <button
            onClick={() => setSelectedParticipant(null)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Profile header */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-2xl mx-auto mb-3 overflow-hidden">
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{p.name}</h2>
            <p className="text-sm text-gray-500">{p.age} years old • {p.location}</p>
            <p className="text-sm text-gray-600">{p.occupation}</p>
          </div>

          {/* Current stage */}
          <div className="flex items-center justify-center">
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${stage?.color}`}>
              {stage?.label}
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex justify-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-medium hover:bg-cyan-100 transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> Note
            </button>
          </div>

          {/* Archetypes */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Archetypes</h4>
            <div className="flex flex-wrap gap-1.5">
              {p.archetype.map((arch) => (
                <span key={arch} className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-medium">
                  {arch}
                </span>
              ))}
            </div>
          </div>

          {/* Social Vibe */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Social Vibe</h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {p.socialHandles.instagram && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    {p.socialHandles.instagram}
                  </div>
                  {p.socialHandles.followerCount && (
                    <span className="text-xs font-semibold text-gray-600">
                      {formatFollowers(p.socialHandles.followerCount)} followers
                    </span>
                  )}
                </div>
              )}
              {p.socialHandles.tiktok && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Video className="w-4 h-4 text-gray-800" />
                  {p.socialHandles.tiktok}
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          {p.score && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scorecard</h4>
              <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-emerald-700">Average Score</span>
                <span className="text-2xl font-bold text-emerald-700">{p.score}</span>
              </div>
            </div>
          )}

          {/* Red Flags */}
          {p.redFlags && p.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Red Flags
              </h4>
              <div className="space-y-2">
                {p.redFlags.map((flag, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                    {flag.note}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {p.notes && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{p.notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Timeline</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Inbox className="w-3.5 h-3.5 text-gray-400" />
                Applied {formatDate(p.appliedDate)}
              </div>
              {p.lastContact && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                  Last contact {formatDate(p.lastContact)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
            <Archive className="w-3.5 h-3.5" /> Reject
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" /> Advance
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-8 w-auto" />
          <button
            onClick={() => { onClose(); setTimeout(() => openModal("splashScreen"), 150) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            <Tv className="w-3 h-3 mr-1.5" />
            Casting for TV
          </div>
          {currentProject && (
            <span className="text-sm text-gray-500">
              {currentProject.name}
              {!isNonFictionProject && (
                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Switch to Non-Fiction TV project for full features
                </span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Add dropdown */}
          <div className="relative" ref={addDropdownRef}>
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
              <ChevronDown className="w-3 h-3" />
            </button>
            {showAddDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowAddDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-30">
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("addActor") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-600" />
                    Manual Entry
                  </button>
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("uploadCSV") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    Upload File
                  </button>
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("formManager") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Link className="w-4 h-4 text-blue-600" />
                    Open Form
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { setShowAddDropdown(false); openModal("addFromDatabase") }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Database className="w-4 h-4 text-purple-600" />
                    Import from Database
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Advanced button */}
          <button
            onClick={() => setShowAdvancedSettings(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Advanced
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Archetype filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                filterArchetype ? "border-cyan-300 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              {filterArchetype || "All Archetypes"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => { setFilterArchetype(null); setShowFilters(false) }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${!filterArchetype ? "text-cyan-600 font-medium" : "text-gray-700"}`}
                  >
                    All Archetypes
                  </button>
                  {allArchetypes.map((arch) => (
                    <button
                      key={arch}
                      onClick={() => { setFilterArchetype(arch); setShowFilters(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${filterArchetype === arch ? "text-cyan-600 font-medium" : "text-gray-700"}`}
                    >
                      {arch}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bulk actions */}
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Send className="w-4 h-4" />
            Bulk Send
          </button>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            onClick={() => setActiveView("pipeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "pipeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Pipeline
          </button>
          <button
            onClick={() => setActiveView("mix")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeView === "mix" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            Cast Mix
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lists sidebar */}
        {(activeView === "grid" || activeView === "list") && (
          <div className="w-56 border-r border-gray-200 bg-white flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lists</h3>
                <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <button
                onClick={() => setSelectedListId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedListId ? "bg-cyan-50 text-cyan-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Users className="w-4 h-4" />
                All Participants
                <span className="ml-auto text-xs text-gray-400">{participants.length}</span>
              </button>
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedListId === list.id ? "bg-cyan-50 text-cyan-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${list.color}`} />
                  <span className="truncate">{list.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{list.participantIds.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeView === "pipeline" && renderPipelineView()}
        {activeView === "grid" && renderGridView()}
        {activeView === "list" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Archetype</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selectedListId
                    ? filteredParticipants.filter((p) => lists.find((l) => l.id === selectedListId)?.participantIds.includes(p.id))
                    : filteredParticipants
                  ).map((p) => {
                    const stage = FUNNEL_STAGES.find((s) => s.id === p.stage)
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedParticipant(p)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedParticipant?.id === p.id ? "bg-cyan-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-xs">
                              {p.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-900">{p.name}</span>
                                {p.starred && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                {p.redFlags && p.redFlags.length > 0 && <Flag className="w-3 h-3 text-red-500" />}
                              </div>
                              <span className="text-xs text-gray-500">{p.age} • {p.occupation}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {p.archetype.slice(0, 2).map((arch) => (
                              <span key={arch} className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px] font-medium">{arch}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.location}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stage?.color}`}>{stage?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          {p.score ? (
                            <span className="text-sm font-semibold text-emerald-700">{p.score}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.appliedDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-cyan-600"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeView === "mix" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              {/* Cast Mix header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-cyan-600" />
                    Cast Mix Builder
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Drag participants into slots to build your ideal cast composition</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <PieChart className="w-4 h-4" />
                    Demographics
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700">
                    <Sparkles className="w-4 h-4" />
                    Auto-Balance
                  </button>
                </div>
              </div>

              {/* Cast Mix slots */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { id: "lead-male", label: "Lead Male", icon: User, color: "bg-blue-500" },
                  { id: "lead-female", label: "Lead Female", icon: User, color: "bg-pink-500" },
                  { id: "villain", label: "The Villain", icon: Target, color: "bg-red-500" },
                  { id: "wildcard", label: "Wild Card", icon: Sparkles, color: "bg-purple-500" },
                  { id: "underdog", label: "The Underdog", icon: Star, color: "bg-amber-500" },
                  { id: "expert", label: "The Expert", icon: BarChart3, color: "bg-emerald-500" },
                ].map((slot) => {
                  const assignedParticipant = castMixSlots[slot.id] ? participants.find((p) => p.id === castMixSlots[slot.id]) : null
                  const SlotIcon = slot.icon
                  return (
                    <div
                      key={slot.id}
                      className={`relative rounded-xl border-2 border-dashed transition-all ${
                        assignedParticipant
                          ? "border-solid border-gray-200 bg-white"
                          : "border-gray-300 bg-gray-50 hover:border-cyan-300 hover:bg-cyan-50/30"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragOverStage(slot.id) }}
                      onDragLeave={() => setDragOverStage(null)}
                      onDrop={() => {
                        if (draggedParticipant) {
                          setCastMixSlots((prev) => ({ ...prev, [slot.id]: draggedParticipant }))
                        }
                        setDraggedParticipant(null)
                        setDragOverStage(null)
                      }}
                    >
                      <div className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${slot.color}`}>
                        {slot.label}
                      </div>
                      {assignedParticipant ? (
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-lg">
                              {assignedParticipant.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900">{assignedParticipant.name}</h4>
                              <p className="text-xs text-gray-500">{assignedParticipant.age} • {assignedParticipant.location}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {assignedParticipant.archetype.slice(0, 2).map((a) => (
                                  <span key={a} className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[9px] font-medium">{a}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => setCastMixSlots((prev) => ({ ...prev, [slot.id]: null }))}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`p-8 flex flex-col items-center justify-center text-gray-400 transition-colors ${dragOverStage === slot.id ? "bg-cyan-50 text-cyan-600" : ""}`}>
                          <SlotIcon className="w-8 h-8 mb-2 opacity-40" />
                          <p className="text-xs font-medium">Drop participant here</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Available participants for dragging */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Available Participants ({filteredParticipants.filter((p) => !Object.values(castMixSlots).includes(p.id)).length})
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {filteredParticipants
                    .filter((p) => !Object.values(castMixSlots).includes(p.id))
                    .map((p) => renderParticipantCard(p, true))}
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedParticipant && renderParticipantDetail()}
      </div>

      {/* Stats footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span><strong className="text-gray-900">{participants.length}</strong> Total Participants</span>
          <span><strong className="text-amber-600">{participants.filter((p) => p.starred).length}</strong> Starred</span>
          <span><strong className="text-emerald-600">{participants.filter((p) => p.stage === "locked").length}</strong> Locked</span>
          <span><strong className="text-red-600">{participants.filter((p) => p.redFlags && p.redFlags.length > 0).length}</strong> Red Flags</span>
        </div>
        <div className="text-xs text-gray-400">
          Drag cards between columns to move through the funnel
        </div>
      </div>

      {/* Advanced Settings Modal */}
      {showAdvancedSettings && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowAdvancedSettings(false)} />
          <div className="fixed inset-y-4 right-4 w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-600" />
                Advanced Settings
              </h3>
              <button onClick={() => setShowAdvancedSettings(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Funnel Stages */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Pipeline Stages</h4>
                <div className="space-y-2">
                  {FUNNEL_STAGES.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                      <span className="ml-auto text-xs text-gray-400">{participantsByStage[stage.id].length}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-advance rules */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Auto-Advance Rules</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600">Auto-advance after phone interview complete</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600">Require background check before Final Mix</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" defaultChecked />
                    <span className="text-sm text-gray-600">Flag participants with social media issues</span>
                  </label>
                </div>
              </div>

              {/* Scoring weights */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Scoring Weights</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">On-Camera Presence</span>
                      <span className="text-gray-900 font-medium">30%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={30} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Story Potential</span>
                      <span className="text-gray-900 font-medium">25%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={25} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Social Following</span>
                      <span className="text-gray-900 font-medium">20%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={20} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Archetype Fit</span>
                      <span className="text-gray-900 font-medium">25%</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600" defaultValue={25} />
                  </div>
                </div>
              </div>

              {/* Notification settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Notifications</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" defaultChecked />
                    <span className="text-sm text-gray-600">Email when new applications arrive</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" defaultChecked />
                    <span className="text-sm text-gray-600">Daily digest of pipeline changes</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                    <span className="text-sm text-gray-600">Alert when background check returns</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAdvancedSettings(false)}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
