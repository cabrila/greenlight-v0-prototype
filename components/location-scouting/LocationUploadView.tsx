"use client"

import { useState, useRef } from "react"
import { Upload, ArrowLeft, FileText, Loader2, X } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import { Location, LocationProject } from "@/types/location-scouting"

export default function LocationUploadView() {
  const { setView, addProject, setCurrentProject } = useLocationScouting()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.type === "application/pdf") {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate AI processing with progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 500)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 3000))

    clearInterval(progressInterval)
    setProgress(100)

    // Generate demo locations based on "AI analysis"
    const demoLocations: Location[] = [
      {
        id: crypto.randomUUID(),
        name: "MAIN ENTRANCE - GATES",
        type: "EXT",
        timeOfDay: "DAY",
        description: "A grand entrance with massive gates that open dramatically. The surrounding area features lush vegetation and a winding road leading to the main facility.",
        scoutingNotes: "Requires a location with impressive gate structure or ability to build one. Consider existing theme parks or estates with grand entrances.",
      },
      {
        id: crypto.randomUUID(),
        name: "CONTROL ROOM",
        type: "INT",
        timeOfDay: "DAY",
        description: "A high-tech command center filled with monitors, computers, and control panels. Multiple workstations for operators with a large central display.",
        scoutingNotes: "Can be built as a set. Reference modern data centers or mission control rooms for authenticity.",
      },
      {
        id: crypto.randomUUID(),
        name: "VISITOR CENTER - MAIN HALL",
        type: "INT",
        timeOfDay: "DAY",
        description: "A cavernous main hall with high ceilings, featuring exhibits and educational displays. Natural light streams through large windows.",
        scoutingNotes: "Look for museums, convention centers, or large atriums with high ceilings and good natural lighting.",
      },
    ]

    // Create new project
    const newProject: LocationProject = {
      id: crypto.randomUUID(),
      name: file.name.replace(".pdf", "").toUpperCase(),
      locations: demoLocations,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addProject(newProject)
    setCurrentProject(newProject)

    // Small delay before transitioning
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsProcessing(false)
    setView("results")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 p-6 border-b border-white/10">
        <button
          onClick={() => setView("projects")}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Back to projects"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-xl font-bold text-white font-sans">New Location List</h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Title */}
          <h2 className="text-3xl font-bold text-white text-center mb-3 font-sans">
            Scout Locations from Scripts
          </h2>
          <p className="text-white/60 text-center mb-8 font-sans">
            Upload your script (PDF). AI will scan for scenes to create a detailed Location Scouting List.
          </p>

          <div className="w-full h-px bg-white/10 mb-8" />

          {isProcessing ? (
            /* Processing State */
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
              <p className="text-white font-sans mb-2">Analyzing script for locations...</p>
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-white/50 text-sm mt-2 font-sans">{Math.round(progress)}%</p>
            </div>
          ) : file ? (
            /* File Selected State */
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 p-4 bg-[#1a2e23] rounded-xl border border-white/10 mb-6 w-full max-w-md">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-sans font-medium truncate">{file.name}</p>
                  <p className="text-white/50 text-sm font-sans">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <button
                onClick={handleUpload}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors font-sans"
              >
                Extract Locations
              </button>
            </div>
          ) : (
            /* Upload Dropzone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                ${isDragging
                  ? "border-amber-400 bg-amber-500/10"
                  : "border-white/20 hover:border-white/40 bg-[#1a2e23]/50"
                }
              `}
            >
              <div className="w-16 h-16 bg-[#2a3f33] rounded-full flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-white font-sans font-medium mb-1">
                Click to upload or drag a file here
              </p>
              <p className="text-white/50 text-sm font-sans">PDF files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
