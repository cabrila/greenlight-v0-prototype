"use client"

import { useState } from "react"
import { Phone, Mail, Pencil, Trash2, X, Save, Tag, Star } from "lucide-react"
import { CastingSubmission } from "@/types/public-casting"
import Image from "next/image"
import ImageModal from "@/components/ui/ImageModal"

interface SubmissionCardProps {
  submission: CastingSubmission
  onUpdate: (updates: Partial<CastingSubmission>) => void
  onDelete: () => void
}

export default function SubmissionCard({ submission, onUpdate, onDelete }: SubmissionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [editData, setEditData] = useState({
    name: submission.name,
    email: submission.email,
    phone: submission.phone || "",
    age: submission.age || "",
    playingAge: submission.playingAge || "",
    notes: submission.notes || "",
    grade: submission.grade || 0,
  })

  const handleSave = () => {
    onUpdate({
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
      age: editData.age,
      playingAge: editData.playingAge,
      notes: editData.notes,
      grade: editData.grade || undefined,
    })
    setIsEditing(false)
  }

  const handleGradeChange = (newGrade: number) => {
    // Immediate update without entering edit mode
    onUpdate({ grade: newGrade })
  }

  // Grade color based on value
  const getGradeColor = (grade: number) => {
    if (grade >= 8) return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30"
    if (grade >= 5) return "text-amber-400 bg-amber-500/20 border-amber-500/30"
    return "text-red-400 bg-red-500/20 border-red-500/30"
  }

  // Edit Mode
  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border border-violet-500/30 bg-[#1a2e23]">
        {/* Form Label */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <Tag className="w-3 h-3 text-violet-400" />
          <span className="text-violet-400 font-sans">{submission.castingCallTitle}</span>
        </div>

        {/* Actor Name */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
            Actor Name
          </label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
          />
        </div>

        {/* Age & Playing Age */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
              Age
            </label>
            <input
              type="text"
              value={editData.age}
              onChange={(e) => setEditData({ ...editData, age: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
              Playing Age
            </label>
            <input
              type="text"
              value={editData.playingAge}
              onChange={(e) => setEditData({ ...editData, playingAge: e.target.value })}
              className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
            Phone
          </label>
          <input
            type="text"
            value={editData.phone}
            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
          />
        </div>

        {/* Grade Slider */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
            Grade (1-10)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={editData.grade}
              onChange={(e) => setEditData({ ...editData, grade: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-[#0f1f17] rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
            <span className={`w-10 text-center font-bold font-sans ${editData.grade > 0 ? getGradeColor(editData.grade).split(" ")[0] : "text-white/40"}`}>
              {editData.grade > 0 ? editData.grade : "-"}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
            Notes
          </label>
          <textarea
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none resize-none font-sans"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-sans text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors font-sans text-sm"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white transition-colors font-sans text-sm"
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
          title="Edit submission"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
          title="Delete submission"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* New Badge */}
      {submission.isNew && (
        <span className="absolute top-4 left-4 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded">
          NEW
        </span>
      )}

      {/* Header with Avatar */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar - Clickable to open modal */}
        <button
          onClick={() => submission.headshot && setShowImageModal(true)}
          className={`w-14 h-14 rounded-full overflow-hidden bg-violet-500/20 flex-shrink-0 transition-all ${
            submission.headshot 
              ? "cursor-pointer hover:ring-2 hover:ring-violet-500/50 hover:ring-offset-2 hover:ring-offset-[#1a2e23]" 
              : "cursor-default"
          }`}
          disabled={!submission.headshot}
          title={submission.headshot ? "Click to view full image" : undefined}
        >
          {submission.headshot ? (
            <Image
              src={submission.headshot}
              alt={submission.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-violet-400 text-xl font-bold">
              {submission.name.charAt(0).toUpperCase()}
            </div>
          )}
        </button>

        {/* Name & Age */}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide truncate pr-20">
            {submission.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {submission.age && (
              <span className="text-white/60">
                AGE <span className="text-white">{submission.age}</span>
              </span>
            )}
            {submission.playingAge && (
              <span className="text-white/60">
                PLAYS <span className="text-emerald-400">{submission.playingAge}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grading System */}
      <div className="mb-4 p-3 bg-[#0f1f17] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" />
            Grade
          </p>
          {submission.grade && (
            <span className={`px-2 py-0.5 text-sm font-bold rounded border ${getGradeColor(submission.grade)}`}>
              {submission.grade}/10
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => handleGradeChange(num)}
              className={`flex-1 h-7 rounded text-xs font-bold transition-all ${
                submission.grade && num <= submission.grade
                  ? num >= 8
                    ? "bg-emerald-500/40 text-emerald-300"
                    : num >= 5
                    ? "bg-amber-500/40 text-amber-300"
                    : "bg-red-500/40 text-red-300"
                  : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/50"
              }`}
              title={`Grade ${num}`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Form Source Label */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-violet-500/10 rounded-lg">
        <Tag className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-sm text-violet-300 font-sans truncate">{submission.castingCallTitle}</span>
      </div>

      {/* Contact Details */}
      <div className="p-3 bg-[#0f1f17] rounded-lg mb-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          Contact Details
        </p>
        <div className="space-y-2">
          {submission.phone && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Phone className="w-4 h-4 text-white/40" />
              <span>{submission.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Mail className="w-4 h-4 text-white/40" />
            <span className="truncate">{submission.email}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {submission.notes && (
        <div className="p-3 bg-[#0f1f17] rounded-lg">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Notes
          </p>
          <p className="text-sm text-white/80 font-sans leading-relaxed">
            {submission.notes}
          </p>
        </div>
      )}

      {/* Submission Time */}
      <div className="mt-3 text-xs text-white/40 font-sans">
        Submitted {submission.submittedAt.toLocaleDateString()} at{" "}
        {submission.submittedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        src={submission.headshot}
        alt={submission.name}
      />
    </div>
  )
}
