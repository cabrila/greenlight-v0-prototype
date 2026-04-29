"use client"

import { useState } from "react"
import { MapPin, Pencil, Trash2, X, Save } from "lucide-react"
import { Location } from "@/types/location-scouting"

interface LocationCardProps {
  location: Location
  onUpdate: (location: Location) => void
  onDelete: () => void
}

export default function LocationCard({ location, onUpdate, onDelete }: LocationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Location>(location)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(location)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-amber-500/50 bg-[#1a2e23]">
        {/* Character Name Label */}
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Location Name
        </label>
        <input
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-amber-500/50 focus:outline-none"
        />

        {/* Type and Time of Day */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Type
            </label>
            <select
              value={editData.type}
              onChange={(e) => setEditData({ ...editData, type: e.target.value as "INT" | "EXT" })}
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="INT">INT.</option>
              <option value="EXT">EXT.</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Time of Day
            </label>
            <select
              value={editData.timeOfDay}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  timeOfDay: e.target.value as "DAY" | "NIGHT" | "DAWN" | "DUSK",
                })
              }
              className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans border border-white/10 focus:border-amber-500/50 focus:outline-none"
            >
              <option value="DAY">DAY</option>
              <option value="NIGHT">NIGHT</option>
              <option value="DAWN">DAWN</option>
              <option value="DUSK">DUSK</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Description
        </label>
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-amber-500/50 focus:outline-none resize-none"
        />

        {/* Scouting Notes */}
        <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Scouting Notes
        </label>
        <textarea
          value={editData.scoutingNotes}
          onChange={(e) => setEditData({ ...editData, scoutingNotes: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-[#0f1f17] rounded-lg text-white font-sans mb-4 border border-white/10 focus:border-amber-500/50 focus:outline-none resize-none"
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 transition-colors font-sans text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-black font-semibold font-sans text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  // View Mode
  return (
    <div className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors">
      {/* Hover Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
          title="Edit location"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete location"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Header with Icon and Name */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide leading-tight">
            {location.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/60 font-sans">{location.type}.</span>
            <span className="text-xs text-white/40">•</span>
            <span className={`text-xs font-sans ${
              location.timeOfDay === "NIGHT" ? "text-indigo-400" : "text-amber-400"
            }`}>
              {location.timeOfDay}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/70 font-sans leading-relaxed mb-4">
        {location.description}
      </p>

      {/* Scouting Notes */}
      <div className="p-3 bg-[#0f1f17] rounded-lg">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
          Scouting Notes
        </p>
        <p className="text-sm text-white/60 font-sans leading-relaxed">
          {location.scoutingNotes}
        </p>
      </div>
    </div>
  )
}
