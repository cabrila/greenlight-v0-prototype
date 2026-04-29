"use client"

import { X, ExternalLink } from "lucide-react"
import { CastingCall } from "@/types/public-casting"

interface CastingCallPreviewModalProps {
  castingCall: CastingCall
  onClose: () => void
}

export default function CastingCallPreviewModal({ castingCall, onClose }: CastingCallPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#1a4a2a] to-[#0f1f17] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white font-sans">Form Preview</h2>
            <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-full font-sans">
              Preview Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(castingCall.shareableLink, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white/70 hover:text-white text-sm transition-colors font-sans"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/20 rounded-full text-violet-300 text-sm mb-4 font-sans">
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
                <label className="block text-sm font-medium text-white/80 mb-1.5 font-sans">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    placeholder={field.placeholder}
                    disabled
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white/50 placeholder-white/30 font-sans resize-none cursor-not-allowed"
                  />
                ) : field.type === "select" ? (
                  <select
                    disabled
                    className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white/50 font-sans cursor-not-allowed"
                  >
                    <option>{field.placeholder || "Select an option"}</option>
                    {field.options?.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled
                    className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white/50 placeholder-white/30 font-sans cursor-not-allowed"
                  />
                )}
              </div>
            ))}

            {/* Submit Button Preview */}
            <button
              disabled
              className="w-full py-3 bg-emerald-500/50 rounded-lg text-white/70 font-semibold font-sans cursor-not-allowed mt-6"
            >
              Submit Application
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#0f1f17]/50 shrink-0">
          <p className="text-center text-sm text-white/40 font-sans">
            This is a preview of how actors will see your casting form.
          </p>
        </div>
      </div>
    </div>
  )
}
