"use client"

import { useState } from "react"
import { useCasting, DEFAULT_PLAYER_SESSION_CONFIG } from "@/components/casting/CastingContext"
import {
  X, Play, Calendar, User, MapPin, Star, MessageSquare, Users, Eye, EyeOff,
  Clapperboard, Plus, Trash2, ChevronRight, Clock, ImageIcon, Video, Minus, ThumbsUp,
} from "lucide-react"
import { motion } from "framer-motion"
import { ModalPortal } from "@/components/ui/modal-portal"
import type { PlayerSessionConfig, PlayerDecisionButton } from "@/types/casting"
import { getActorImageSlides, getActorVideoSlides } from "@/utils/playerMedia"

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

const OUTCOME_STYLES: Record<PlayerDecisionButton["outcome"], string> = {
  yes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  maybe: "bg-amber-100 text-amber-700 border-amber-200",
  no: "bg-rose-100 text-rose-700 border-rose-200",
}

export default function PlayerConfigModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  // Actors in the currently active list (for the count badge and slides editor).
  const actorList = (() => {
    if (!currentCharacter) return []
    const { activeTabKey } = state.currentFocus
    if (activeTabKey === "shortLists") {
      return currentCharacter.actors.shortLists.flatMap((sl) => sl.actors).filter((a) => !a.isGreenlit)
    }
    const actors = currentCharacter.actors[activeTabKey as keyof typeof currentCharacter.actors]
    return Array.isArray(actors) ? actors.filter((a) => !a.isGreenlit) : []
  })()
  const actorCount = actorList.length

  const base = state.currentFocus.playerView.config ?? DEFAULT_PLAYER_SESSION_CONFIG
  const [config, setConfig] = useState<PlayerSessionConfig>(() => ({
    ...base,
    decisionButtons:
      base.decisionButtons && base.decisionButtons.length > 0
        ? base.decisionButtons
        : [
            { id: "yes", label: "Yes", outcome: "yes", enabled: base.decisions.yes },
            { id: "maybe", label: "Maybe", outcome: "maybe", enabled: base.decisions.maybe },
            { id: "no", label: "No", outcome: "no", enabled: base.decisions.no },
          ],
    showDecisionButtons: base.showDecisionButtons ?? true,
    autoAdvance: base.autoAdvance ?? true,
    autoAdvanceSeconds: base.autoAdvanceSeconds ?? 1,
    slides: base.slides ?? {},
  }))

  const decisionButtonsEnabled = config.showDecisionButtons ?? true

  // Which actor's slides/media panel is expanded (null = none).
  const [expandedActorId, setExpandedActorId] = useState<string | null>(null)

  const setSection = (key: keyof PlayerSessionConfig["sections"], value: boolean) =>
    setConfig((prev) => ({ ...prev, sections: { ...prev.sections, [key]: value } }))

  // --- Decision button helpers -------------------------------------------
  const buttons = config.decisionButtons ?? []

  const updateButton = (id: string, patch: Partial<PlayerDecisionButton>) =>
    setConfig((prev) => ({
      ...prev,
      decisionButtons: (prev.decisionButtons ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }))

  const removeButton = (id: string) =>
    setConfig((prev) => ({
      ...prev,
      decisionButtons: (prev.decisionButtons ?? []).filter((b) => b.id !== id),
    }))

  const addButton = () =>
    setConfig((prev) => ({
      ...prev,
      decisionButtons: [
        ...(prev.decisionButtons ?? []),
        { id: `btn-${Date.now()}`, label: "New button", outcome: "maybe", enabled: true },
      ],
    }))

  // --- Slides & media helpers --------------------------------------------
  const getSlide = (actorId: string) => config.slides?.[actorId] ?? {}

  const isMediaHidden = (actorId: string, key: string) => (getSlide(actorId).hidden ?? []).includes(key)

  const toggleMediaVisible = (actorId: string, key: string) =>
    setConfig((prev) => {
      const slide = prev.slides?.[actorId] ?? {}
      const hidden = new Set(slide.hidden ?? [])
      if (hidden.has(key)) hidden.delete(key)
      else hidden.add(key)
      return {
        ...prev,
        slides: { ...(prev.slides ?? {}), [actorId]: { ...slide, hidden: Array.from(hidden) } },
      }
    })

  const renameMedia = (actorId: string, key: string, name: string) =>
    setConfig((prev) => {
      const slide = prev.slides?.[actorId] ?? {}
      const names = { ...(slide.names ?? {}) }
      if (name.trim()) names[key] = name
      else delete names[key]
      return {
        ...prev,
        slides: { ...(prev.slides ?? {}), [actorId]: { ...slide, names } },
      }
    })

  const handleStart = () => {
    const enabledButtons = buttons.filter((b) => b.enabled && b.label.trim())
    // Guarantee at least one decision option so voting is always possible.
    const finalButtons =
      enabledButtons.length > 0
        ? buttons.map((b) => ({ ...b, label: b.label.trim() || "Button" }))
        : DEFAULT_PLAYER_SESSION_CONFIG.decisionButtons!

    // Keep the legacy `decisions` map in sync for backward compatibility.
    const active = finalButtons.filter((b) => b.enabled)
    const decisions = {
      yes: active.some((b) => b.outcome === "yes"),
      maybe: active.some((b) => b.outcome === "maybe"),
      no: active.some((b) => b.outcome === "no"),
    }

    dispatch({
      type: "START_PLAYER_VIEW",
      payload: {
        config: {
          ...config,
          title: config.title.trim() || "Review session",
          decisionButtons: finalButtons,
          decisions: decisions.yes || decisions.maybe || decisions.no ? decisions : { yes: true, maybe: true, no: true },
          autoAdvanceSeconds: Math.max(0, Math.min(30, config.autoAdvanceSeconds ?? 1)),
        },
      },
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
              <h2 className="text-lg font-bold text-slate-900">Configure Review</h2>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
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

          <div className="grid gap-5 lg:grid-cols-2">
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
                  label="Team decisions"
                  description="Show how the rest of the team decided"
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
          </div>

          {/* Decision buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision buttons</h3>
              {decisionButtonsEnabled && (
                <button
                  onClick={addButton}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add button
                </button>
              )}
            </div>
            <ToggleRow
              icon={<ThumbsUp className="w-4 h-4" />}
              label="Show decision buttons"
              description="Turn off to browse actors and leave comments only"
              checked={decisionButtonsEnabled}
              onChange={(v) => setConfig((prev) => ({ ...prev, showDecisionButtons: v }))}
            />
            {decisionButtonsEnabled && (
              <>
                <p className="text-xs text-slate-500 mt-3 mb-2">
                  Rename labels, toggle visibility, or add buttons. Each button records a Positive, Negative, or Neutral outcome.
                </p>
                <div className="space-y-2">
                  {buttons.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${
                    b.enabled ? "bg-white border-slate-200" : "bg-slate-50 border-slate-200 opacity-70"
                  }`}
                >
                  <button
                    onClick={() => updateButton(b.id, { enabled: !b.enabled })}
                    className={`flex-shrink-0 ${b.enabled ? "text-emerald-600" : "text-slate-300"}`}
                    aria-label={b.enabled ? "Hide button" : "Show button"}
                  >
                    {b.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <input
                    value={b.label}
                    onChange={(e) => updateButton(b.id, { label: e.target.value })}
                    placeholder="Button label"
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <select
                    value={b.outcome}
                    onChange={(e) => updateButton(b.id, { outcome: e.target.value as PlayerDecisionButton["outcome"] })}
                    className={`flex-shrink-0 text-xs font-semibold rounded-md border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${OUTCOME_STYLES[b.outcome]}`}
                  >
                    <option value="yes">Positive</option>
                    <option value="no">Negative</option>
                    <option value="maybe">Neutral</option>
                  </select>
                  <button
                    onClick={() => removeButton(b.id)}
                    disabled={buttons.length <= 1}
                    className="flex-shrink-0 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
                    aria-label="Remove button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Playback — auto-advance only applies when decisions can be made */}
          <div className={decisionButtonsEnabled ? "" : "hidden"}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Playback</h3>
            <div className="space-y-2">
              <ToggleRow
                icon={<Play className="w-4 h-4" />}
                label="Auto-advance after a selection"
                description="Automatically move to the next actor once a decision is made"
                checked={config.autoAdvance ?? true}
                onChange={(v) => setConfig((prev) => ({ ...prev, autoAdvance: v }))}
              />
              {(config.autoAdvance ?? true) && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-white">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-slate-700">Advance after</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          autoAdvanceSeconds: Math.max(0, (prev.autoAdvanceSeconds ?? 1) - 1),
                        }))
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                      aria-label="Decrease seconds"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={config.autoAdvanceSeconds ?? 1}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          autoAdvanceSeconds: Math.max(0, Math.min(30, Number(e.target.value) || 0)),
                        }))
                      }
                      className="w-14 text-center px-2 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          autoAdvanceSeconds: Math.min(30, (prev.autoAdvanceSeconds ?? 1) + 1),
                        }))
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                      aria-label="Increase seconds"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm text-slate-500 ml-1">sec</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Slides & media */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Slides &amp; media</h3>
            <p className="text-xs text-slate-500 mb-2">
              Rename slides and choose exactly which images and videos appear in the player for each actor.
            </p>
            {actorList.length === 0 ? (
              <p className="text-sm text-slate-400 px-3 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                No actors in this list yet.
              </p>
            ) : (
              <div className="space-y-2">
                {actorList.map((actor) => {
                  const images = getActorImageSlides(actor)
                  const videos = getActorVideoSlides(actor)
                  const slide = getSlide(actor.id)
                  const hiddenCount = (slide.hidden ?? []).length
                  const isExpanded = expandedActorId === actor.id
                  const totalMedia = images.length + videos.length
                  return (
                    <div key={actor.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedActorId(isExpanded ? null : actor.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-slate-800 truncate">{actor.name}</span>
                          <span className="block text-xs text-slate-500">
                            {images.length} {images.length === 1 ? "photo" : "photos"} · {videos.length}{" "}
                            {videos.length === 1 ? "video" : "videos"}
                            {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
                          </span>
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/50">
                          {totalMedia === 0 && (
                            <p className="text-xs text-slate-400 py-2">This actor has no images or videos.</p>
                          )}

                          {/* Images */}
                          {images.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pt-1">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Images
                              </div>
                              {images.map((im) => {
                                const hidden = isMediaHidden(actor.id, im.key)
                                return (
                                  <div key={im.key} className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleMediaVisible(actor.id, im.key)}
                                      className={`flex-shrink-0 ${hidden ? "text-slate-300" : "text-emerald-600"}`}
                                      aria-label={hidden ? "Show slide" : "Hide slide"}
                                    >
                                      {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <img
                                      src={im.url || "/placeholder.svg"}
                                      alt={im.defaultName}
                                      className={`w-9 h-9 rounded object-cover border border-slate-200 flex-shrink-0 ${
                                        hidden ? "opacity-40" : ""
                                      }`}
                                    />
                                    <input
                                      value={slide.names?.[im.key] ?? ""}
                                      onChange={(e) => renameMedia(actor.id, im.key, e.target.value)}
                                      placeholder={im.defaultName}
                                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Videos */}
                          {videos.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pt-1">
                                <Video className="w-3.5 h-3.5" />
                                Videos
                              </div>
                              {videos.map((vid) => {
                                const hidden = isMediaHidden(actor.id, vid.key)
                                return (
                                  <div key={vid.key} className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleMediaVisible(actor.id, vid.key)}
                                      className={`flex-shrink-0 ${hidden ? "text-slate-300" : "text-emerald-600"}`}
                                      aria-label={hidden ? "Show video" : "Hide video"}
                                    >
                                      {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <span className="w-9 h-9 rounded bg-slate-200 flex items-center justify-center flex-shrink-0">
                                      <Play className="w-4 h-4 text-slate-500" />
                                    </span>
                                    <input
                                      value={slide.names?.[vid.key] ?? ""}
                                      onChange={(e) => renameMedia(actor.id, vid.key, e.target.value)}
                                      placeholder={vid.name}
                                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
            Start Review Session
          </button>
        </div>
      </motion.div>
    </ModalPortal>
  )
}
