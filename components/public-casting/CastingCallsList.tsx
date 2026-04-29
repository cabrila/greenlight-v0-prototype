"use client"

import { useState } from "react"
import { Plus, Share2, Calendar, Users, Pencil, Trash2, Link, Eye } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import CastingCallPreviewModal from "./CastingCallPreviewModal"

interface CastingCallsListProps {
  onNewCastingCall: () => void
  onViewSubmissions: () => void
  onEditCastingCall: (castingCall: CastingCall, project: PublicCastingProject) => void
}

export default function CastingCallsList({
  onNewCastingCall,
  onViewSubmissions,
  onEditCastingCall,
}: CastingCallsListProps) {
  const { state, deleteProject, getNewSubmissionsCount, getTotalSubmissions } = usePublicCasting()
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [previewCastingCall, setPreviewCastingCall] = useState<CastingCall | null>(null)

  const newCount = getNewSubmissionsCount()
  const totalSubmissions = getTotalSubmissions()

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 font-sans">Public Casting</h1>
        <p className="text-white/50 font-sans">
          Create shareable casting forms and manage actor submissions.
        </p>
      </div>

      {/* Action Bar - New Casting Call + Submissions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onNewCastingCall}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition-colors font-sans"
        >
          <Plus className="w-4 h-4" />
          New Casting Call
        </button>

        {/* Submissions Button */}
        <button
          onClick={onViewSubmissions}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 transition-colors font-sans"
        >
          <Users className="w-4 h-4" />
          <span>View Submissions</span>
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
      {state.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Share2 className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2 font-sans">No casting calls yet</h3>
          <p className="text-white/40 text-sm font-sans mb-4">Create your first casting call to start receiving submissions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {state.projects.map((project) => (
            <div
              key={project.id}
              className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-violet-500/30 transition-colors"
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
            >
              {/* Hover Actions */}
              {hoveredProjectId === project.id && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {project.castingCalls.length > 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewCastingCall(project.castingCalls[0])
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                        title="Preview form"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditCastingCall(project.castingCalls[0], project)
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                        title="Edit casting call"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </>
                  )}
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
        </div>
      )}

      {/* Preview Modal */}
      {previewCastingCall && (
        <CastingCallPreviewModal
          castingCall={previewCastingCall}
          onClose={() => setPreviewCastingCall(null)}
        />
      )}
    </div>
  )
}
