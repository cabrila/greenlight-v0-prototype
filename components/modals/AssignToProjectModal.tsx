"use client"

import type React from "react"
import { useState } from "react"
import { X, FolderOpen, User, Plus, Check } from 'lucide-react'
import { useCasting } from "@/components/casting/CastingContext"
import type { Actor } from "@/types/casting"

interface AssignToProjectModalProps {
  onClose: () => void
  actor: Actor
  sourceCharacterId: string
}

export default function AssignToProjectModal({ onClose, actor, sourceCharacterId }: AssignToProjectModalProps) {
  const { state, dispatch } = useCasting()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("")
  const [addToCanvas, setAddToCanvas] = useState(false)

  const selectedProject = state.projects.find((p) => p.id === selectedProjectId)

  const handleAssign = () => {
    if (!selectedProjectId || !selectedCharacterId) {
      alert("Please select both a project and character")
      return
    }

    const project = state.projects.find((p) => p.id === selectedProjectId)
    const character = project?.characters.find((c) => c.id === selectedCharacterId)

    if (!project || !character) return

    // Check if already assigned
    const alreadyAssigned = actor.projectAssignments?.some(
      (a) => a.projectId === selectedProjectId && a.characterId === selectedCharacterId,
    )

    if (alreadyAssigned && !addToCanvas) {
      alert("This actor is already assigned to this project and character")
      return
    }

    if (!alreadyAssigned) {
      // Assign actor to project-character
      dispatch({
        type: "ASSIGN_ACTOR_TO_PROJECT_CHARACTER",
        payload: {
          actorId: actor.id,
          projectId: selectedProjectId,
          projectName: project.name,
          characterId: selectedCharacterId,
          characterName: character.name,
        },
      })
    }

    // If addToCanvas is checked, also add to canvas
    if (addToCanvas) {
      // Dispatch notification to add to canvas
      const notification = {
        id: `add-to-canvas-${Date.now()}`,
        type: "system" as const,
        title: "Actor Assigned",
        message: `${actor.name} has been assigned to ${project.name} > ${character.name}. ${addToCanvas ? "Please open the Canvas to see the actor." : ""}`,
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
        metadata: {
          addToCanvas: true,
          actorId: actor.id,
          projectId: selectedProjectId,
          characterId: selectedCharacterId,
        },
      }

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: notification,
      })
    }

    onClose()
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assign to Project</h2>
            <p className="text-sm text-slate-500">Assign {actor.name} to a project</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Project</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
            {state.projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setSelectedCharacterId("") // Reset character selection
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  selectedProjectId === project.id
                    ? "bg-emerald-50 border-2 border-emerald-500"
                    : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen
                    className={`w-4 h-4 ${selectedProjectId === project.id ? "text-emerald-600" : "text-slate-400"}`}
                  />
                  <span className={`font-medium ${selectedProjectId === project.id ? "text-emerald-700" : "text-slate-700"}`}>
                    {project.name}
                  </span>
                </div>
                {selectedProjectId === project.id && <Check className="w-5 h-5 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Character Selection */}
        {selectedProject && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Character</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {selectedProject.characters.map((character) => {
                const isAssigned = actor.projectAssignments?.some(
                  (a) => a.projectId === selectedProjectId && a.characterId === character.id,
                )

                return (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacterId(character.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedCharacterId === character.id
                        ? "bg-emerald-50 border-2 border-emerald-500"
                        : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User
                        className={`w-4 h-4 ${selectedCharacterId === character.id ? "text-emerald-600" : "text-slate-400"}`}
                      />
                      <div className="text-left">
                        <span
                          className={`font-medium ${selectedCharacterId === character.id ? "text-emerald-700" : "text-slate-700"}`}
                        >
                          {character.name}
                        </span>
                        {isAssigned && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Already Assigned
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedCharacterId === character.id && <Check className="w-5 h-5 text-emerald-600" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Add to Canvas Option */}
        {selectedProjectId && selectedCharacterId && (
          <div className="border-t border-slate-200 pt-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={addToCanvas}
                onChange={(e) => setAddToCanvas(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="font-medium text-slate-700">Add to Canvas</div>
                <div className="text-sm text-slate-500">
                  Also add this actor to the project's canvas for visual management
                </div>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          disabled={!selectedProjectId || !selectedCharacterId}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Actor</span>
        </button>
      </div>
    </div>
  )
}
