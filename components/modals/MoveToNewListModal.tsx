"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { X, ListPlus, ArrowRightCircle } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { useActorGrid } from "@/components/actors/ActorGridContext"
import type { Actor } from "@/types/casting"

interface MoveToNewListModalProps {
  onClose: () => void
  actorIds: string[]
  characterId: string
}

export default function MoveToNewListModal({ onClose, actorIds, characterId }: MoveToNewListModalProps) {
  const { state, dispatch } = useCasting()
  const { clearSelection } = useActorGrid()
  const [tabName, setTabName] = useState("")
  const [error, setError] = useState("")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const character = currentProject?.characters.find((c) => c.id === characterId)

  // Collect the selected actors (searching every list) for display + names.
  const selectedActors = useMemo<Actor[]>(() => {
    if (!character) return []
    const found: Actor[] = []
    for (const [key, value] of Object.entries(character.actors)) {
      if (key === "shortLists") {
        character.actors.shortLists.forEach((sl) => found.push(...sl.actors.filter((a) => actorIds.includes(a.id))))
      } else if (Array.isArray(value)) {
        found.push(...(value as Actor[]).filter((a) => actorIds.includes(a.id)))
      }
    }
    return found
  }, [character, actorIds])

  // Determine the single most common source location for the selected actors.
  const determineSourceLocation = () => {
    if (!character) return null
    const counts = new Map<string, number>()

    actorIds.forEach((actorId) => {
      for (const tabDef of state.tabDefinitions) {
        if (tabDef.key === "shortLists") continue
        const list = character.actors[tabDef.key as keyof typeof character.actors]
        if (Array.isArray(list) && list.some((a: any) => a.id === actorId)) {
          const k = `standard-${tabDef.key}`
          counts.set(k, (counts.get(k) || 0) + 1)
        }
      }
      for (const sl of character.actors.shortLists) {
        if (sl.actors.some((a) => a.id === actorId)) {
          const k = `shortlist-${sl.id}`
          counts.set(k, (counts.get(k) || 0) + 1)
        }
      }
    })

    let maxCount = 0
    let primary: any = null
    counts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count
        const sep = key.indexOf("-")
        const type = key.slice(0, sep)
        const id = key.slice(sep + 1)
        // "standard" covers both built-in and custom tabs stored as arrays on the character.
        primary = type === "standard" ? { type: "standard", key: id } : { type: "shortlist", shortlistId: id }
      }
    })

    return primary
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = tabName.trim()
    if (!trimmed) {
      setError("List name is required")
      return
    }

    // Match AddTabModal's key generation so the new list behaves like any custom tab.
    const tabKey =
      trimmed
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "") || `custom-${Date.now()}`

    const sourceLocation = determineSourceLocation()

    // 1) Create the new list (custom tab). This adds an empty array under `tabKey`.
    dispatch({ type: "ADD_TAB", payload: { tabKey, tabName: trimmed } })

    // 2) Move the selected actors into the freshly created list.
    if (sourceLocation && actorIds.length > 0) {
      dispatch({
        type: "MOVE_MULTIPLE_ACTORS",
        payload: {
          actorIds,
          characterId,
          sourceLocation,
          destinationType: "custom",
          destinationKey: tabKey,
          moveReason: "standard",
        },
      })
    }

    clearSelection()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Move to New List</h2>
              <p className="text-xs text-gray-500">
                Create a new list and move {actorIds.length} actor{actorIds.length > 1 ? "s" : ""} into it
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {/* New list name */}
          <div className="mb-5">
            <label htmlFor="newListName" className="block text-sm font-medium text-gray-700 mb-1">
              New list name
            </label>
            <input
              type="text"
              id="newListName"
              autoFocus
              value={tabName}
              onChange={(e) => {
                setTabName(e.target.value)
                setError("")
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Callback Shortlist"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          {/* Selected actors preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Actors to move ({selectedActors.length})
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
              {selectedActors.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedActors.map((actor) => (
                    <div key={actor.id} className="text-sm bg-white px-3 py-2 rounded border border-gray-200 truncate">
                      {actor.name}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No actors selected</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actorIds.length === 0}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightCircle className="w-4 h-4" />
              <span>
                Create &amp; Move {actorIds.length} Actor{actorIds.length > 1 ? "s" : ""}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
