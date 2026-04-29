"use client"

import { useState } from "react"
import { FileText, Users, Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { useCharacterBible } from "./CharacterBibleContext"
import { CharacterBible } from "@/types/character-bible"

export default function ProjectsList() {
  const { bibles, setView, setCurrentBible, deleteBible } = useCharacterBible()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleOpenBible = (bible: CharacterBible) => {
    setCurrentBible(bible)
    setView("results")
  }

  const handleNewBible = () => {
    setView("upload")
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this Character Bible?")) {
      deleteBible(id)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans">
          My Projects
        </h1>
        <p className="text-white/60 text-base font-sans">
          Manage your Character Bibles, Locations, and Actor Lists.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Existing Projects */}
        {bibles.map((bible) => (
          <button
            key={bible.id}
            onClick={() => handleOpenBible(bible)}
            onMouseEnter={() => setHoveredId(bible.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative flex flex-col p-5 rounded-xl border text-left transition-all duration-200 ${
              hoveredId === bible.id
                ? "bg-white/[0.07] border-emerald-500/50"
                : "bg-white/[0.03] border-white/10 hover:border-white/20"
            }`}
          >
            {/* Action buttons on hover */}
            {hoveredId === bible.id && (
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Edit functionality
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-white/70" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, bible.id)}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}

            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-sky-400" />
            </div>

            {/* Project Name */}
            <h3 className="text-lg font-semibold text-white mb-3 font-sans pr-16">
              {bible.name}
            </h3>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {bible.characters.length} characters
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(bible.createdAt)}
              </span>
            </div>
          </button>
        ))}

        {/* New Character Bible Card */}
        <button
          onClick={handleNewBible}
          className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/[0.02] text-left transition-all duration-200 min-h-[180px]"
        >
          <Plus className="w-8 h-8 text-white/40 mb-3" />
          <span className="text-white/50 font-medium font-sans">
            New Character Bible
          </span>
        </button>
      </div>
    </div>
  )
}
