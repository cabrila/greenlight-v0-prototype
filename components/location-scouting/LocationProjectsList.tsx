"use client"

import { useState } from "react"
import { MapPin, Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"

export default function LocationProjectsList() {
  const { projects, setView, setCurrentProject, deleteProject } = useLocationScouting()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleProjectClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      setView("results")
    }
  }

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this location list?")) {
      deleteProject(projectId)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-sans mb-2">My Locations</h1>
        <p className="text-white/60 font-sans">
          Scout and manage location lists generated from your scripts.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Existing Projects */}
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative group text-left p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-amber-500/50 transition-all"
          >
            {/* Hover Actions */}
            {hoveredId === project.id && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Edit project"
                >
                  <Pencil className="w-4 h-4" />
                </span>
                <span
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </span>
              </div>
            )}

            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-amber-400" />
            </div>

            {/* Project Name */}
            <h3 className="text-lg font-bold text-white font-sans mb-4 pr-16">
              {project.name}
            </h3>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{project.locations.length} locations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {project.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </button>
        ))}

        {/* New Location List Card */}
        <button
          onClick={() => setView("upload")}
          className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-transparent hover:bg-white/[0.02] transition-all min-h-[200px]"
        >
          <Plus className="w-8 h-8 text-white/40 mb-3" />
          <span className="text-white/50 font-sans font-medium">New Location List</span>
        </button>
      </div>
    </div>
  )
}
