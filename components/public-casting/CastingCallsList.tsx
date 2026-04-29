"use client"

import { useState } from "react"
import { Plus, Share2, Calendar, Users, Pencil, Trash2, Link, Eye, FileEdit, FolderEdit } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { CastingCall, PublicCastingProject } from "@/types/public-casting"
import CastingCallPreviewModal from "./CastingCallPreviewModal"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectModal from "@/components/ui/EditProjectModal"

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
  const { state, deleteProject, updateProject, getNewSubmissionsCount, getTotalSubmissions } = usePublicCasting()
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [previewCastingCall, setPreviewCastingCall] = useState<CastingCall | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PublicCastingProject | null>(null)
  const [editTarget, setEditTarget] = useState<PublicCastingProject | null>(null)

  const newCount = getNewSubmissionsCount()
  const totalSubmissions = getTotalSubmissions()

  const handleDeleteProject = (e: React.MouseEvent, project: PublicCastingProject) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleEditProject = (e: React.MouseEvent, project: PublicCastingProject) => {
    e.stopPropagation()
    setEditTarget(project)
  }

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteProject(deleteTarget.id)
    }
  }

  const handleSaveEdit = (newName: string) => {
    if (editTarget) {
      updateProject(editTarget.id, { name: newName })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans">Public Casting</h1>
        <p className="text-white/60 text-base font-sans">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.projects.map((project) => {
            const castingCall = project.castingCalls[0]
            const hasCastingCall = !!castingCall
            
            return (
              <div
                key={project.id}
                className="group relative p-5 rounded-xl border border-white/10 bg-[#1a2e23] hover:border-violet-500/30 transition-colors"
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                {/* Top-right Quick Actions (always visible on hover) */}
                {hoveredProjectId === project.id && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleEditProject(e, project)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                      title={`Rename "${project.name}"`}
                    >
                      <FolderEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(e, project)}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title={`Delete "${project.name}"`}
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
                <h3 className="text-lg font-semibold text-white mb-1 font-sans pr-20">
                  {project.name}
                </h3>

                {/* Casting Call Title (if exists) */}
                {hasCastingCall && castingCall.title && (
                  <p className="text-sm text-white/50 mb-3 font-sans truncate pr-20">
                    {castingCall.title}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
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
                  <div className="mb-4 flex items-center gap-1.5 text-sm text-violet-300">
                    <Users className="w-4 h-4" />
                    <span>{project.submissions.length} submissions</span>
                    {project.submissions.some((s) => s.isNew) && (
                      <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">
                        {project.submissions.filter((s) => s.isNew).length} new
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons for Casting Call */}
                {hasCastingCall && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewCastingCall(castingCall)
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm transition-colors font-sans"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditCastingCall(castingCall, project)
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 rounded-lg text-violet-300 hover:text-violet-200 text-sm transition-colors font-sans"
                      title={`Edit form: ${castingCall.title}`}
                    >
                      <FileEdit className="w-4 h-4" />
                      Edit Form
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewCastingCall && (
        <CastingCallPreviewModal
          castingCall={previewCastingCall}
          onClose={() => setPreviewCastingCall(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Casting Project"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this project, all its casting calls, and submissions. This action cannot be undone."
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        currentName={editTarget?.name || ""}
        title="Rename Casting Project"
        label="Project Name"
      />
      </div>
    </div>
  )
}
