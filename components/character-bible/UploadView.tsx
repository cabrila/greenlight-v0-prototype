"use client"

import { useState, useRef } from "react"
import { Upload, ArrowLeft, Loader2, FileText, X } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import { Character, CharacterBible } from "@/types/character-bible"

export default function UploadView() {
  const { setView, setCurrentBible, addBible } = useCharacterBible()
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

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)

    // Simulate AI processing with progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 500)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    clearInterval(progressInterval)
    setProgress(100)

    // Generate demo characters from "script analysis"
    const demoCharacters: Character[] = [
      {
        id: crypto.randomUUID(),
        name: "Dr. Alan Grant",
        age: "Mid-thirties",
        gender: "Male",
        ethnicity: "Not specified",
        scenes: 15,
        castingNotes: "A ragged-looking paleontologist with intense concentration and a lack of patience for technology or children. He is a dedicated scientist who undergoes a transformation into a protective father figure during the crisis.",
      },
      {
        id: crypto.randomUUID(),
        name: "Dr. Ellie Sattler",
        age: "Late twenties",
        gender: "Female",
        ethnicity: "Not specified",
        scenes: 15,
        castingNotes: "An athletic and highly capable paleobotanist with a sharp, impatient intellect. She is brave and resourceful, willing to put herself in physical danger to restore power or help others.",
      },
      {
        id: crypto.randomUUID(),
        name: "John Hammond",
        age: "70s",
        gender: "Male",
        ethnicity: "Not specified",
        scenes: 12,
        castingNotes: "An eccentric billionaire with childlike enthusiasm for his creations. Despite his good intentions, he is blind to the dangers of playing God with nature.",
      },
      {
        id: crypto.randomUUID(),
        name: "Ian Malcolm",
        age: "Late thirties",
        gender: "Male",
        ethnicity: "Not specified",
        scenes: 14,
        castingNotes: "A charismatic mathematician specializing in chaos theory. Dressed all in black, he is sardonic and philosophical, serving as the voice of doom throughout the narrative.",
      },
    ]

    const scriptName = file.name.replace(".pdf", "").toUpperCase()
    const newBible: CharacterBible = {
      id: crypto.randomUUID(),
      name: `${scriptName} Script`,
      characters: demoCharacters,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addBible(newBible)
    setCurrentBible(newBible)
    setView("results")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back Button */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-sans">Back to Projects</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 font-sans">
              Extract Character Bibles
            </h1>
            <p className="text-white/60 text-base font-sans max-w-lg mx-auto">
              Upload your film or TV script (PDF). AI will analyze the text to extract characters and casting notes.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 mb-8" />

          {/* Upload Zone */}
          {!isProcessing ? (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-sky-400 bg-sky-500/10"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-white/20 hover:border-white/40 bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-white font-medium font-sans mb-1">{file.name}</p>
                    <p className="text-white/50 text-sm font-sans">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-sky-400" />
                    </div>
                    <p className="text-white font-medium font-sans mb-1">
                      Click to upload or drag a file here
                    </p>
                    <p className="text-white/50 text-sm font-sans">PDF files only</p>
                  </>
                )}
              </div>

              {/* Process Button */}
              {file && (
                <button
                  onClick={handleProcess}
                  className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors font-sans"
                >
                  Extract Characters
                </button>
              )}
            </>
          ) : (
            /* Processing State */
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-white/10 bg-white/[0.02]">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
              <p className="text-white font-medium font-sans mb-2">
                Analyzing script...
              </p>
              <p className="text-white/50 text-sm font-sans mb-4">
                Extracting characters and casting notes
              </p>
              <div className="w-full max-w-xs bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
