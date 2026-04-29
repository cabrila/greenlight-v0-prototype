"use client"

import { useState } from "react"
import { Plus, Users, Calendar, Pencil, Trash2 } from "lucide-react"
import { useActorList } from "./ActorListContext"

export default function ActorProjectsList() {
  const { projects, selectProject, deleteProject, setView } = useActorList()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-sans">Actor Lists</h1>
        <p className="text-white/50 font-sans">
          Import and manage actor profiles for your productions.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Existing Projects */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-emerald-500/50 transition-all cursor-pointer"
            onMouseEnter={() => setHoveredId(project.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => selectProject(project.id)}
          >
            {/* Hover Actions */}
            {hoveredId === project.id && (
              <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    selectProject(project.id)
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                  title="Edit project"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteProject(project.id)
                  }}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Icon */}
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Project Name */}
            <h3 className="text-lg font-semibold text-white mb-4 font-sans pr-16">
              {project.name}
            </h3>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{project.actors.length} actors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}

        {/* New Actor List Card */}
        <button
          onClick={() => setView("upload")}
          className="p-5 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-transparent hover:bg-white/5 transition-all flex flex-col items-center justify-center min-h-[180px] group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 group-hover:border-white/50 flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-6 h-6 text-white/40 group-hover:text-white/60" />
          </div>
          <span className="text-white/40 group-hover:text-white/60 font-sans text-sm transition-colors">
            New Actor List
          </span>
        </button>
      </div>
    </div>
  )
}
