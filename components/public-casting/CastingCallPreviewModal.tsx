"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ExternalLink, Send, CheckCircle, ImagePlus, Plus, Trash2, Link, Pencil } from "lucide-react"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import { usePublicCasting } from "./PublicCastingContext"

interface CastingCallPreviewModalProps {
  castingCall: CastingCall
  project?: PublicCastingProject
  onClose: () => void
  onEdit?: () => void
}

// Helper to detect and parse video URLs for embedding
function getVideoEmbedUrl(url: string): { type: "youtube" | "vimeo" | null; embedUrl: string | null } {
  if (!url) return { type: null, embedUrl: null }
  
  // YouTube patterns
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (youtubeMatch) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}` }
  }
  
  // Vimeo patterns
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/)
  if (vimeoMatch) {
    return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
  }
  
  return { type: null, embedUrl: null }
}

export default function CastingCallPreviewModal({ castingCall, project, onClose, onEdit }: CastingCallPreviewModalProps) {
  const { addSubmission } = usePublicCasting()
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [talentPoolConsent, setTalentPoolConsent] = useState(false)

  // Initialize form data
  useEffect(() => {
    const initialData: Record<string, string | string[]> = {}
    castingCall.fields.forEach(field => {
      // Initialize URL and image fields as arrays for multiple entries
      if (field.type === "url" || field.type === "image") {
        initialData[field.label] = []
      } else {
        initialData[field.label] = ""
      }
    })
    setFormData(initialData)
  }, [castingCall.fields])

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

  const handleInputChange = (fieldLabel: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [fieldLabel]: value }))
    // Clear error when user starts typing
    if (errors[fieldLabel]) {
      setErrors(prev => ({ ...prev, [fieldLabel]: false }))
    }
  }

  // Add item to array field (URL or image)
  const handleAddArrayItem = (fieldLabel: string, value: string) => {
    const currentArray = (formData[fieldLabel] as string[]) || []
    setFormData(prev => ({ ...prev, [fieldLabel]: [...currentArray, value] }))
    if (errors[fieldLabel]) {
      setErrors(prev => ({ ...prev, [fieldLabel]: false }))
    }
  }

  // Remove item from array field
  const handleRemoveArrayItem = (fieldLabel: string, index: number) => {
    const currentArray = (formData[fieldLabel] as string[]) || []
    setFormData(prev => ({ 
      ...prev, 
      [fieldLabel]: currentArray.filter((_, i) => i !== index) 
    }))
  }

  // Update item in array field
  const handleUpdateArrayItem = (fieldLabel: string, index: number, value: string) => {
    const currentArray = (formData[fieldLabel] as string[]) || []
    const updated = [...currentArray]
    updated[index] = value
    setFormData(prev => ({ ...prev, [fieldLabel]: updated }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const newErrors: Record<string, boolean> = {}
    let hasErrors = false
    
    castingCall.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.label]
        // Check if array field has at least one item, or string field is not empty
        const isEmpty = Array.isArray(value) ? value.length === 0 : !value?.toString().trim()
        if (isEmpty) {
          newErrors[field.label] = true
          hasErrors = true
        }
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Prevent submission if casting call is completed
    if (castingCall.isCompleted) {
      return
    }

    setIsSubmitting(true)
    
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Add submission to context
    addSubmission(castingCall.id, formData)
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleReset = () => {
    const initialData: Record<string, string | string[]> = {}
    castingCall.fields.forEach(field => {
      if (field.type === "url" || field.type === "image") {
        initialData[field.label] = []
      } else {
        initialData[field.label] = ""
      }
    })
    setFormData(initialData)
    setIsSubmitted(false)
    setErrors({})
    setTalentPoolConsent(false)
  }

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
              Live Test Mode
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-xl text-violet-300 hover:text-violet-200 text-sm transition-all font-sans"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
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
          {isSubmitted ? (
            // Success State
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 font-sans">
                Submission Received!
              </h2>
              <p className="text-white/60 font-sans max-w-sm mb-6">
                Your test submission has been added to the submissions list. Check the Submissions view to see it.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium text-sm transition-all font-sans"
                >
                  Submit Another
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-medium text-sm transition-colors font-sans"
                >
                  Close Preview
                </button>
              </div>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit}>
              {/* Header Image */}
              {castingCall.headerImageUrl && (
                <div className="mb-6 -mx-5 -mt-5">
                  <img
                    src={castingCall.headerImageUrl}
                    alt="Casting call header"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

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

              {/* Form Fields */}
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
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        rows={3}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/30 font-sans resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      >
                        <option value="">{field.placeholder || "Select an option"}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "gender" ? (
                      <select
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Not-specified">Not-specified</option>
                      </select>
                    ) : field.type === "url" ? (
                      // Multiple URL field with video embed support
                      <div className="space-y-2">
                        {((formData[field.label] as string[]) || []).map((url, index) => {
                          const videoEmbed = getVideoEmbedUrl(url)
                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  placeholder={field.placeholder || "https://youtube.com/watch?v=... or https://vimeo.com/..."}
                                  value={url}
                                  onChange={(e) => handleUpdateArrayItem(field.label, index, e.target.value)}
                                  className={`flex-1 px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/30 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                                    errors[field.label] ? "border-red-500/50" : "border-white/10"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArrayItem(field.label, index)}
                                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              {/* Video preview if valid embed URL */}
                              {videoEmbed.embedUrl && (
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-black/20">
                                  <iframe
                                    src={videoEmbed.embedUrl}
                                    title={`Video ${index + 1}`}
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => handleAddArrayItem(field.label, "")}
                          className="flex items-center gap-2 w-full px-4 py-2.5 bg-white/5 border border-dashed border-white/20 rounded-xl text-white/50 hover:bg-white/10 hover:border-white/30 transition-all font-sans text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add {((formData[field.label] as string[]) || []).length === 0 ? "Video URL" : "Another URL"}
                        </button>
                      </div>
                    ) : field.type === "image" ? (
                      // Multiple image upload field
                      <div className="space-y-2">
                        {/* Existing images */}
                        {((formData[field.label] as string[]) || []).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {((formData[field.label] as string[]) || []).map((imgUrl, index) => (
                              <div key={index} className="relative group">
                                <img 
                                  src={imgUrl} 
                                  alt={`Upload ${index + 1}`} 
                                  className="w-20 h-20 rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArrayItem(field.label, index)}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Add image button */}
                        <div
                          className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-white/5 border border-dashed rounded-xl text-white/50 cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all font-sans text-sm ${
                            errors[field.label] ? "border-red-500/50" : "border-white/20"
                          }`}
                          onClick={() => {
                            // Simulate image upload
                            const fakeImageUrl = `https://picsum.photos/seed/${Date.now()}/200/200`
                            handleAddArrayItem(field.label, fakeImageUrl)
                          }}
                        >
                          <ImagePlus className="w-6 h-6" />
                          <span>{field.placeholder || "Click to add an image"}</span>
                        </div>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/30 font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all ${
                          errors[field.label] ? "border-red-500/50" : "border-white/10"
                        }`}
                      />
                    )}
                    {errors[field.label] && (
                      <p className="text-red-400 text-xs mt-1 font-sans">This field is required</p>
                    )}
                  </div>
                ))}

                {/* Talent Pool Consent Checkbox */}
                {castingCall.talentPoolConsentEnabled && castingCall.talentPoolConsentText && (
                  <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={talentPoolConsent}
                        onChange={(e) => setTalentPoolConsent(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-sm text-white/80 group-hover:text-white transition-colors font-sans leading-relaxed">
                        {castingCall.talentPoolConsentText}
                      </span>
                    </label>
                  </div>
                )}

                {/* Completed Notice */}
                {castingCall.isCompleted && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-6">
                    <p className="text-amber-400 text-sm text-center font-sans">
                      This casting call is completed and no longer accepting submissions.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || castingCall.isCompleted}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans mt-6"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : castingCall.isCompleted ? (
                    <>Submissions Closed</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/5 shrink-0">
          <p className="text-center text-sm text-white/50 font-sans">
            {isSubmitted 
              ? "Test submission completed. View results in the Submissions tab."
              : "This is a live test. Submissions will appear in your submissions list."
            }
          </p>
        </div>
      </div>
    </div>
  )
}
