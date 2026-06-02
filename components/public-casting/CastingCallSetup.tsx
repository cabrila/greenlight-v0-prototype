"use client"

import { useState, useRef } from "react"
import { ArrowLeft, Plus, Trash2, GripVertical, Copy, Check, ExternalLink, Eye, X, ImagePlus } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { CastingCallField, CastingCall, PublicCastingProject } from "@/types/public-casting"
import CastingCallPreviewModal from "./CastingCallPreviewModal"

interface CastingCallSetupProps {
  onBack: () => void
  onSuccess: () => void
  editingCastingCall?: CastingCall
  editingProject?: PublicCastingProject
}

const fieldTypeOptions = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long Text" },
  { value: "url", label: "URL" },
  { value: "select", label: "Dropdown" },
  { value: "image", label: "Image" },
]

const defaultFields: CastingCallField[] = [
  { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
  { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
  { id: "f3", label: "Phone", type: "phone", required: false, placeholder: "+1-555-0000" },
  { id: "f4", label: "Age", type: "number", required: false, placeholder: "Your age" },
  { id: "f5", label: "Playing Age Range", type: "text", required: false, placeholder: "e.g., 25-35" },
  { id: "f6", label: "Headshot URL", type: "url", required: false, placeholder: "Link to your headshot" },
  { id: "f7", label: "About You", type: "textarea", required: false, placeholder: "Tell us about yourself..." },
]

export default function CastingCallSetup({ onBack, onSuccess, editingCastingCall, editingProject }: CastingCallSetupProps) {
  const { state, createProject, createCastingCall, updateCastingCall } = usePublicCasting()
  
  const isEditing = !!editingCastingCall
  
  const [step, setStep] = useState<"setup" | "success">("setup")
  const [title, setTitle] = useState(editingCastingCall?.title || "")
  const [description, setDescription] = useState(editingCastingCall?.description || "")
  const [projectName, setProjectName] = useState(editingCastingCall?.projectName || editingProject?.name || "")
  const [headerImageUrl, setHeaderImageUrl] = useState(editingCastingCall?.headerImageUrl || "")
  const [fields, setFields] = useState<CastingCallField[]>(editingCastingCall?.fields || defaultFields)
  const [isCompleted, setIsCompleted] = useState(editingCastingCall?.isCompleted || false)
  const [createdLink, setCreatedLink] = useState(editingCastingCall?.shareableLink || "")
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showFieldTypeDropdown, setShowFieldTypeDropdown] = useState(false)
  
  // Header image upload state
  const [isDraggingHeaderImage, setIsDraggingHeaderImage] = useState(false)
  const headerImageInputRef = useRef<HTMLInputElement>(null)

  // Create a preview casting call object for the modal
  const previewCastingCall: CastingCall = {
    id: editingCastingCall?.id || "preview",
    title: title || "Untitled Casting Call",
    description,
    projectName: projectName || "Untitled Project",
    headerImageUrl: headerImageUrl || undefined,
    fields,
    createdAt: editingCastingCall?.createdAt || new Date(),
    isActive: !isCompleted,
    isCompleted,
    shareableLink: createdLink || "https://gogreenlight.ai/cast/preview",
  }

  // Header image upload handlers
  const handleHeaderImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setHeaderImageUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleHeaderImageDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingHeaderImage(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleHeaderImageUpload(file)
    }
  }

  const handleHeaderImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleHeaderImageUpload(file)
    }
    e.target.value = ""
  }

  const handleHeaderImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingHeaderImage(true)
  }

  const handleHeaderImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingHeaderImage(false)
    }
  }

  const addField = (fieldType: CastingCallField["type"]) => {
    const typeLabel = fieldTypeOptions.find(opt => opt.value === fieldType)?.label || "Field"
    const newField: CastingCallField = {
      id: `f${Date.now()}`,
      label: `New ${typeLabel}`,
      type: fieldType,
      required: false,
      placeholder: "",
    }
    setFields([...fields, newField])
    setShowFieldTypeDropdown(false)
  }

  const updateField = (id: string, updates: Partial<CastingCallField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newFields = [...fields]
    const [draggedField] = newFields.splice(draggedIndex, 1)
    newFields.splice(index, 0, draggedField)
    setFields(newFields)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSave = () => {
    if (!title.trim() || !projectName.trim()) return

    if (isEditing && editingProject && editingCastingCall) {
      // Update existing casting call
      updateCastingCall(editingProject.id, editingCastingCall.id, {
        title,
        description,
        projectName,
        headerImageUrl: headerImageUrl || undefined,
        fields,
        isCompleted,
        isActive: !isCompleted,
      })
      setCreatedLink(editingCastingCall.shareableLink)
      setStep("success")
    } else {
      // Create new casting call
      let project = state.projects.find((p) => p.name === projectName)
      if (!project) {
        project = createProject(projectName)
      }

      const castingCall = createCastingCall(project.id, title, description, projectName, fields, headerImageUrl || undefined)
      setCreatedLink(castingCall.shareableLink)
      setStep("success")
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(createdLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments where Clipboard API is blocked
      const textArea = document.createElement("textarea")
      textArea.value = createdLink
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // If both methods fail, just show the link is selected
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
      document.body.removeChild(textArea)
    }
  }

  if (step === "success") {
    return (
      <div className="h-full overflow-y-auto flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          {/* Success Card */}
          <div className="bg-[#1a2e23] border border-emerald-500/30 rounded-2xl p-8 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 font-sans">
              {isEditing ? "Casting Call Updated!" : "Casting Call Created!"}
            </h2>
            <p className="text-white/60 mb-6 font-sans">
              {isEditing 
                ? "Your changes have been saved successfully."
                : "Your public casting form is ready to share with actors."}
            </p>

            {/* Link Box */}
            <div className="bg-[#0f1f17] rounded-lg p-4 mb-6">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-sans">
                Shareable Link
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={createdLink}
                  readOnly
                  className="flex-1 bg-transparent text-white/80 text-sm font-mono truncate outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`p-2 rounded-lg transition-colors ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                  }`}
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Preview Info */}
            <div className="bg-[#0f1f17] rounded-lg p-4 mb-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-1 font-sans">{title}</h3>
              <p className="text-sm text-white/50 font-sans">{projectName}</p>
              {description && (
                <p className="text-sm text-white/60 mt-2 font-sans">{description}</p>
              )}
              <div className="mt-3 text-xs text-white/40 font-sans">
                {fields.length} form fields configured
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onSuccess}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white font-semibold transition-colors font-sans"
              >
                Back to Casting Calls
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 hover:bg-violet-600 rounded-lg text-white font-semibold transition-colors font-sans"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
              <CastingCallPreviewModal
                castingCall={previewCastingCall}
                onClose={() => setShowPreview(false)}
                onEdit={() => setShowPreview(false)}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Back Button */}
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Casting Calls</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-sans">
              {isEditing ? "Edit Casting Call" : "Create Casting Call"}
            </h1>
            <p className="text-white/60 font-sans">
              {isEditing 
                ? "Update your casting form settings and fields."
                : "Set up a custom form for actors to submit their information."}
            </p>
          </div>
          
          {/* Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:cursor-not-allowed border border-white/10 rounded-lg text-white/70 hover:text-white disabled:text-white/30 transition-colors font-sans"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-[#1a2e23] border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 font-sans">Basic Information</h2>
            
            <div className="space-y-4">
              {/* Header Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                  Header Image (Optional)
                </label>
                <div
                  onDragOver={handleHeaderImageDragOver}
                  onDragLeave={handleHeaderImageDragLeave}
                  onDrop={handleHeaderImageDrop}
                  onClick={() => headerImageInputRef.current?.click()}
                  className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                    isDraggingHeaderImage
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/20 hover:border-violet-500/50 bg-[#0f1f17]"
                  }`}
                >
                  {headerImageUrl ? (
                    <div className="absolute inset-0">
                      <img
                        src={headerImageUrl}
                        alt="Header preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setHeaderImageUrl("")
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-white/30 mb-2" />
                      <p className="text-white/50 text-sm font-sans">Click or drag to upload header image</p>
                    </>
                  )}
                  <input
                    ref={headerImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                  Casting Call Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Lead Role - Sarah"
                  className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Midnight Echo"
                  className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the role or casting call..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#0f1f17] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-colors font-sans resize-none"
                />
              </div>

              {/* Completed Checkbox - Only show in edit mode */}
              {isEditing && (
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => setIsCompleted(e.target.checked)}
                      className="w-5 h-5 rounded border-white/20 bg-[#0f1f17] text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                    />
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors font-sans">
                      Completed
                    </span>
                    {isCompleted && (
                      <span className="text-xs text-amber-400/80 font-sans">
                        (No new submissions will be accepted)
                      </span>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-[#1a2e23] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white font-sans">Form Fields</h2>
              <div className="relative">
                <button
                  onClick={() => setShowFieldTypeDropdown(!showFieldTypeDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg text-sm transition-colors font-sans"
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>
                
                {/* Field Type Dropdown */}
                {showFieldTypeDropdown && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowFieldTypeDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a2e23] border border-white/15 rounded-lg shadow-xl z-20 overflow-hidden">
                      <div className="py-1">
                        {fieldTypeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => addField(opt.value as CastingCallField["type"])}
                            className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-violet-500/20 hover:text-white transition-colors font-sans"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Column Headings */}
            <div className="flex items-center gap-3 px-4 py-2 mb-2 border-b border-white/10">
              <div className="w-4" /> {/* Spacer for drag handle */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Type</span>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Title</span>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Input Field</span>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Options</span>
              </div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-start gap-3 p-4 bg-[#0f1f17] border rounded-lg transition-all ${
                    draggedIndex === index
                      ? "opacity-50 border-emerald-500/50"
                      : dragOverIndex === index
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-white/5"
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="mt-3 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Field Config - Reordered: Type, Title, Input Field, Options */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Type - Read Only */}
                    <div className="px-3 py-2 bg-[#1a2e23]/50 border border-white/5 rounded-lg text-white/60 text-sm font-sans flex items-center">
                      {fieldTypeOptions.find(opt => opt.value === field.type)?.label || field.type}
                    </div>

                    {/* Title/Label */}
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Field label"
                      className="px-3 py-2 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                    />

                    {/* Input Field/Placeholder */}
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                      className="px-3 py-2 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                    />

                    {/* Options */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="w-4 h-4 rounded border-white/20 bg-[#1a2e23] text-violet-500 focus:ring-violet-500/50"
                        />
                        Required
                      </label>
                      
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save/Create Button */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || !projectName.trim()}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/30 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-lg transition-colors font-sans"
          >
            {isEditing ? "Save Changes" : "Create Casting Call"}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <CastingCallPreviewModal
          castingCall={previewCastingCall}
          onClose={() => setShowPreview(false)}
          onEdit={() => {
            setShowPreview(false)
            setStep("setup")
          }}
        />
      )}
    </div>
  )
}
