"use client"

import type React from "react"

import { useState } from "react"
import { useCasting, getCurrentTerminology } from "@/components/casting/CastingContext"
import { Plus, X, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import TerminologyContextMenu from "@/components/ui/TerminologyContextMenu"

export default function CharactersSidebar() {
  const { state, dispatch } = useCasting()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    type: "actor" | "character"
    form: "singular" | "plural"
    currentValue: string
  } | null>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  // Get current project's terminology
  const terminology = getCurrentTerminology(state)

  const getCharacterCounts = (character: any) => {
    const counts = state.tabDefinitions.map((tabDef) => {
      let count = 0
      if (tabDef.key === "shortLists") {
        count = character.actors.shortLists.reduce(
          (sum: number, sl: any) =>
            sum + (sl.actors?.filter((a: any) => !a.isSoftRejected && !a.isGreenlit).length || 0),
          0,
        )
      } else {
        count = (character.actors[tabDef.key] || []).filter((a: any) => !a.isSoftRejected && !a.isGreenlit).length
      }
      return `${tabDef.name.substring(0, 3)}:${count}`
    })
    return counts.join(" | ")
  }

  const handleDeleteCharacter = (characterId: string, characterName: string) => {
    openModal("confirmDelete", {
      title: `Delete ${terminology.character.singular}`,
      message: `Are you sure you want to delete "${characterName}" and all associated ${terminology.actor.singular.toLowerCase()} data? This cannot be undone.`,
      onConfirm: () => {
        dispatch({ type: "DELETE_CHARACTER", payload: characterId })
      },
    })
  }

  const handleContextMenu = (e: React.MouseEvent, type: "actor" | "character", form: "singular" | "plural") => {
    // Prevent the default browser context menu
    e.preventDefault()
    e.stopPropagation()

    // Set the context menu state with the correct position and data
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      form,
      currentValue: terminology[type][form],
    })

    // Return false to prevent any other handlers
    return false
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div
      className={`bg-white shadow-[-4px_0px_8px_-1px_rgba(0,0,0,0.05)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-20" : "w-72"
      } hidden md:flex flex-col z-10`}
    >
      {/* Header */}
      <div className="p-5 overflow-y-auto flex-1">
        {/* Header */}
        <div className={`flex items-center mb-5 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2
                  className="text-lg font-semibold text-gray-700 cursor-context-menu"
                  onContextMenu={(e) => handleContextMenu(e, "character", "plural")}
                >
                  {terminology.character.plural}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleCollapse}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                  title={`Collapse ${terminology.character.plural} Panel`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleCollapse}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                title={`Expand ${terminology.character.plural} Panel`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <Users className="w-5 h-5 text-gray-400" title={terminology.character.plural} />
            </div>
          )}
        </div>

        {/* Characters List */}
        <div className={`space-y-1.5 ${isCollapsed ? "space-y-2" : ""}`}>
          {currentProject?.characters.map((character) => {
            const isActive = character.id === state.currentFocus.characterId
            const countsSummary = getCharacterCounts(character)

            return (
              <div
                key={character.id}
                className={`p-2.5 rounded-md cursor-pointer hover:bg-gray-200 transition-colors ${
                  isActive ? "bg-emerald-100 text-emerald-700 font-semibold" : "bg-gray-50"
                } ${isCollapsed ? "flex flex-col items-center justify-center p-2" : "flex justify-between items-center"}`}
                onClick={() => dispatch({ type: "SELECT_CHARACTER", payload: character.id })}
                title={isCollapsed ? `${character.name} - ${countsSummary}` : undefined}
              >
                {!isCollapsed ? (
                  <>
                    <div>
                      <span className="font-medium">{character.name}</span>
                      <div className="text-xs text-gray-500 mt-0.5">{countsSummary}</div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-600 opacity-50 hover:opacity-100 transition-all"
                      title={`Delete ${character.name}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCharacter(character.id, character.name)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? "bg-emerald-200 text-emerald-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {character.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Character Button */}
        <div className="flex justify-center">
          <button
            onClick={() => openModal("addCharacter")}
            onContextMenu={(e) => handleContextMenu(e, "character", "singular")}
            className={`mt-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
              isCollapsed ? "w-10 h-10 flex items-center justify-center px-3" : "w-full py-3 px-4"
            }`}
            title={isCollapsed ? `Add ${terminology.character.singular}` : undefined}
          >
            <Plus className={`w-4 h-4 ${isCollapsed ? "" : "inline mr-1"}`} />
            {!isCollapsed && `Add ${terminology.character.singular}`}
          </button>
        </div>
      </div>

      {/* Terminology Context Menu */}
      {contextMenu && (
        <TerminologyContextMenu
          show={contextMenu.show}
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          form={contextMenu.form}
          currentValue={contextMenu.currentValue}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
