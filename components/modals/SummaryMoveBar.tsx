"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { ChevronDown, ListPlus, ArrowRightCircle, X, MoveRight } from "lucide-react"

type SourceLocation =
  | { type: "standard"; key: string }
  | { type: "custom"; key: string }
  | { type: "shortlist"; shortlistId: string }

interface ResolvedActor {
  characterId: string
  source: SourceLocation
}

interface SummaryMoveBarProps {
  /** Ids of the actors currently selected in the summary. */
  selectedActorIds: string[]
  /** Called after a successful move so the parent can clear its selection. */
  onCleared: () => void
  /** Visual theme so the bar blends with the light or dark summary shell. */
  theme?: "light" | "dark"
}

/**
 * Shared "Move" control used inside both summary modals (casting page +
 * canvas player view). Lets the user move the selected actors into an
 * existing casting list or a brand new one. It resolves each actor's owning
 * character/source within the current project, groups the moves by
 * character + source, and dispatches MOVE_MULTIPLE_ACTORS per group so it works
 * even when the selection spans multiple characters (canvas case).
 */
export default function SummaryMoveBar({ selectedActorIds, onCleared, theme = "light" }: SummaryMoveBarProps) {
  const { state, dispatch } = useCasting()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<null | "existing" | "new">(null)
  const [newListName, setNewListName] = useState("")
  const [error, setError] = useState("")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  // Destinations available for every character: the standard/custom tabs
  // (shortlists are per-character and excluded here for simplicity).
  const availableLists = useMemo(
    () => state.tabDefinitions.filter((t) => t.key !== "shortLists").map((t) => ({ key: t.key, name: t.name })),
    [state.tabDefinitions],
  )

  // Resolve where each selected actor currently lives (character + source list).
  const resolved = useMemo(() => {
    const map: Record<string, ResolvedActor> = {}
    if (!currentProject) return map

    for (const character of currentProject.characters) {
      for (const [key, value] of Object.entries(character.actors)) {
        if (key === "shortLists") {
          character.actors.shortLists.forEach((sl) => {
            sl.actors.forEach((a) => {
              if (selectedActorIds.includes(a.id) && !map[a.id]) {
                map[a.id] = { characterId: character.id, source: { type: "shortlist", shortlistId: sl.id } }
              }
            })
          })
        } else if (Array.isArray(value)) {
          ;(value as any[]).forEach((a) => {
            if (selectedActorIds.includes(a.id) && !map[a.id]) {
              map[a.id] = { characterId: character.id, source: { type: "standard", key } }
            }
          })
        }
      }
    }
    return map
  }, [currentProject, selectedActorIds])

  const movableIds = useMemo(() => selectedActorIds.filter((id) => resolved[id]), [selectedActorIds, resolved])

  const reset = () => {
    setMenuOpen(false)
    setMode(null)
    setNewListName("")
    setError("")
  }

  // Group the movable actors by character + source, then dispatch one move per group.
  const dispatchGroupedMove = (
    destinationType: "standard" | "custom",
    destinationKey: string,
  ) => {
    const groups = new Map<string, { characterId: string; source: SourceLocation; ids: string[] }>()
    for (const id of movableIds) {
      const r = resolved[id]
      if (!r) continue
      const srcSig = r.source.type === "shortlist" ? r.source.shortlistId : r.source.key
      const sig = `${r.characterId}::${r.source.type}::${srcSig}`
      if (!groups.has(sig)) groups.set(sig, { characterId: r.characterId, source: r.source, ids: [] })
      groups.get(sig)!.ids.push(id)
    }

    const moveReason = destinationKey === "longList" ? "reset" : destinationKey === "approval" ? "final_review" : "standard"

    groups.forEach(({ characterId, source, ids }) => {
      dispatch({
        type: "MOVE_MULTIPLE_ACTORS",
        payload: {
          actorIds: ids,
          characterId,
          sourceLocation: source,
          destinationType,
          destinationKey,
          moveReason,
        },
      })
    })

    reset()
    onCleared()
  }

  const handleMoveToExisting = (destKey: string) => {
    if (movableIds.length === 0) return
    dispatchGroupedMove("standard", destKey)
  }

  const handleMoveToNew = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newListName.trim()
    if (!trimmed) {
      setError("List name is required")
      return
    }
    if (movableIds.length === 0) return

    const tabKey =
      trimmed
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "") || `custom-${Date.now()}`

    // Create the list first (global custom tab), then move actors into it.
    dispatch({ type: "ADD_TAB", payload: { tabKey, tabName: trimmed } })
    dispatchGroupedMove("custom", tabKey)
  }

  const isDark = theme === "dark"
  const surface = isDark
    ? "bg-white/[0.06] border-white/10 text-white"
    : "bg-gray-50 border-gray-200 text-gray-900"
  const subtle = isDark ? "text-white/60" : "text-gray-500"
  const panel = isDark ? "bg-slate-800 border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
  const itemHover = isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
  const inputCls = isDark
    ? "bg-slate-900 border-white/15 text-white placeholder:text-white/30"
    : "bg-white border-gray-300 text-gray-900"

  if (selectedActorIds.length === 0) return null

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${surface}`}>
      <span className="text-sm font-semibold tabular-nums">
        {selectedActorIds.length} selected
      </span>
      {movableIds.length !== selectedActorIds.length && (
        <span className={`text-[11px] ${subtle}`}>
          {movableIds.length} movable
        </span>
      )}

      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => {
            setMenuOpen((o) => !o)
            setMode(null)
          }}
          disabled={movableIds.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <MoveRight className="w-4 h-4" /> Move <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className={`absolute right-0 bottom-full mb-2 w-64 rounded-xl border shadow-xl overflow-hidden z-10 ${panel}`}>
            {mode === null && (
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${itemHover}`}
                >
                  <ArrowRightCircle className="w-4 h-4 shrink-0" />
                  Move to Existing List
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${itemHover}`}
                >
                  <ListPlus className="w-4 h-4 shrink-0" />
                  Move to New List
                </button>
              </div>
            )}

            {mode === "existing" && (
              <div className="py-1 max-h-64 overflow-y-auto">
                <div className={`flex items-center justify-between px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide ${subtle}`}>
                  Choose a list
                  <button type="button" onClick={() => setMode(null)} className={itemHover + " rounded p-0.5"}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {availableLists.map((list) => (
                  <button
                    key={list.key}
                    type="button"
                    onClick={() => handleMoveToExisting(list.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${itemHover}`}
                  >
                    <ArrowRightCircle className="w-4 h-4 shrink-0 opacity-70" />
                    {list.name}
                  </button>
                ))}
              </div>
            )}

            {mode === "new" && (
              <form onSubmit={handleMoveToNew} className="p-3">
                <div className={`flex items-center justify-between mb-2 text-[11px] font-medium uppercase tracking-wide ${subtle}`}>
                  New list name
                  <button type="button" onClick={() => setMode(null)} className={itemHover + " rounded p-0.5"}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => {
                    setNewListName(e.target.value)
                    setError("")
                  }}
                  placeholder="e.g. Callback Shortlist"
                  className={`w-full px-2.5 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${inputCls}`}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  <ArrowRightCircle className="w-4 h-4" /> Create &amp; Move
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
