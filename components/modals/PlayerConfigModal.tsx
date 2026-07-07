"use client"

import { useState } from "react"
import { useCasting, DEFAULT_PLAYER_SESSION_CONFIG } from "@/components/casting/CastingContext"
import {
  X, Play, Calendar, User, MapPin, Star, MessageSquare, Users, Eye, EyeOff,
  CheckCircle2, HelpCircle, XCircle, Clapperboard,
} from "lucide-react"
import { motion } from "framer-motion"
import { ModalPortal } from "@/components/ui/modal-portal"
import type { PlayerSessionConfig } from "@/types/casting"

/** A single toggleable option row. */
function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
        checked
          ? "bg-emerald-50 border-emerald-300"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className={`flex-shrink-0 ${checked ? "text-emerald-600" : "text-slate-400"}`}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${checked ? "text-emerald-800" : "text-slate-700"}`}>
          {label}
        </span>
        {description && <span className="block text-xs text-slate-500 truncate">{description}</span>}
      </span>
      <span className={`flex-shrink-0 ${checked ? "text-emerald-600" : "text-slate-300"}`}>
        {checked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </span>
    </button>
  )
}

export default function PlayerConfigModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  // How many actors are in the currently active list (for the count badge).
  const actorCount = (() => {
    if (!currentCharacter) return 0
    const { activeTabKey } = state.currentFocus
    if (activeTabKey === "shortLists") {
      return currentCharacter.actors.shortLists.flatMap((sl) => sl.actors).filter((a) => !a.isGreenlit).length
    }
    const actors = currentCharacter.actors[activeTabKey as keyof typeof currentCharacter.actors]
    return Array.isArray(actors) ? actors.filter((a) => !a.isGreenlit).length : 0
  })()

  const base = state.currentFocus.playerView.config ?? DEFAULT_PLAYER_SESSION_CONFIG
  const [config, setConfig] = useState<PlayerSessionConfig>(base)

  const setSection = (key: keyof PlayerSessionConfig["sections"], value: boolean) =>
    setConfig((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }))
  const setDecision = (key: keyof PlayerSessionConfig["decisions"], value: boolean) =>
    setConfig((prev) => ({ ...prev, decisions: { ...prev.decisions, [key]: value } }))

  const handleStart = () => {
    // Guarantee at least one decision option so voting is always possible.
    const decisions = config.decisions.yes || config.decisions.maybe || config.decisions.no
      ? config.decisions
      : { yes: true, maybe: true, no: true }
    dispatch({
      type: "START_PLAYER_VIEW",
      payload: { config: { ...config, title: config.title.trim() || "Review session", decisions } },
    })
  }

  return (
    <ModalPortal modalType="playerView" onBackdropClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-lg lg:max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Clapperboard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configure Player</h2>
              <p className="text-sm text-slate-500">
                {currentCharacter?.name ? `${currentCharacter.name} · ` : ""}
                {actorCount} {actorCount === 1 ? "actor" : "actors"} in this list
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — single column when narrow, two balanced columns when wide */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 lg:space-y-0 lg:columns-2 lg:gap-5 lg:[column-fill:balance] lg:[&>div]:mb-5 lg:[&>div]:break-inside-avoid">
          {/* Session title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Session name
            </label>
            <input
              value={config.title}
              onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Review session"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Actor details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Actor details</h3>
            <div className="space-y-2">
              <ToggleRow
                icon={<Calendar className="w-4 h-4" />}
                label="Age"
                checked={config.sections.age}
                onChange={(v) => setSection("age", v)}
              />
              <ToggleRow
                icon={<User className="w-4 h-4" />}
                label="Playing age"
                checked={config.sections.playingAge}
                onChange={(v) => setSection("playingAge", v)}
              />
              <ToggleRow
                icon={<MapPin className="w-4 h-4" />}
                label="Location"
                checked={config.sections.location}
                onChange={(v) => setSection("location", v)}
              />
              <ToggleRow
                icon={<div className="w-2 h-2 rounded-full bg-current" />}
                label="Status"
                checked={config.sections.status}
                onChange={(v) => setSection("status", v)}
              />
              <ToggleRow
                icon={<Star className="w-4 h-4" />}
                label="Skills"
                checked={config.sections.skills}
                onChange={(v) => setSection("skills", v)}
              />
            </div>
          </div>

          {/* Panels */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Panels</h3>
            <div className="space-y-2">
              <ToggleRow
                icon={<Users className="w-4 h-4" />}
                label="Team votes"
                description="Show how the rest of the team voted"
                checked={config.showTeamVotes}
                onChange={(v) => setConfig((prev) => ({ ...prev, showTeamVotes: v }))}
              />
              <ToggleRow
                icon={<MessageSquare className="w-4 h-4" />}
                label="Notes"
                description="Show the notes panel for each actor"
                checked={config.showNotes}
                onChange={(v) => setConfig((prev) => ({ ...prev, showNotes: v }))}
              />
            </div>
          </div>

          {/* Decision buttons */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Decision options</h3>
            <div className="space-y-2">
              <ToggleRow
                icon={<CheckCircle2 className="w-4 h-4" />}
                label="Yes"
                checked={config.decisions.yes}
                onChange={(v) => setDecision("yes", v)}
              />
              <ToggleRow
                icon={<HelpCircle className="w-4 h-4" />}
                label="Maybe"
                checked={config.decisions.maybe}
                onChange={(v) => setDecision("maybe", v)}
              />
              <ToggleRow
                icon={<XCircle className="w-4 h-4" />}
                label="No"
                checked={config.decisions.no}
                onChange={(v) => setDecision("no", v)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-semibold shadow-md transition-all"
          >
            <Play className="w-4 h-4" />
            Start Player View
          </button>
        </div>
      </motion.div>
    </ModalPortal>
  )
}
