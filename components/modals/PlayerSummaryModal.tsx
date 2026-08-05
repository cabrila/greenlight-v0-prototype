"use client"

import { useMemo, useState } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { motion } from "framer-motion"
import { ModalPortal } from "@/components/ui/modal-portal"
import { generatePlaceholderUrl } from "@/utils/imageUtils"
import { X, Play, CheckCircle2, XCircle, HelpCircle, MessageSquare, Users, ClipboardList, BarChart3 } from "lucide-react"
import type { Actor } from "@/types/casting"
import SummaryMoveBar from "@/components/modals/SummaryMoveBar"

/**
 * Summary board shown when a casting Player View session is completed, and also
 * openable directly from the list controls. Aggregates each actor's team votes
 * (yes / maybe / no) and note counts for the currently focused list.
 */
export default function PlayerSummaryModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  const sessionConfig = state.currentFocus.playerView.config
  const sessionTitle = sessionConfig?.title || "Review session"

  const currentList: Actor[] = useMemo(() => {
    if (!currentCharacter) return []
    const { activeTabKey } = state.currentFocus
    if (activeTabKey === "shortLists") {
      return currentCharacter.actors.shortLists.flatMap((sl) => sl.actors).filter((a) => !a.isGreenlit)
    }
    const actors = currentCharacter.actors[activeTabKey as keyof typeof currentCharacter.actors]
    return Array.isArray(actors) ? (actors as Actor[]).filter((a) => !a.isGreenlit) : []
  }, [currentCharacter, state.currentFocus])

  // Per-actor tally of team votes and notes.
  const rows = useMemo(() => {
    return currentList.map((actor) => {
      const votes = Object.values(actor.userVotes || {})
      const yes = votes.filter((v) => v === "yes").length
      const maybe = votes.filter((v) => v === "maybe").length
      const no = votes.filter((v) => v === "no").length
      const noteCount = actor.notes?.length || 0
      const decided = yes + maybe + no
      return { actor, yes, maybe, no, noteCount, decided }
    })
  }, [currentList])

  const totals = useMemo(() => {
    const decidedActors = rows.filter((r) => r.decided > 0).length
    const yes = rows.reduce((s, r) => s + r.yes, 0)
    const maybe = rows.reduce((s, r) => s + r.maybe, 0)
    const no = rows.reduce((s, r) => s + r.no, 0)
    const notes = rows.reduce((s, r) => s + r.noteCount, 0)
    return { decidedActors, yes, maybe, no, notes }
  }, [rows])

  // Selection for the "Move" action in the summary.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const clearSelection = () => setSelectedIds(new Set())

  const handleClose = () => {
    dispatch({ type: "CLOSE_PLAYER_VIEW" })
    onClose?.()
  }

  const getHeadshot = (actor: Actor) => {
    const first = actor.headshots?.[0]
    if (!first) return generatePlaceholderUrl()
    if (
      first.startsWith("data:image/") ||
      first.startsWith("http://") ||
      first.startsWith("https://") ||
      first.startsWith("/")
    ) {
      return first
    }
    return generatePlaceholderUrl(first)
  }

  return (
    <ModalPortal modalType="playerView" onBackdropClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">Decision summary</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentCharacter?.name ? `${currentCharacter.name} · ` : ""}
                {sessionTitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Totals strip */}
        <div className="grid grid-cols-4 gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs font-medium mb-1">
              <Users className="w-3.5 h-3.5" /> Reviewed
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              {totals.decidedActors}
              <span className="text-sm text-gray-400 font-medium">/{rows.length}</span>
            </p>
          </div>
          <div className="rounded-xl bg-[#eef3e9] dark:bg-emerald-900/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#5b7048] text-xs font-medium mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Yes
            </div>
            <p className="text-xl font-bold text-[#4a5b3f] tabular-nums">{totals.yes}</p>
          </div>
          <div className="rounded-xl bg-[#f7efe0] dark:bg-amber-900/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#8a7645] text-xs font-medium mb-1">
              <HelpCircle className="w-3.5 h-3.5" /> Maybe
            </div>
            <p className="text-xl font-bold text-[#7a6a3a] tabular-nums">{totals.maybe}</p>
          </div>
          <div className="rounded-xl bg-[#f5e2e3] dark:bg-red-900/20 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[#a56568] text-xs font-medium mb-1">
              <XCircle className="w-3.5 h-3.5" /> No
            </div>
            <p className="text-xl font-bold text-[#8b4c4f] tabular-nums">{totals.no}</p>
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No actors in this list yet</p>
            </div>
          ) : (
            rows.map(({ actor, yes, maybe, no, noteCount, decided }) => (
              <div
                key={actor.id}
                onClick={() => toggleSelected(actor.id)}
                className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                  selectedIds.has(actor.id)
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-300 dark:ring-emerald-700"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(actor.id)}
                  onChange={() => toggleSelected(actor.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${actor.name}`}
                  className="w-4 h-4 shrink-0 accent-emerald-500 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHeadshot(actor) || "/placeholder.svg"}
                    alt={actor.name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{actor.name}</p>
                  <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {noteCount} note{noteCount === 1 ? "" : "s"}
                    {decided === 0 ? " · not yet reviewed" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#eef3e9] text-[#4a5b3f] text-xs font-semibold tabular-nums">
                    <CheckCircle2 className="w-3 h-3" /> {yes}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#f7efe0] text-[#7a6a3a] text-xs font-semibold tabular-nums">
                    <HelpCircle className="w-3 h-3" /> {maybe}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#f5e2e3] text-[#8b4c4f] text-xs font-semibold tabular-nums">
                    <XCircle className="w-3 h-3" /> {no}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Move bar (shown when actors are selected) */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <SummaryMoveBar
              selectedActorIds={Array.from(selectedIds)}
              onCleared={clearSelection}
              theme="light"
            />
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          <button
            onClick={() => dispatch({ type: "OPEN_PLAYER_VIEW", payload: { actorIndex: 0 } })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Play className="w-4 h-4" /> Back to Review Session
          </button>
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Done
          </button>
        </div>
      </motion.div>
    </ModalPortal>
  )
}
