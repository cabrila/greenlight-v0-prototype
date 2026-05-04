"use client"

import { useEffect, useCallback } from "react"
import { X, ExternalLink } from "lucide-react"
import { CastingCall } from "@/types/public-casting"

interface CastingCallPreviewModalProps {
  castingCall: CastingCall
  onClose: () => void
}

export default function CastingCallPreviewModal({ castingCall, onClose }: CastingCallPreviewModalProps) {
  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    document.addEventListener("keydown", handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [handleEscape])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full screen on mobile, centered on larger screens */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#1a3a25] sm:rounded-2xl border-0 sm:border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white font-sans">Form Preview</h2>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-sans font-medium">
              Preview Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(castingCall.shareableLink, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white text-sm transition-all font-sans"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full text-emerald-300 text-sm mb-4 font-sans font-medium">
              {castingCall.projectName}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-sans">
              {castingCall.title}
            </h1>
            {castingCall.description && (
              <p className="text-white/60 font-sans max-w-md mx-auto">
                {castingCall.description}
              </p>
            )}
          </div>

          {/* Form Fields Preview */}
          <div className="space-y-4 max-w-md mx-auto">
            {castingCall.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-white/70 mb-1.5 font-sans">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    placeholder={field.placeholder}
                    disabled
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 placeholder-white/30 font-sans resize-none cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                ) : field.type === "select" ? (
                  <select
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 font-sans cursor-not-allowed"
                  >
                    <option>{field.placeholder || "Select an option"}</option>
                    {field.options?.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "image" ? (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white/5 border border-dashed border-white/20 rounded-xl text-white/50 cursor-not-allowed font-sans text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{field.placeholder || "Upload an image"}</span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 placeholder-white/30 font-sans cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                )}
              </div>
            ))}

            {/* Submit Button Preview */}
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans mt-6"
            >
              Submit Application
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/5 shrink-0">
          <p className="text-center text-sm text-white/50 font-sans">
            This is a preview of how actors will see your casting form.
          </p>
        </div>
      </div>
    </div>
  )
}
