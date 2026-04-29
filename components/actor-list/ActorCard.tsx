"use client"

import { useState } from "react"
import { Pencil, Trash2, Phone, Mail, X, Save } from "lucide-react"
import { Actor } from "@/types/actor-list"

interface ActorCardProps {
  actor: Actor
  onUpdate: (actor: Actor) => void
  onDelete: () => void
}

export default function ActorCard({ actor, onUpdate, onDelete }: ActorCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedActor, setEditedActor] = useState(actor)

  const handleSave = () => {
    onUpdate(editedActor)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedActor(actor)
    setIsEditing(false)
  }

  // Edit Mode
  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-emerald-500/50 bg-[#1a2e23]">
        {/* Actor Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Actor Name
          </label>
          <input
            type="text"
            value={editedActor.name}
            onChange={(e) => setEditedActor({ ...editedActor, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Age and Playing Age */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Age
            </label>
            <input
              type="number"
              value={editedActor.age}
              onChange={(e) => setEditedActor({ ...editedActor, age: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Playing Age
            </label>
            <input
              type="text"
              value={editedActor.playingAge}
              onChange={(e) => setEditedActor({ ...editedActor, playingAge: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={editedActor.phone}
            onChange={(e) => setEditedActor({ ...editedActor, phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={editedActor.email}
            onChange={(e) => setEditedActor({ ...editedActor, email: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Headshot URL */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Headshot (URL)
          </label>
          <input
            type="url"
            value={editedActor.headshotUrl}
            onChange={(e) => setEditedActor({ ...editedActor, headshotUrl: e.target.value })}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 text-sm"
          />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            Notes
          </label>
          <textarea
            value={editedActor.notes}
            onChange={(e) => setEditedActor({ ...editedActor, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 bg-[#0f1f17] border border-white/10 rounded-lg text-white font-sans focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-sans">Delete</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-sans">Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-sans">Save</span>
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
          title="Edit actor"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete actor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Header with Headshot and Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 shrink-0">
          {actor.headshotUrl ? (
            <img
              src={actor.headshotUrl}
              alt={actor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-xl font-bold">
              {actor.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 pr-16">
          <h3 className="text-lg font-bold text-white uppercase tracking-wide font-sans truncate">
            {actor.name}
          </h3>
          <p className="text-sm font-sans">
            <span className="text-white/60">AGE</span>{" "}
            <span className="text-white">{actor.age}</span>{" "}
            <span className="text-white/60 ml-2">PLAYS</span>{" "}
            <span className="text-emerald-400">{actor.playingAge}</span>
          </p>
        </div>
      </div>

      {/* Contact Details */}
      <div className="p-3 bg-[#0f1f17] rounded-lg mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          Contact Details
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-white/40" />
            <span className="text-white/80 font-sans">{actor.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-white/40" />
            <span className="text-white/80 font-sans">{actor.email}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {actor.notes && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Notes
          </p>
          <p className="text-sm text-white/70 font-sans leading-relaxed">
            {actor.notes}
          </p>
        </div>
      )}
    </div>
  )
}
