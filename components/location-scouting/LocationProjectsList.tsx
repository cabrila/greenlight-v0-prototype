"use client"

import { useState } from "react"
import { MapPin, Calendar, Plus, Pencil, Trash2 } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import { LocationProject } from "@/types/location-scouting"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectModal from "@/components/ui/EditProjectModal"

export default function LocationProjectsList() {
  const { projects, setView, setCurrentProject, deleteProject, updateProject } = useLocationScouting()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LocationProject | null>(null)
  const [editTarget, setEditTarget] = useState<LocationProject | null>(null)

  const handleProjectClick = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
      setView("results")
    }
  }

  const handleDeleteProject = (e: React.MouseEvent, project: LocationProject) => {
    e.stopPropagation()
    setDeleteTarget(project)
  }

  const handleEditProject = (e: React.MouseEvent, project: LocationProject) => {
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
      updateProject({ ...editTarget, name: newName, updatedAt: new Date() })
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white font-sans mb-2">My Locations</h1>
        <p className="text-white/60 text-base font-sans">
          Scout and manage location lists generated from your scripts.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <button
                  onClick={(e) => handleEditProject(e, project)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                  title="Edit project"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDeleteProject(e, project)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Location List"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this location list and all its locations. This action cannot be undone."
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        currentName={editTarget?.name || ""}
        title="Rename Location List"
        label="Location List Name"
      />
      </div>
    </div>
  )
}
