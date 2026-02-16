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
  Package,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Layout,
  CheckCircle,
  XCircle,
  HelpCircle,
  Upload,
  Trash2,
  Pencil,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "./ModalManager"
import type { ProjectProp, PropVote, PropComment, PropAvailability } from "@/types/casting"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VoteValue = "yes" | "no" | "maybe"

/* The global inventory is separate from the per-project prop list.    */
/* It lives in local component state (a real app would use a DB).      */

interface InventoryItem {
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
  availability: { id: string; day: string; startTime: string; endTime: string }[]
  status: "available" | "in-use" | "maintenance" | "retired"
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORIES = ["Cameras", "Lenses", "Lighting", "Audio", "Grip", "Set Dressing", "Wardrobe", "Vehicles", "Weapons", "Misc"]
const STATUS_OPTIONS: { value: InventoryItem["status"]; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "in-use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
]

/* ------------------------------------------------------------------ */
/*  Mock inventory data                                                */
/* ------------------------------------------------------------------ */

function generateMockInventory(): InventoryItem[] {
  return [
    { id: "p1", name: "Arri True Blue", model: "T5", category: "Lighting", brand: "ARRI", serialNumber: "ATB-00192", skuBarcode: "7891234560", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$1,200", quantity: 3, bookedTo: null, availability: [], status: "available" },
    { id: "p2", name: "RED V-Raptor", model: "8K VV", category: "Cameras", brand: "RED", serialNumber: "RVR-90234", skuBarcode: "7891234561", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$2,500", quantity: 2, bookedTo: null, availability: [], status: "available" },
    { id: "p3", name: "Sennheiser MKH 416", model: "MKH 416", category: "Audio", brand: "Sennheiser", serialNumber: "SMK-44210", skuBarcode: "7891234562", notes: "Slightly worn windscreen", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Bought", unitPrice: "$999", quantity: 4, bookedTo: null, availability: [], status: "available" },
    { id: "p4", name: "Dana Dolly", model: "Portable", category: "Grip", brand: "Dana Dolly", serialNumber: "DD-11002", skuBarcode: "7891234563", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$350", quantity: 1, bookedTo: "Jurassic Park - Remake", availability: [], status: "in-use" },
    { id: "p5", name: "Kino Flo Celeb 450Q", model: "Celeb 450Q", category: "Lighting", brand: "Kino Flo", serialNumber: "KFC-78301", skuBarcode: "7891234564", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$800", quantity: 2, bookedTo: null, availability: [], status: "available" },
    { id: "p6", name: "Ultra Panavision 70", model: "Ultra 70", category: "Lenses", brand: "Panavision", serialNumber: "4CE0460D0G", skuBarcode: "1234567890", notes: "Lens shows minor dust inside, does not affect image quality.", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$60,000", quantity: 1, bookedTo: null, availability: [], status: "available" },
    { id: "p7", name: "Matthews C-Stand", model: "40\"", category: "Grip", brand: "Matthews", serialNumber: "MCS-20102", skuBarcode: "7891234566", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Bought", unitPrice: "$180", quantity: 12, bookedTo: null, availability: [], status: "available" },
    { id: "p8", name: "Lectrosonics SMWB", model: "SMWB", category: "Audio", brand: "Lectrosonics", serialNumber: "LSM-66102", skuBarcode: "7891234567", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$1,800", quantity: 6, bookedTo: "Avatar 3", availability: [], status: "in-use" },
    { id: "p9", name: "DJI Ronin 2", model: "Ronin 2", category: "Grip", brand: "DJI", serialNumber: "DJR-34501", skuBarcode: "7891234568", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$450", quantity: 2, bookedTo: null, availability: [], status: "available" },
    { id: "p10", name: "Chimera Softbox", model: "Large", category: "Lighting", brand: "Chimera", serialNumber: "CSB-90001", skuBarcode: "7891234569", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Bought", unitPrice: "$320", quantity: 5, bookedTo: null, availability: [], status: "available" },
    { id: "p11", name: "Mole Richardson", model: "Baby 2K", category: "Lighting", brand: "Mole", serialNumber: "MRB-00442", skuBarcode: "7891234570", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$600", quantity: 4, bookedTo: "Stranger Things S6", availability: [], status: "in-use" },
    { id: "p12", name: "Cooke S4/i", model: "50mm T2", category: "Lenses", brand: "Cooke", serialNumber: "CS4-12093", skuBarcode: "7891234571", notes: "", imageUrl: "/placeholder.svg?height=120&width=160", purchaseType: "Rental", unitPrice: "$18,000", quantity: 1, bookedTo: null, availability: [], status: "available" },
  ]
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

/* ------------------------------------------------------------------ */
/*  Image helpers                                                      */
/* ------------------------------------------------------------------ */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

/* ------------------------------------------------------------------ */
/*  Floating-label form fields (matching reference image 2)            */
/* ------------------------------------------------------------------ */

function FloatingField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 peer placeholder-transparent"
        placeholder={placeholder || label}
      />
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
    </div>
  )
}

function FloatingSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] | string[] }) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
      >
        <option value="">Select...</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">{label}</label>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Image Upload Placeholder (click to upload)                         */
/* ------------------------------------------------------------------ */

function ImageUploadBox({ imageUrl, onImageChange, className }: { imageUrl: string; onImageChange: (url: string) => void; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isPlaceholder = imageUrl.includes("placeholder.svg")

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return
    const dataUrl = await readFileAsDataUrl(file)
    onImageChange(dataUrl)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-xl border border-gray-300 bg-white overflow-hidden cursor-pointer hover:border-emerald-400 transition-colors group ${className || "w-32 h-[72px]"}`}
    >
      {isPlaceholder ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
          <Upload className="w-6 h-6 mb-0.5" />
          <span className="text-[9px] font-medium">Upload</span>
        </div>
      ) : (
        <>
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
            <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = "" }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Add Item Sub-Modal                                                 */
/* ------------------------------------------------------------------ */

function AddItemModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: InventoryItem) => void }) {
  const [form, setForm] = useState({ name: "", model: "", category: "", serialNumber: "", brand: "", skuBarcode: "", notes: "", purchaseType: "", unitPrice: "", quantity: 1 })
  const [imageUrl, setImageUrl] = useState("/placeholder.svg?height=120&width=160")
  const [availSlots, setAvailSlots] = useState<{ id: string; day: string; startTime: string; endTime: string }[]>([
    { id: uid(), day: "", startTime: "09:00", endTime: "17:00" },
  ])

  const update = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = () => {
    if (!form.name.trim()) return
    const newItem: InventoryItem = {
      id: `p-${uid()}`,
      name: form.name,
      model: form.model,
      category: form.category || "Misc",
      brand: form.brand,
      serialNumber: form.serialNumber,
      skuBarcode: form.skuBarcode,
      notes: form.notes,
      imageUrl,
      purchaseType: form.purchaseType || "To Procure",
      unitPrice: form.unitPrice || "$0",
      quantity: form.quantity,
      bookedTo: null,
      availability: availSlots.filter((s) => s.day),
      status: "available",
    }
    onAdd(newItem)
    onClose()
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Item</h2>
              <p className="text-sm text-gray-500 mt-0.5">Register an item with the inventory system</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Row 1 */}
          <div className="flex gap-4">
            <div className="flex-1"><FloatingField label="Name" value={form.name} onChange={(v) => update("name", v)} /></div>
            <div className="flex-1"><FloatingField label="Model" value={form.model} onChange={(v) => update("model", v)} /></div>
            <ImageUploadBox imageUrl={imageUrl} onImageChange={setImageUrl} />
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
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none peer placeholder-transparent" placeholder="Notes" />
            <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">Notes</label>
          </div>

          {/* Budgeting */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Budgeting / Accounting</h3>
            <p className="text-xs text-gray-500 mb-3">Used for generating cost reports.</p>
            <div className="grid grid-cols-2 gap-4">
              <FloatingSelect label="Purchase Type" value={form.purchaseType} onChange={(v) => update("purchaseType", v)} options={["Bought", "Rental", "Lease", "To Procure"]} />
              <FloatingField label="Unit Price" value={form.unitPrice} onChange={(v) => update("unitPrice", v)} placeholder="$0.00" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Availability</h3>
            <p className="text-xs text-gray-500 mb-3">Define when this item can be used.</p>
            {availSlots.map((slot, idx) => (
              <div key={slot.id} className="grid grid-cols-[1fr_auto_auto] gap-3 mb-3">
                <div className="relative">
                  <select value={slot.day} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], day: e.target.value }; setAvailSlots(u) }} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                    <option value="">Select the day</option>
                    {weekdays.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input type="time" value={slot.startTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], startTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="time" value={slot.endTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], endTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Weekday
              </button>
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add specific date
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={!form.name.trim()} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              Add Item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit Item Modal (pre-populated, status, delete availability)       */
/* ------------------------------------------------------------------ */

function EditItemModal({ item, onClose, onSave }: { item: InventoryItem | ProjectProp; onClose: () => void; onSave: (updated: InventoryItem | ProjectProp) => void }) {
  const [form, setForm] = useState({
    name: item.name,
    model: item.model,
    category: item.category,
    serialNumber: item.serialNumber,
    skuBarcode: item.skuBarcode,
    brand: item.brand,
    notes: item.notes,
    purchaseType: item.purchaseType,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    status: item.status,
  })
  const [imageUrl, setImageUrl] = useState(item.imageUrl)
  const [availSlots, setAvailSlots] = useState<{ id: string; day: string; startTime: string; endTime: string }[]>(
    item.availability.length > 0 ? item.availability.map((a) => ({ id: "id" in a ? (a as any).id : uid(), day: a.day, startTime: a.startTime, endTime: a.endTime })) : [{ id: uid(), day: "", startTime: "09:00", endTime: "17:00" }]
  )

  const update = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }))
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  const handleDeleteSlot = (slotId: string) => {
    setAvailSlots((s) => s.filter((slot) => slot.id !== slotId))
  }

  const handleSave = () => {
    onSave({
      ...item,
      ...form,
      imageUrl,
      availability: availSlots.filter((s) => s.day),
    } as any)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70] p-4">
      <div className="bg-gray-100 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Item</h2>
              <p className="text-sm text-gray-500 mt-0.5">Modify item details and availability</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Row 1 */}
          <div className="flex gap-4">
            <div className="flex-1"><FloatingField label="Name" value={form.name} onChange={(v) => update("name", v)} /></div>
            <div className="flex-1"><FloatingField label="Model" value={form.model} onChange={(v) => update("model", v)} /></div>
            <ImageUploadBox imageUrl={imageUrl} onImageChange={setImageUrl} />
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
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} className="w-full px-4 pt-6 pb-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none peer placeholder-transparent" placeholder="Notes" />
            <label className="absolute left-4 top-2 text-xs text-gray-500 transition-all pointer-events-none">Notes</label>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Status</h3>
            <p className="text-xs text-gray-500 mb-3">Current item status.</p>
            <FloatingSelect label="Status" value={form.status} onChange={(v) => update("status", v)} options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
          </div>

          {/* Budgeting */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Budgeting / Accounting</h3>
            <p className="text-xs text-gray-500 mb-3">Used for generating cost reports.</p>
            <div className="grid grid-cols-2 gap-4">
              <FloatingSelect label="Purchase Type" value={form.purchaseType} onChange={(v) => update("purchaseType", v)} options={["Bought", "Rental", "Lease", "To Procure"]} />
              <FloatingField label="Unit Price" value={form.unitPrice} onChange={(v) => update("unitPrice", v)} placeholder="$0.00" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-base font-bold text-gray-900">Availability</h3>
            <p className="text-xs text-gray-500 mb-3">Define when this item can be used.</p>
            {availSlots.map((slot, idx) => (
              <div key={slot.id} className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <select value={slot.day} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], day: e.target.value }; setAvailSlots(u) }} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                    <option value="">Select the day</option>
                    {weekdays.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <input type="time" value={slot.startTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], startTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="time" value={slot.endTime} onChange={(e) => { const u = [...availSlots]; u[idx] = { ...u[idx], endTime: e.target.value }; setAvailSlots(u) }} className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0" title="Delete slot">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Weekday
              </button>
              <button onClick={() => setAvailSlots((s) => [...s, { id: uid(), day: "", startTime: "09:00", endTime: "17:00" }])} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-white transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add specific date
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-white transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Vote Button                                                        */
/* ------------------------------------------------------------------ */

function VoteButton({ label, icon: Icon, isActive, count, activeClassName, onClick }: { label: string; icon: typeof CheckCircle; isActive: boolean; count: number; activeClassName: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${isActive ? activeClassName : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count > 0 && <span className="ml-0.5 text-[10px] opacity-80">{count}</span>}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Comment Section                                                    */
/* ------------------------------------------------------------------ */

function CommentSection({ comments, onAddComment }: { comments: PropComment[]; onAddComment: (text: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (!text.trim()) return
    onAddComment(text.trim())
    setText("")
  }

  return (
    <div className="mt-1">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
        <MessageSquare className="w-3 h-3" />
        {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add comment"}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
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
          <div className="flex items-center gap-1.5">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="Write a comment..." className="flex-1 px-2.5 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 text-gray-900" />
            <button onClick={handleSubmit} disabled={!text.trim()} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    "available": "bg-emerald-100 text-emerald-700",
    "in-use": "bg-blue-100 text-blue-700",
    "maintenance": "bg-amber-100 text-amber-700",
    "retired": "bg-gray-200 text-gray-600",
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg[status] || cfg["available"]}`}>
      {STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Inventory Card (All Items) -- with drag-and-drop image replacement */
/* ------------------------------------------------------------------ */

function InventoryCard({ item, isInProject, onToggleAdd, onEdit, onImageReplace }: { item: InventoryItem; isInProject: boolean; onToggleAdd: (id: string) => void; onEdit: (item: InventoryItem) => void; onImageReplace: (id: string, url: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isBooked = !!item.bookedTo

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }, [])
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }, [])
  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith("image/")) {
      const dataUrl = await readFileAsDataUrl(file)
      onImageReplace(item.id, dataUrl)
    }
  }, [item.id, onImageReplace])

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden group ${isInProject ? "border-emerald-300 ring-1 ring-emerald-200" : isBooked ? "border-orange-200 bg-orange-50/30" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
      <div className="flex p-4 gap-4">
        {/* Image area -- drag target */}
        <div
          className={`w-28 h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center relative transition-all ${isDragOver ? "ring-2 ring-emerald-500 ring-offset-1" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          {isDragOver && (
            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                  <button onClick={() => { onEdit(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit details
                  </button>
                  <button onClick={() => { onToggleAdd(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                    {isInProject ? "Remove from project" : "Add to project"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500">Category <span className="font-medium text-gray-700">{item.category}</span></p>
            <p className="text-xs text-gray-500">Brand <span className="font-medium text-gray-700">{item.brand}</span></p>
            <p className="text-xs text-gray-500">Quantity <span className="font-semibold text-gray-900">{item.quantity}</span></p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        {isBooked ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Booked: {item.bookedTo}
          </span>
        ) : isInProject ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" /> In Project
          </span>
        ) : (
          <button onClick={() => onToggleAdd(item.id)} className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors">
            <Plus className="w-3 h-3" /> Add to project
          </button>
        )}
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="text-[10px] text-gray-400 font-medium">{item.unitPrice}</span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Project Prop Card (My Project tab)                                 */
/* ------------------------------------------------------------------ */

function ProjectPropCard({ item, onVote, onAddComment, onRemove, onAddToCanvas, onEdit, currentUserId }: { item: ProjectProp; onVote: (id: string, vote: VoteValue) => void; onAddComment: (id: string, text: string) => void; onRemove: (id: string) => void; onAddToCanvas: (item: ProjectProp) => void; onEdit: (item: ProjectProp) => void; currentUserId: string | undefined }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const userVote = item.votes.find((v) => v.userId === currentUserId)?.vote
  const yesCt = item.votes.filter((v) => v.vote === "yes").length
  const noCt = item.votes.filter((v) => v.vote === "no").length
  const maybeCt = item.votes.filter((v) => v.vote === "maybe").length

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden hover:shadow-sm">
      <div className="flex p-4 gap-4">
        <div className="w-28 h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                  <button onClick={() => { onEdit(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit details
                  </button>
                  <button onClick={() => { onAddToCanvas(item); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Layout className="w-3.5 h-3.5" /> Add to Canvas
                  </button>
                  <button onClick={() => { onRemove(item.id); setMenuOpen(false) }} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-500">Category <span className="font-medium text-gray-700">{item.category}</span></p>
            <p className="text-xs text-gray-500">Brand <span className="font-medium text-gray-700">{item.brand}</span></p>
            <p className="text-xs text-gray-500">Quantity <span className="font-semibold text-gray-900">{item.quantity}</span></p>
          </div>
        </div>
      </div>

      {/* Vote row */}
      <div className="px-4 pb-2 flex items-center gap-1 flex-wrap">
        <VoteButton label="Yes" icon={CheckCircle} isActive={userVote === "yes"} count={yesCt} activeClassName="bg-emerald-100 text-emerald-700" onClick={() => onVote(item.id, "yes")} />
        <VoteButton label="No" icon={XCircle} isActive={userVote === "no"} count={noCt} activeClassName="bg-red-100 text-red-700" onClick={() => onVote(item.id, "no")} />
        <VoteButton label="Maybe" icon={HelpCircle} isActive={userVote === "maybe"} count={maybeCt} activeClassName="bg-amber-100 text-amber-700" onClick={() => onVote(item.id, "maybe")} />
        <div className="ml-auto">
          <button onClick={() => onAddToCanvas(item)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Add to Canvas">
            <Layout className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Canvas</span>
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="px-4 pb-3">
        <CommentSection comments={item.comments} onAddComment={(text) => onAddComment(item.id, text)} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  List rows (compact views)                                          */
/* ------------------------------------------------------------------ */

function InventoryListRow({ item, isInProject, onToggleAdd, onEdit }: { item: InventoryItem; isInProject: boolean; onToggleAdd: (id: string) => void; onEdit: (item: InventoryItem) => void }) {
  const isBooked = !!item.bookedTo
  return (
    <div className={`flex items-center gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isInProject ? "bg-emerald-50/40" : ""}`}>
      <div className="w-12 h-12 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500">{item.category} &middot; {item.brand}</p>
      </div>
      <div className="hidden sm:block text-xs text-gray-500 w-16 text-center">Qty: {item.quantity}</div>
      <div className="hidden md:block w-36 text-xs">
        {isBooked ? <span className="text-orange-600 font-medium truncate block">{item.bookedTo}</span> : <StatusBadge status={item.status} />}
      </div>
      <div className="text-xs text-gray-500 hidden lg:block w-20 text-right">{item.unitPrice}</div>
      <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onToggleAdd(item.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isInProject ? "bg-emerald-100 text-emerald-700" : "border border-gray-300 text-gray-700 hover:bg-gray-100"}`}>
        {isInProject ? "Added" : "Add"}
      </button>
    </div>
  )
}

function ProjectListRow({ item, onVote, onAddComment, onRemove, onAddToCanvas, onEdit, currentUserId }: { item: ProjectProp; onVote: (id: string, vote: VoteValue) => void; onAddComment: (id: string, text: string) => void; onRemove: (id: string) => void; onAddToCanvas: (item: ProjectProp) => void; onEdit: (item: ProjectProp) => void; currentUserId: string | undefined }) {
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
        <div className="flex items-center gap-1">
          <VoteButton label="Yes" icon={CheckCircle} isActive={userVote === "yes"} count={yesCt} activeClassName="bg-emerald-100 text-emerald-700" onClick={() => onVote(item.id, "yes")} />
          <VoteButton label="No" icon={XCircle} isActive={userVote === "no"} count={noCt} activeClassName="bg-red-100 text-red-700" onClick={() => onVote(item.id, "no")} />
          <VoteButton label="Maybe" icon={HelpCircle} isActive={userVote === "maybe"} count={maybeCt} activeClassName="bg-amber-100 text-amber-700" onClick={() => onVote(item.id, "maybe")} />
        </div>
        <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onAddToCanvas(item)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Add to Canvas">
          <Layout className="w-4 h-4" />
        </button>
        <button onClick={() => onRemove(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Remove from project">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="ml-16 mt-1">
        <CommentSection comments={item.comments} onAddComment={(text) => onAddComment(item.id, text)} />
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
  const { state, dispatch } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const projectId = currentProject?.id

  /* ---- Global inventory (component state) ---- */
  const [inventory, setInventory] = useState<InventoryItem[]>(generateMockInventory)

  /* ---- Project props (from context, persisted) ---- */
  const projectProps: ProjectProp[] = currentProject?.props || []

  const syncProjectProps = useCallback(
    (updater: (prev: ProjectProp[]) => ProjectProp[]) => {
      if (!projectId) return
      const next = updater(projectProps)
      dispatch({ type: "SET_PROJECT_PROPS", payload: { projectId, props: next } })
    },
    [projectId, projectProps, dispatch],
  )

  /* ---- UI state ---- */
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "project">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null)
  const [editingProjectProp, setEditingProjectProp] = useState<ProjectProp | null>(null)

  const currentUserId = state.currentUser?.id

  /* ---- Helpers: check if inventory item is in project ---- */
  const projectPropIds = useMemo(() => new Set(projectProps.map((p) => p.id)), [projectProps])

  /* ---- Filtered items ---- */
  const filteredInventory = useMemo(() => {
    let items = inventory
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (categoryFilter) items = items.filter((p) => p.category === categoryFilter)
    return items
  }, [inventory, searchTerm, categoryFilter])

  const filteredProjectProps = useMemo(() => {
    let items = projectProps
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (categoryFilter) items = items.filter((p) => p.category === categoryFilter)
    return items
  }, [projectProps, searchTerm, categoryFilter])

  const availableCategories = useMemo(() => {
    const cats = new Set(inventory.map((p) => p.category))
    return Array.from(cats).sort()
  }, [inventory])

  /* ---- Handlers ---- */
  const handleToggleAdd = (id: string) => {
    if (projectPropIds.has(id)) {
      // remove
      syncProjectProps((prev) => prev.filter((p) => p.id !== id))
    } else {
      // add
      const inv = inventory.find((p) => p.id === id)
      if (!inv) return
      const newProp: ProjectProp = {
        ...inv,
        votes: [],
        comments: [],
        availability: inv.availability,
      }
      syncProjectProps((prev) => [...prev, newProp])
    }
  }

  const handleVote = (id: string, vote: VoteValue) => {
    if (!currentUserId) return
    syncProjectProps((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const existing = p.votes.findIndex((v) => v.userId === currentUserId)
        const newVotes = [...p.votes]
        if (existing >= 0) {
          if (newVotes[existing].vote === vote) newVotes.splice(existing, 1)
          else newVotes[existing] = { userId: currentUserId, vote }
        } else {
          newVotes.push({ userId: currentUserId, vote })
        }
        return { ...p, votes: newVotes }
      }),
    )
  }

  const handleAddComment = (propId: string, text: string) => {
    if (!state.currentUser) return
    const newComment: PropComment = {
      id: `c-${uid()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userInitials: state.currentUser.initials,
      text,
      timestamp: Date.now(),
    }
    syncProjectProps((prev) => prev.map((p) => (p.id === propId ? { ...p, comments: [...p.comments, newComment] } : p)))
  }

  const handleRemoveFromProject = (id: string) => {
    syncProjectProps((prev) => prev.filter((p) => p.id !== id))
  }

  const handleAddToCanvas = (item: ProjectProp) => {
    onClose()
    setTimeout(() => openModal("canvas"), 150)
  }

  const handleAddInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev])
  }

  const handleSaveInventoryEdit = (updated: InventoryItem | ProjectProp) => {
    setInventory((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } as InventoryItem : p)))
    // Also update in project props if it exists there
    if (projectPropIds.has(updated.id)) {
      syncProjectProps((prev) => prev.map((p) => (p.id === updated.id ? { ...p, name: updated.name, model: updated.model, category: updated.category, brand: updated.brand, serialNumber: updated.serialNumber, skuBarcode: updated.skuBarcode, notes: updated.notes, imageUrl: updated.imageUrl, purchaseType: updated.purchaseType, unitPrice: updated.unitPrice, quantity: updated.quantity, status: updated.status, availability: updated.availability } : p)))
    }
    setEditingInventoryItem(null)
  }

  const handleSaveProjectPropEdit = (updated: InventoryItem | ProjectProp) => {
    syncProjectProps((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } as ProjectProp : p)))
    // Also update in inventory
    setInventory((prev) => prev.map((p) => (p.id === updated.id ? { ...p, name: updated.name, model: updated.model, category: updated.category, brand: updated.brand, serialNumber: updated.serialNumber, skuBarcode: updated.skuBarcode, notes: updated.notes, imageUrl: updated.imageUrl, purchaseType: updated.purchaseType, unitPrice: updated.unitPrice, quantity: updated.quantity, status: updated.status, availability: updated.availability } as InventoryItem : p)))
    setEditingProjectProp(null)
  }

  const handleImageReplace = (id: string, url: string) => {
    setInventory((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl: url } : p)))
    if (projectPropIds.has(id)) {
      syncProjectProps((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl: url } : p)))
    }
  }

  const isProjectTab = activeTab === "project"

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-8 w-auto" />
          <div className="inline-flex items-center bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">Props</div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white min-w-[220px]">
          <span className="text-xs text-gray-500">Project</span>
          <span className="text-sm font-medium text-gray-900 truncate">{currentProject?.name || "No Project"}</span>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setActiveTab("all")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All Items</button>
          <button onClick={() => setActiveTab("project")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === "project" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            My Project
            {projectProps.length > 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{projectProps.length}</span>}
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`} title="Grid view"><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`} title="List view"><List className="w-4 h-4" /></button>
        </div>

        <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-lg border transition-colors ${showFilters ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`} title="Filters">
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-400 text-gray-900" />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Category Filter */}
      {showFilters && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-white border-b border-gray-200 shrink-0 overflow-x-auto">
          <span className="text-xs text-gray-500 shrink-0">Category:</span>
          <button onClick={() => setCategoryFilter("")} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${categoryFilter === "" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>All</button>
          {availableCategories.map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${categoryFilter === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{cat}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {isProjectTab ? (
          /* ----- My Project Tab ----- */
          filteredProjectProps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No props added to this project yet</p>
              <p className="text-gray-400 text-xs mt-1">Browse the All Items tab and add props to your project</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjectProps.map((item) => (
                <ProjectPropCard key={item.id} item={item} onVote={handleVote} onAddComment={handleAddComment} onRemove={handleRemoveFromProject} onAddToCanvas={handleAddToCanvas} onEdit={(i) => setEditingProjectProp(i)} currentUserId={currentUserId} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredProjectProps.map((item) => (
                <ProjectListRow key={item.id} item={item} onVote={handleVote} onAddComment={handleAddComment} onRemove={handleRemoveFromProject} onAddToCanvas={handleAddToCanvas} onEdit={(i) => setEditingProjectProp(i)} currentUserId={currentUserId} />
              ))}
            </div>
          )
        ) : (
          /* ----- All Items Tab ----- */
          filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm font-medium">No props found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => (
                <InventoryCard key={item.id} item={item} isInProject={projectPropIds.has(item.id)} onToggleAdd={handleToggleAdd} onEdit={(i) => setEditingInventoryItem(i)} onImageReplace={handleImageReplace} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredInventory.map((item) => (
                <InventoryListRow key={item.id} item={item} isInProject={projectPropIds.has(item.id)} onToggleAdd={handleToggleAdd} onEdit={(i) => setEditingInventoryItem(i)} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Sub-modals */}
      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onAdd={handleAddInventoryItem} />}
      {editingInventoryItem && <EditItemModal item={editingInventoryItem} onClose={() => setEditingInventoryItem(null)} onSave={handleSaveInventoryEdit} />}
      {editingProjectProp && <EditItemModal item={editingProjectProp} onClose={() => setEditingProjectProp(null)} onSave={handleSaveProjectPropEdit} />}
    </div>
  )
}
