"use client"

import { useState, useEffect, useRef } from "react"
import { X, Check } from "lucide-react"

interface EditProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newName: string) => void
  currentName: string
  title: string
  label?: string
}

export default function EditProjectModal({
  isOpen,
  onClose,
  onSave,
  currentName,
  title,
  label = "Project Name",
}: EditProjectModalProps) {
  const [name, setName] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset name when modal opens with new currentName
  useEffect(() => {
    if (isOpen) {
      setName(currentName)
      // Focus input after a small delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, currentName])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSave(name.trim())
      onClose()
    }
  }

  const hasChanged = name.trim() !== currentName

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#1a2e23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="edit-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Title */}
          <h2
            id="edit-modal-title"
            className="text-xl font-bold text-white mb-6 font-sans"
          >
            {title}
          </h2>

          {/* Input */}
          <div className="mb-6">
            <label className="block text-sm text-white/60 mb-2 font-sans">
              {label}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-sans"
              placeholder="Enter name..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-semibold transition-colors font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !hasChanged}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-2 font-sans"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
