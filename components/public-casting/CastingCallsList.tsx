"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Share2, Calendar, Users, Pencil, Trash2, Link } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"

interface CastingCallsListProps {
  onBack: () => void
  onNewCastingCall: () => void
  onViewSubmissions: () => void
  onSelectCastingCall: (id: string) => void
}

export default function CastingCallsList({
  onBack,
  onNewCastingCall,
  onViewSubmissions,
  onSelectCastingCall,
}: CastingCallsListProps) {
  const { state, deleteProject, selectProject, getNewSubmissionsCount, getTotalSubmissions } = usePublicCasting()
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)

  const newCount = getNewSubmissionsCount()
  const totalSubmissions = getTotalSubmissions()

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2d6b3f] via-[#1a4a2a] to-[#061a10] p-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors font-sans"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-sans">Public Casting</h1>
          <p className="text-white/50 font-sans">
            Create shareable casting forms and manage actor submissions.
          </p>
        </div>

        {/* Submissions Button */}
        <button
          onClick={onViewSubmissions}
          className="relative flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 transition-colors font-sans"
        >
          <Users className="w-4 h-4" />
          <span>Submissions</span>
          {totalSubmissions > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-violet-500 text-white text-xs font-bold rounded-full">
              {totalSubmissions}
            </span>
          )}
          {newCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {state.projects.map((project) => (
          <div
            key={project.id}
            className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-violet-500/30 transition-colors cursor-pointer"
            onClick={() => {
              selectProject(project.id)
              if (project.castingCalls.length > 0) {
                onSelectCastingCall(project.castingCalls[0].id)
              }
            }}
            onMouseEnter={() => setHoveredProjectId(project.id)}
            onMouseLeave={() => setHoveredProjectId(null)}
          >
            {/* Hover Actions */}
            {hoveredProjectId === project.id && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Edit project
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
            <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6 text-violet-400" />
            </div>

            {/* Project Name */}
            <h3 className="text-lg font-semibold text-white mb-3 font-sans pr-16">
              {project.name}
            </h3>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-1.5">
                <Link className="w-4 h-4" />
                <span>{project.castingCalls.length} forms</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{project.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Submissions count */}
            {project.submissions.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-sm text-violet-300">
                <Users className="w-4 h-4" />
                <span>{project.submissions.length} submissions</span>
                {project.submissions.some((s) => s.isNew) && (
                  <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                    {project.submissions.filter((s) => s.isNew).length} new
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* New Project Card */}
        <button
          onClick={onNewCastingCall}
          className="p-5 rounded-xl border-2 border-dashed border-white/20 hover:border-violet-500/40 bg-transparent hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center min-h-[200px] gap-3"
        >
          <Plus className="w-8 h-8 text-white/40" />
          <span className="text-white/40 font-sans">New Casting Call</span>
        </button>
      </div>
    </div>
  )
}
