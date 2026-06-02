"use client"

import { useState, useRef } from "react"
import { Plus, Megaphone, Calendar, Users, Trash2, Link, Eye, FolderEdit, QrCode, ChevronDown, ChevronRight, FolderPlus, ImagePlus, X } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { CastingCall, PublicCastingProject, CastingGroup } from "@/types/public-casting"
import CastingCallPreviewModal from "./CastingCallPreviewModal"
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal"
import EditProjectWithThumbnailModal from "@/components/ui/EditProjectWithThumbnailModal"
import QRCodeModal from "./QRCodeModal"

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
  const { state, deleteProject, updateProject, getNewSubmissionsCount, getTotalSubmissions, createCastingGroup, updateCastingGroup, deleteCastingGroup, toggleCastingGroupExpanded } = usePublicCasting()
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null)
  const [previewCastingCall, setPreviewCastingCall] = useState<CastingCall | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PublicCastingProject | null>(null)
  const [editTarget, setEditTarget] = useState<PublicCastingProject | null>(null)
  const [qrCodeCastingCall, setQrCodeCastingCall] = useState<CastingCall | null>(null)
  
  // Selection state
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())
  
  // Create group modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupImage, setNewGroupImage] = useState<string | undefined>(undefined)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit group modal state
  const [editGroupTarget, setEditGroupTarget] = useState<CastingGroup | null>(null)
  const [isDraggingEditImage, setIsDraggingEditImage] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSaveEdit = (newName: string, thumbnailUrl?: string) => {
    if (editTarget) {
      updateProject(editTarget.id, { name: newName, thumbnailUrl })
    }
  }

  // Selection handlers
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedProjectIds(new Set())
  }

  // Get ungrouped projects (not in any group)
  const groupedProjectIds = new Set(state.castingGroups.flatMap((g) => g.projectIds))
  const ungroupedProjects = state.projects.filter((p) => !groupedProjectIds.has(p.id))

  // Create group handler
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedProjectIds.size === 0) return
    createCastingGroup(newGroupName.trim(), Array.from(selectedProjectIds), newGroupImage)
    setNewGroupName("")
    setNewGroupImage(undefined)
    setShowCreateGroupModal(false)
    clearSelection()
  }

  // Image upload handlers
  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setNewGroupImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImage(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    // Reset the input so the same file can be selected again
    e.target.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImage(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if leaving the actual drop zone (not a child element)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingImage(false)
    }
  }

  // Edit group image upload
  const handleEditGroupImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (editGroupTarget) {
        updateCastingGroup(editGroupTarget.id, { imageUrl: e.target?.result as string })
        setEditGroupTarget({ ...editGroupTarget, imageUrl: e.target?.result as string })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleEditFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingEditImage(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      handleEditGroupImageUpload(file)
    }
  }

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleEditGroupImageUpload(file)
    }
    e.target.value = ""
  }

  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingEditImage(true)
  }

  const handleEditDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingEditImage(false)
    }
  }

  // Render a project card
  const renderProjectCard = (project: PublicCastingProject, isInGroup: boolean = false) => {
    const castingCall = project.castingCalls[0]
    const hasCastingCall = !!castingCall
    const isSelected = selectedProjectIds.has(project.id)

    return (
      <div
        key={project.id}
        className={`group relative flex rounded-xl border bg-[#1a2e23] transition-colors overflow-hidden ${
          isSelected ? "border-violet-500/50 ring-2 ring-violet-500/20" : "border-white/10 hover:border-violet-500/30"
        }`}
        onMouseEnter={() => setHoveredProjectId(project.id)}
        onMouseLeave={() => setHoveredProjectId(null)}
      >
        {/* Selection Checkbox - Upper Left */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleProjectSelection(project.id)
          }}
          className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-violet-500 border-violet-500 text-white"
              : "border-white/30 hover:border-violet-400 bg-black/20 backdrop-blur-sm"
          }`}
          title={isSelected ? "Deselect" : "Select"}
        >
          {isSelected && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Thumbnail Section - 1/3 width */}
        <div className="w-1/3 min-h-[180px] bg-[#0f1f17] border-r border-white/10 flex-shrink-0">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-violet-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content Section - 2/3 width */}
        <div className="flex-1 flex flex-col">
          {/* Header Row - Project Name + Actions */}
          <div className="flex items-start justify-between gap-2 p-4 pb-2">
            <div className="flex-1 min-w-0 pl-4">
              {/* Project Name */}
              <h3 className="text-sm font-semibold text-white mb-0.5 font-sans line-clamp-1">
                {project.name}
              </h3>
              {/* Casting Call Title (if exists) */}
              {hasCastingCall && castingCall.title && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-white/50 font-sans truncate">
                    {castingCall.title}
                  </p>
                  {castingCall.isCompleted && (
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded uppercase tracking-wider">
                      Completed
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions - Fixed slot, visible on hover */}
            <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${
              hoveredProjectId === project.id ? "opacity-100" : "opacity-0"
            }`}>
              {hasCastingCall && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setQrCodeCastingCall(castingCall)
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                  title="Generate QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => handleEditProject(e, project)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                title="Edit Casting Call"
              >
                <FolderEdit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDeleteProject(e, project)}
                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="flex-1 flex flex-col px-4 pb-4 pt-1">
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mb-2 pl-4">
              <div className="flex items-center gap-1">
                <Link className="w-3 h-3" />
                <span>{project.castingCalls.length} forms</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{project.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Submissions count */}
            {project.submissions.length > 0 && (
              <div className="mb-2 flex items-center gap-1 text-xs text-violet-300 pl-4">
                <Users className="w-3 h-3" />
                <span>{project.submissions.length} submissions</span>
                {project.submissions.some((s) => s.isNew) && (
                  <span className="ml-1 px-1 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded">
                    {project.submissions.filter((s) => s.isNew).length} new
                  </span>
                )}
              </div>
            )}

            {/* Action Buttons for Casting Call */}
            {hasCastingCall && (
              <div className="flex items-center gap-2 pt-2 mt-auto border-t border-white/10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewCastingCall(castingCall)
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-xs transition-colors font-sans"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans">My Casting Calls</h1>
        <p className="text-white/60 text-base font-sans">
          Create shareable casting forms and manage actor submissions.
        </p>
      </div>

      {/* Action Bar - New Casting Call + Submissions + Create Group */}
      <div className="flex items-center gap-3 mb-6">
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

        {/* Create Group Button - shows when items are selected */}
        {selectedProjectIds.size > 0 && (
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 transition-colors font-sans"
          >
            <FolderPlus className="w-4 h-4" />
            Create Group ({selectedProjectIds.size})
          </button>
        )}

        {selectedProjectIds.size > 0 && (
          <button
            onClick={clearSelection}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors text-sm font-sans"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Casting Groups */}
      {state.castingGroups.length > 0 && (
        <div className="mb-8 space-y-4">
          {state.castingGroups.map((group) => {
            const groupProjects = state.projects.filter((p) => group.projectIds.includes(p.id))
            
            return (
              <div key={group.id} className="border border-white/10 rounded-xl bg-[#0f1f17] overflow-hidden">
                {/* Group Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleCastingGroupExpanded(group.id)}
                >
                  {/* Expand/Collapse Icon */}
                  <button className="text-white/50 hover:text-white transition-colors">
                    {group.isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  {/* Group Image */}
                  {group.imageUrl ? (
                    <img
                      src={group.imageUrl}
                      alt={group.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <FolderPlus className="w-6 h-6 text-amber-400" />
                    </div>
                  )}

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white font-sans truncate">{group.name}</h3>
                    <p className="text-xs text-white/50 font-sans">
                      {groupProjects.length} casting call{groupProjects.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Group Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditGroupTarget(group)
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
                      title="Edit Group"
                    >
                      <FolderEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCastingGroup(group.id)
                      }}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Group Content - Collapsible */}
                {group.isExpanded && groupProjects.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupProjects.map((project) => renderProjectCard(project, true))}
                    </div>
                  </div>
                )}

                {group.isExpanded && groupProjects.length === 0 && (
                  <div className="px-4 pb-4">
                    <p className="text-white/40 text-sm text-center py-4">No casting calls in this group</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Ungrouped Projects Section */}
      {ungroupedProjects.length > 0 && state.castingGroups.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 font-sans">Ungrouped</h2>
        </div>
      )}

      {/* Projects Grid */}
      {state.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-semibold text-white/70 mb-2 font-sans">No casting calls yet</h3>
          <p className="text-white/40 text-sm font-sans mb-4">Create your first casting call to start receiving submissions.</p>
        </div>
      ) : ungroupedProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ungroupedProjects.map((project) => renderProjectCard(project))}
        </div>
      ) : state.castingGroups.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.projects.map((project) => renderProjectCard(project))}
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewCastingCall && (
        <CastingCallPreviewModal
          castingCall={previewCastingCall}
          project={state.projects.find(p => p.castingCalls.some(cc => cc.id === previewCastingCall.id))}
          onClose={() => setPreviewCastingCall(null)}
          onEdit={() => {
            const project = state.projects.find(p => p.castingCalls.some(cc => cc.id === previewCastingCall.id))
            if (project) {
              setPreviewCastingCall(null)
              onEditCastingCall(previewCastingCall, project)
            }
          }}
        />
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={!!qrCodeCastingCall}
        onClose={() => setQrCodeCastingCall(null)}
        url={qrCodeCastingCall?.shareableLink || ""}
        title={qrCodeCastingCall?.title || "Casting Call"}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Casting Call"
        itemName={deleteTarget?.name || ""}
        description="This will permanently delete this project, all its casting calls, and submissions. This action cannot be undone."
      />

      {/* Edit Casting Call Modal */}
      <EditProjectWithThumbnailModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
        onEditForm={() => {
          if (editTarget) {
            const castingCall = editTarget.castingCalls[0]
            if (castingCall) {
              onEditCastingCall(castingCall, editTarget)
            }
          }
        }}
        currentName={editTarget?.name || ""}
        currentThumbnail={editTarget?.thumbnailUrl}
        title="Edit Casting Call"
        label="Casting Call"
        accentColor="violet"
      />

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCreateGroupModal(false)
              setNewGroupName("")
              setNewGroupImage(undefined)
            }}
          />
          <div className="relative w-full max-w-md bg-[#1a3a25] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white font-sans">Create Casting Group</h2>
              <button
                onClick={() => {
                  setShowCreateGroupModal(false)
                  setNewGroupName("")
                  setNewGroupImage(undefined)
                }}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <p className="text-white/60 text-sm font-sans">
                Creating a group with {selectedProjectIds.size} casting call{selectedProjectIds.size !== 1 ? "s" : ""}.
              </p>

              {/* Group Name Input */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none font-sans text-sm"
                  autoFocus
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Group Image (Optional)</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                    isDraggingImage
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-white/20 hover:border-amber-500/50 bg-white/5"
                  }`}
                >
                  {newGroupImage ? (
                    <div className="absolute inset-0">
                      <img
                        src={newGroupImage}
                        alt="Group preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setNewGroupImage(undefined)
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-white/30 mb-2" />
                      <p className="text-white/50 text-sm font-sans">Click or drag to upload</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateGroupModal(false)
                    setNewGroupName("")
                    setNewGroupImage(undefined)
                  }}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors font-sans text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editGroupTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditGroupTarget(null)}
          />
          <div className="relative w-full max-w-md bg-[#1a3a25] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white font-sans">Edit Casting Group</h2>
              <button
                onClick={() => setEditGroupTarget(null)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Group Name Input */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Group Name</label>
                <input
                  type="text"
                  value={editGroupTarget.name}
                  onChange={(e) => {
                    const newName = e.target.value
                    setEditGroupTarget({ ...editGroupTarget, name: newName })
                  }}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none font-sans text-sm"
                  autoFocus
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-sans">Group Image</label>
                <div
                  onDragOver={handleEditDragOver}
                  onDragLeave={handleEditDragLeave}
                  onDrop={handleEditFileDrop}
                  onClick={() => editFileInputRef.current?.click()}
                  className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                    isDraggingEditImage
                      ? "border-amber-500 bg-amber-500/10"
                      : "border-white/20 hover:border-amber-500/50 bg-white/5"
                  }`}
                >
                  {editGroupTarget.imageUrl ? (
                    <div className="absolute inset-0">
                      <img
                        src={editGroupTarget.imageUrl}
                        alt="Group preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateCastingGroup(editGroupTarget.id, { imageUrl: undefined })
                          setEditGroupTarget({ ...editGroupTarget, imageUrl: undefined })
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-8 h-8 text-white/30 mb-2" />
                      <p className="text-white/50 text-sm font-sans">Click or drag to upload</p>
                    </>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditGroupTarget(null)}
                  className="px-4 py-2 text-white/70 hover:text-white transition-colors font-sans text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateCastingGroup(editGroupTarget.id, { name: editGroupTarget.name })
                    setEditGroupTarget(null)
                  }}
                  disabled={!editGroupTarget.name.trim()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
