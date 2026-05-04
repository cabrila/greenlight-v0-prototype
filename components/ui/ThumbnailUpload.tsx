"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ThumbnailUploadProps {
  currentThumbnail?: string
  onUpload: (url: string) => void
  onRemove: () => void
  accentColor?: string
}

export default function ThumbnailUpload({
  currentThumbnail,
  onUpload,
  onRemove,
  accentColor = "emerald",
}: ThumbnailUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const colorClasses = {
    emerald: {
      border: "border-emerald-500/50",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      hover: "hover:border-emerald-500/70",
    },
    sky: {
      border: "border-sky-500/50",
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      hover: "hover:border-sky-500/70",
    },
    amber: {
      border: "border-amber-500/50",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      hover: "hover:border-amber-500/70",
    },
    violet: {
      border: "border-violet-500/50",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      hover: "hover:border-violet-500/70",
    },
  }

  const colors = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.emerald

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file")
        return
      }

      setIsUploading(true)

      // Convert to base64 data URL for local storage
      // In production, this would upload to a storage service
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onUpload(result)
        setIsUploading(false)
      }
      reader.onerror = () => {
        alert("Failed to read file")
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  if (currentThumbnail) {
    return (
      <div className="relative w-full h-full group">
        <img
          src={currentThumbnail}
          alt="Project thumbnail"
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Change thumbnail"
          >
            <Upload className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
            title="Remove thumbnail"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={(e) => {
        e.stopPropagation()
        handleClick()
      }}
      className={`w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer ${
        isDragging
          ? `${colors.border} ${colors.bg}`
          : `border-white/20 hover:border-white/40 ${colors.hover}`
      } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
    >
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-xs text-white/50 font-sans">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 p-3">
          <ImageIcon className={`w-6 h-6 ${colors.text} opacity-60`} />
          <span className="text-xs text-white/40 font-sans text-center">
            Drop image or click
          </span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
