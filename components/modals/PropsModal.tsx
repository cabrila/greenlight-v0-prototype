"use client"

import { useState, useMemo, useRef } from "react"
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
  Package,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Layout,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VoteValue = "yes" | "no" | "maybe"

interface PropComment {
  id: string
  userId: string
  userName: string
  userInitials: string
  text: string
  timestamp: Date
}

interface PropItem {
  id: string
  name: string
  model: string
  category: string
  brand: string
  serialNumber: string
  skuBarcode: string
  notes: string
  imageUrl: string
  purchaseType: string
  unitPrice: string
  quantity: number
  bookedTo: string | null
  votes: { userId: string; vote: VoteValue }[]
  comments: PropComment[]
  addedToProject: boolean
  availability: { day: string; startTime: string; endTime: string }[]
}

/* ------------------------------------------------------------------ */
/*  Mock prop data                                                     */
/* ------------------------------------------------------------------ */

const CATEGORIES = ["Cameras", "Lenses", "Lighting", "Audio", "Grip", "Set Dressing", "Wardrobe", "Vehicles", "Weapons", "Misc"]

function generateMockProps(): PropItem[] {
  const items: PropItem[] = [
    { id: "p1", name: "Arri True Blue", model: "T5", category: "Lighting", brand: "ARRI", serialNumber: "ATB-00192", skuBarcode: "7891234560", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$1,200", quantity: 3, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p2", name: "RED V-Raptor", model: "8K VV", category: "Cameras", brand: "RED", serialNumber: "RVR-90234", skuBarcode: "7891234561", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$2,500", quantity: 2, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p3", name: "Sennheiser MKH 416", model: "MKH 416", category: "Audio", brand: "Sennheiser", serialNumber: "SMK-44210", skuBarcode: "7891234562", notes: "Slightly worn windscreen", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Bought", unitPrice: "$999", quantity: 4, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p4", name: "Dana Dolly", model: "Portable", category: "Grip", brand: "Dana Dolly", serialNumber: "DD-11002", skuBarcode: "7891234563", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$350", quantity: 1, bookedTo: "Jurassic Park - Remake", votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p5", name: "Kino Flo Celeb 450Q", model: "Celeb 450Q", category: "Lighting", brand: "Kino Flo", serialNumber: "KFC-78301", skuBarcode: "7891234564", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$800", quantity: 2, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p6", name: "Ultra Panavision 70", model: "Ultra 70", category: "Lenses", brand: "Panavision", serialNumber: "4CE0460D0G", skuBarcode: "1234567890", notes: "Lens shows minor dust inside, does not affect image quality.", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$60,000", quantity: 1, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p7", name: "Matthews C-Stand", model: "40\"", category: "Grip", brand: "Matthews", serialNumber: "MCS-20102", skuBarcode: "7891234566", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Bought", unitPrice: "$180", quantity: 12, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p8", name: "Lectrosonics SMWB", model: "SMWB", category: "Audio", brand: "Lectrosonics", serialNumber: "LSM-66102", skuBarcode: "7891234567", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$1,800", quantity: 6, bookedTo: "Avatar 3", votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p9", name: "DJI Ronin 2", model: "Ronin 2", category: "Grip", brand: "DJI", serialNumber: "DJR-34501", skuBarcode: "7891234568", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$450", quantity: 2, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p10", name: "Chimera Softbox", model: "Large", category: "Lighting", brand: "Chimera", serialNumber: "CSB-90001", skuBarcode: "7891234569", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Bought", unitPrice: "$320", quantity: 5, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p11", name: "Mole Richardson", model: "Baby 2K", category: "Lighting", brand: "Mole", serialNumber: "MRB-00442", skuBarcode: "7891234570", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$600", quantity: 4, bookedTo: "Stranger Things S6", votes: [], comments: [], addedToProject: false, availability: [] },
    { id: "p12", name: "Cooke S4/i", model: "50mm T2", category: "Lenses", brand: "Cooke", serialNumber: "CS4-12093", skuBarcode: "7891234571", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$18,000", quantity: 1, bookedTo: null, votes: [], comments: [], addedToProject: false, availability: [] },
  ]
  return items
}

/* ------------------------------------------------------------------ */
/*  Add Item Sub-Modal                                                 */
/* ------------------------------------------------------------------ */

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: PropItem) => void }) {
  const [form, setForm] = useState({
    name: "",
    model: "",
    category: "",
    serialNumber: "",
    brand: "",
    skuBarcode: "",
    notes: "",
    purchaseType: "",
    unitPrice: "",
    quantity: 1,
  })

  const [availSlots, setAvailSlots] = useState<{ day: string; startTime: string; endTime: string }[]>([
    { day: "", startTime: "09:00", endTime: "17:00" },
  ])

  const update = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const newItem: PropItem = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: form.name,
      model: form.model,
      category: form.category || "Misc",
      brand: form.brand,
      serialNumber: form.serialNumber,
      skuBarcode: form.skuBarcode,
      notes: form.notes,
      imageUrl: "/placeholder.svg?height=120&width=160",
      purchaseType: form.purchaseType || "To Procure",
      unitPrice: form.unitPrice || "$0",
      quantity: form.quantity,
      bookedTo: null,
      votes: [],
      comments: [],
      addedToProject: false,
      availability: availSlots.filter((s) => s.day),
    }
    onAdd(newItem)
    onClose()
  }

  const addSlot = () => {
    setAvailSlots((s) => [...s, { day: "", startTime: "09:00", endTime: "17:00" }])
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Item</h2>
              <p className="text-sm text-gray-500 mt-0.5">Register an item with the inventory system</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Row 1 - Name, Model, Image */}
          <div className="flex gap-4">
            <div className="flex-1">
              <FloatingField label="Name" value={form.name} onChange={(v) => update("name", v)} />
            </div>
            <div className="flex-1">
              <FloatingField label="Model" value={form.model} onChange={(v) => update("model", v)} />
            </div>
            <div className="w-32 h-[72px] rounded-xl border border-gray-300 bg-white flex items-center justify-center text-gray-400 overflow-hidden">
              <ImageIcon className="w-8 h-8" />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingSelect label="Category" value={form.category} onChange={(v) => update("category", v)} options={CATEGORIES} />
            <FloatingField label="Serial Number" value={form.serialNumber} onChange={(v) => update("serialNumber", v)} />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-4">
            <FloatingField label="Brand" value={form.brand} onChange={(v) => update("brand", v)} />
            <FloatingField label="Sku / Barcode" value={form.skuBarcode} onChange={(v) => update("skuBarcode", v)} />
          </div>

          {/* Notes */}
          <div className="relative">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none peer placeholder-transparent"
              placeholder="Notes"
            />
            <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">
              Notes
            </label>
          </div>

          {/* Budgeting / Accounting */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Budgeting / Accounting</h3>
            <p className="text-xs text-gray-500 mb-3">Used for generating cost reports.</p>
            <div className="grid grid-cols-2 gap-4">
              <FloatingSelect
                label="Purchase Type"
                value={form.purchaseType}
                onChange={(v) => update("purchaseType", v)}
                options={["Bought", "Rental", "Lease", "To Procure"]}
              />
              <FloatingField label="Unit Price" value={form.unitPrice} onChange={(v) => update("unitPrice", v)} placeholder="$0.00" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Availability</h3>
            <p className="text-xs text-gray-500 mb-3">Define when this item can be used.</p>

            {availSlots.map((slot, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-3 mb-3">
                <div className="relative">
                  <select
                    value={slot.day}
                    onChange={(e) => {
                      const updated = [...availSlots]
                      updated[idx].day = e.target.value
                      setAvailSlots(updated)
                    }}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="">Select the day</option>
                    {weekdays.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const updated = [...availSlots]
                    updated[idx].startTime = e.target.value
                    setAvailSlots(updated)
                  }}
                  className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => {
                    const updated = [...availSlots]
                    updated[idx].endTime = e.target.value
                    setAvailSlots(updated)
                  }}
                  className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}

            <div className="flex gap-3">
              <button
                onClick={addSlot}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Weekday
              </button>
              <button
                onClick={addSlot}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add specific date
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Floating-label input fields (matching image 2)                     */
/* ------------------------------------------------------------------ */

function FloatingField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 peer placeholder-transparent"
        placeholder={placeholder || label}
      />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">
        {label}
      </label>
    </div>
  )
}

function FloatingSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">
        {label}
      </label>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Vote Button                                                        */
/* ------------------------------------------------------------------ */

function VoteButton({
  label,
  icon: Icon,
  isActive,
  count,
  activeClassName,
  onClick,
}: {
  label: string
  icon: typeof CheckCircle
  isActive: boolean
  count: number
  activeClassName: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
        isActive ? activeClassName : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      }`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count > 0 && (
        <span className="ml-0.5 text-[10px] opacity-80">{count}</span>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Comment Section                                                    */
/* ------------------------------------------------------------------ */

function CommentSection({
  comments,
  onAddComment,
}: {
  comments: PropComment[]
  onAddComment: (text: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (!text.trim()) return
    onAddComment(text.trim())
    setText("")
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add comment"}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {/* Existing comments */}
          {comments.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-gray-600">{c.userInitials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-700 leading-snug">{c.text}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{c.userName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Write a comment..."
              className="flex-1 px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 text-gray-900"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Prop Card (grid item) -- All Items tab                             */
/* ------------------------------------------------------------------ */

function PropCard({
  item,
  onToggleAdd,
}: {
  item: PropItem
  onToggleAdd: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isBooked = !!item.bookedTo

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden group ${
        item.addedToProject
          ? "border-emerald-300 ring-1 ring-emerald-200"
          : isBooked
            ? "border-orange-200 bg-orange-50/30"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex p-4 gap-4">
        {/* Image */}
        <div className="w-28 h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                  <button
                    onClick={() => { onToggleAdd(item.id); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {item.addedToProject ? "Remove from project" : "Add to project"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500">
              Category <span className="font-medium text-gray-700">{item.category}</span>
            </p>
            <p className="text-xs text-gray-500">
              Brand <span className="font-medium text-gray-700">{item.brand}</span>
            </p>
            <p className="text-xs text-gray-500">
              Quantity <span className="font-semibold text-gray-900">{item.quantity}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        {isBooked ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Booked: {item.bookedTo}
          </span>
        ) : item.addedToProject ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" />
            In Project
          </span>
        ) : (
          <button
            onClick={() => onToggleAdd(item.id)}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add to project
          </button>
        )}
        <span className="text-[10px] text-gray-400 font-medium">{item.unitPrice}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Project Prop Card -- My Project tab (Yes / No / Maybe + Comments)   */
/* ------------------------------------------------------------------ */

function ProjectPropCard({
  item,
  onVote,
  onAddComment,
  onRemove,
  onAddToCanvas,
  currentUserId,
}: {
  item: PropItem
  onVote: (id: string, vote: VoteValue) => void
  onAddComment: (id: string, text: string) => void
  onRemove: (id: string) => void
  onAddToCanvas: (item: PropItem) => void
  currentUserId: string | undefined
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const userVote = item.votes.find((v) => v.userId === currentUserId)?.vote
  const yesCt = item.votes.filter((v) => v.vote === "yes").length
  const noCt = item.votes.filter((v) => v.vote === "no").length
  const maybeCt = item.votes.filter((v) => v.vote === "maybe").length

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden hover:shadow-sm">
      <div className="flex p-4 gap-4">
        {/* Image */}
        <div className="w-28 h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                  <button
                    onClick={() => { onAddToCanvas(item); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Layout className="w-3.5 h-3.5" />
                    Add to Canvas
                  </button>
                  <button
                    onClick={() => { onRemove(item.id); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove from project
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500">
              Category <span className="font-medium text-gray-700">{item.category}</span>
            </p>
            <p className="text-xs text-gray-500">
              Brand <span className="font-medium text-gray-700">{item.brand}</span>
            </p>
            <p className="text-xs text-gray-500">
              Quantity <span className="font-semibold text-gray-900">{item.quantity}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Vote row */}
      <div className="px-4 pb-2 flex items-center gap-1 flex-wrap">
        <VoteButton
          label="Yes"
          icon={CheckCircle}
          isActive={userVote === "yes"}
          count={yesCt}
          activeClassName="bg-emerald-100 text-emerald-700"
          onClick={() => onVote(item.id, "yes")}
        />
        <VoteButton
          label="No"
          icon={XCircle}
          isActive={userVote === "no"}
          count={noCt}
          activeClassName="bg-red-100 text-red-700"
          onClick={() => onVote(item.id, "no")}
        />
        <VoteButton
          label="Maybe"
          icon={HelpCircle}
          isActive={userVote === "maybe"}
          count={maybeCt}
          activeClassName="bg-amber-100 text-amber-700"
          onClick={() => onVote(item.id, "maybe")}
        />

        <div className="ml-auto">
          <button
            onClick={() => onAddToCanvas(item)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Add to Canvas"
          >
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canvas</span>
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="px-4 pb-3">
        <CommentSection
          comments={item.comments}
          onAddComment={(text) => onAddComment(item.id, text)}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  List Row -- All Items tab (compact view)                           */
/* ------------------------------------------------------------------ */

function PropListRow({
  item,
  onToggleAdd,
}: {
  item: PropItem
  onToggleAdd: (id: string) => void
}) {
  const isBooked = !!item.bookedTo

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        item.addedToProject ? "bg-emerald-50/40" : ""
      }`}
    >
      <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">{item.category} &middot; {item.brand}</p>
      </div>
      <div className="hidden sm:block text-xs text-gray-500 w-16 text-center">Qty: {item.quantity}</div>
      <div className="hidden md:block w-36 text-xs">
        {isBooked ? (
          <span className="text-orange-600 font-medium truncate block">{item.bookedTo}</span>
        ) : (
          <span className="text-emerald-600 font-medium">Available</span>
        )}
      </div>
      <div className="text-xs text-gray-500 hidden lg:block w-20 text-right">{item.unitPrice}</div>
      <button
        onClick={() => onToggleAdd(item.id)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          item.addedToProject
            ? "bg-emerald-100 text-emerald-700"
            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {item.addedToProject ? "Added" : "Add"}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Project List Row -- My Project tab (compact view)                   */
/* ------------------------------------------------------------------ */

function ProjectListRow({
  item,
  onVote,
  onAddComment,
  onRemove,
  onAddToCanvas,
  currentUserId,
}: {
  item: PropItem
  onVote: (id: string, vote: VoteValue) => void
  onAddComment: (id: string, text: string) => void
  onRemove: (id: string) => void
  onAddToCanvas: (item: PropItem) => void
  currentUserId: string | undefined
}) {
  const userVote = item.votes.find((v) => v.userId === currentUserId)?.vote
  const yesCt = item.votes.filter((v) => v.vote === "yes").length
  const noCt = item.votes.filter((v) => v.vote === "no").length
  const maybeCt = item.votes.filter((v) => v.vote === "maybe").length

  return (
    <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-500">{item.category} &middot; {item.brand}</p>
        </div>

        {/* Votes */}
        <div className="flex items-center gap-1">
          <VoteButton label="Yes" icon={CheckCircle} isActive={userVote === "yes"} count={yesCt} activeClassName="bg-emerald-100 text-emerald-700" onClick={() => onVote(item.id, "yes")} />
          <VoteButton label="No" icon={XCircle} isActive={userVote === "no"} count={noCt} activeClassName="bg-red-100 text-red-700" onClick={() => onVote(item.id, "no")} />
          <VoteButton label="Maybe" icon={HelpCircle} isActive={userVote === "maybe"} count={maybeCt} activeClassName="bg-amber-100 text-amber-700" onClick={() => onVote(item.id, "maybe")} />
        </div>

        <button
          onClick={() => onAddToCanvas(item)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Add to Canvas"
        >
          <Layout className="w-4 h-4" />
        </button>

        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Remove from project"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Comments inline */}
      <div className="ml-16 mt-1">
        <CommentSection
          comments={item.comments}
          onAddComment={(text) => onAddComment(item.id, text)}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

interface PropsModalProps {
  onClose: () => void
}

export default function PropsModal({ onClose }: PropsModalProps) {
  const { state } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  const [props, setProps] = useState<PropItem[]>(generateMockProps)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "project">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const currentUserId = state.currentUser?.id

  // Filtered items
  const filtered = useMemo(() => {
    let items = props

    if (activeTab === "project") {
      items = items.filter((p) => p.addedToProject)
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    }

    if (categoryFilter) {
      items = items.filter((p) => p.category === categoryFilter)
    }

    return items
  }, [props, searchTerm, activeTab, categoryFilter])

  const projectItemCount = props.filter((p) => p.addedToProject).length

  const handleToggleAdd = (id: string) => {
    setProps((prev) =>
      prev.map((p) => (p.id === id ? { ...p, addedToProject: !p.addedToProject } : p))
    )
  }

  const handleVote = (id: string, vote: VoteValue) => {
    if (!currentUserId) return
    setProps((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const existing = p.votes.findIndex((v) => v.userId === currentUserId)
        const newVotes = [...p.votes]
        if (existing >= 0) {
          if (newVotes[existing].vote === vote) {
            newVotes.splice(existing, 1) // toggle off
          } else {
            newVotes[existing] = { userId: currentUserId, vote }
          }
        } else {
          newVotes.push({ userId: currentUserId, vote })
        }
        return { ...p, votes: newVotes }
      })
    )
  }

  const handleAddComment = (propId: string, text: string) => {
    if (!state.currentUser) return
    setProps((prev) =>
      prev.map((p) => {
        if (p.id !== propId) return p
        const newComment: PropComment = {
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: state.currentUser!.id,
          userName: state.currentUser!.name,
          userInitials: state.currentUser!.initials,
          text,
          timestamp: new Date(),
        }
        return { ...p, comments: [...p.comments, newComment] }
      })
    )
  }

  const handleRemoveFromProject = (id: string) => {
    setProps((prev) =>
      prev.map((p) => (p.id === id ? { ...p, addedToProject: false } : p))
    )
  }

  const handleAddToCanvas = (item: PropItem) => {
    // Close Props modal, then open Canvas
    onClose()
    setTimeout(() => {
      openModal("canvas")
    }, 150)
  }

  const handleAddItem = (item: PropItem) => {
    setProps((prev) => [item, ...prev])
  }

  // Get unique categories from existing props
  const availableCategories = useMemo(() => {
    const cats = new Set(props.map((p) => p.category))
    return Array.from(cats).sort()
  }, [props])

  const isProjectTab = activeTab === "project"

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <img
            src="/images/gogreenlight-logo.png"
            alt="GoGreenlight"
            className="h-8 w-auto"
          />
          <div className="inline-flex items-center bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            Props
          </div>
        </div>

        {/* Project Selector */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white min-w-[220px]">
          <span className="text-xs text-gray-500">Project</span>
          <span className="text-sm font-medium text-gray-900 truncate">{currentProject?.name || "No Project"}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        {/* Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setActiveTab("project")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "project" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            My Project
            {projectItemCount > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {projectItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        {/* View Mode */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Filter */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-1.5 rounded-lg border transition-colors ${showFilters ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
          title="Filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 text-gray-900"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      {showFilters && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
          <span className="text-xs text-gray-500 shrink-0">Category:</span>
          <button
            onClick={() => setCategoryFilter("")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              categoryFilter === "" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                categoryFilter === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">
              {isProjectTab ? "No props added to this project yet" : "No props found"}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {isProjectTab
                ? "Browse the All Items tab and add props to your project"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) =>
              isProjectTab ? (
                <ProjectPropCard
                  key={item.id}
                  item={item}
                  onVote={handleVote}
                  onAddComment={handleAddComment}
                  onRemove={handleRemoveFromProject}
                  onAddToCanvas={handleAddToCanvas}
                  currentUserId={currentUserId}
                />
              ) : (
                <PropCard
                  key={item.id}
                  item={item}
                  onToggleAdd={handleToggleAdd}
                />
              )
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filtered.map((item) =>
              isProjectTab ? (
                <ProjectListRow
                  key={item.id}
                  item={item}
                  onVote={handleVote}
                  onAddComment={handleAddComment}
                  onRemove={handleRemoveFromProject}
                  onAddToCanvas={handleAddToCanvas}
                  currentUserId={currentUserId}
                />
              ) : (
                <PropListRow
                  key={item.id}
                  item={item}
                  onToggleAdd={handleToggleAdd}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Add Item Sub-Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  )
}
