"use client"

import { useCasting } from "@/components/casting/CastingContext"
import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Play, CheckCircle2, XCircle, HelpCircle, Users, Plus, Star, Heart, Calendar, User, MapPin, ImageIcon, Video, FileText, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, MoreHorizontal, MessageSquare } from 'lucide-react'
import { getVideoPlatform } from "@/utils/videoUtils"
import { generatePlaceholderUrl } from "@/utils/imageUtils"
import PlayerViewActionsModal from "./PlayerViewActionsModal"
import PlayerViewNotes from "@/components/player/PlayerViewNotes"
import PhotoViewerModal from "./PhotoViewerModal"
import VideoEmbed from "@/components/video/VideoEmbed"
import { motion, AnimatePresence } from "framer-motion"
import { ModalPortal } from "@/components/ui/modal-portal"
import { Z_INDEX } from "@/utils/zIndex"
import type { Note } from "@/types/casting"

export default function PlayerViewModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCasting()
  const [activeMedia, setActiveMedia] = useState<{
    name: string
    url: string
    platform?: "vimeo" | "youtube"
    videoId?: string
    taggedActorNames: string[]
    markIn?: number
    markOut?: number
  } | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showPhotoViewer, setPhotoViewer] = useState(false)
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [lastVote, setLastVote] = useState<"yes" | "no" | "maybe" | null>(null)
  const [voteHistory, setVoteHistory] = useState<Array<{ actorId: string; vote: "yes" | "no" | "maybe" | null }>>([])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showMaybeNotePrompt, setShowMaybeNotePrompt] = useState(false)
  const [maybeNoteText, setMaybeNoteText] = useState("")

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events if no modals are showing
      if (showActionsModal || showPhotoViewer || showMaybeNotePrompt) return
      
      // Prevent default behavior for arrow keys
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault()
      }

      switch (event.key) {
        case "ArrowLeft":
          handleNavigate(-1)
          break
        case "ArrowRight":
          handleNavigate(1)
          break
        case "Escape":
          handleClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showActionsModal, showPhotoViewer, showMaybeNotePrompt])

  // Get current terminology for user-friendly messaging with comprehensive fallbacks
  const getCurrentTerminology = () => {
    const defaultTerminology = {
      actor: { singular: "Actor", plural: "Actors" },
      character: { singular: "Character", plural: "Characters" },
      actors: "Actors",
      actor_singular: "Actor",
      addActor: "Add Actor",
      uploadActors: "Upload Actors",
      character_singular: "Character",
      characters: "Characters",
      addCharacter: "Add Character",
    }

    let projectTerminology = {}
    if (currentProject?.terminology) {
      projectTerminology = currentProject.terminology
    } else if (state.terminology) {
      projectTerminology = state.terminology
    }

    const mergedTerminology = { ...defaultTerminology, ...projectTerminology }

    if (!mergedTerminology.actor || typeof mergedTerminology.actor !== "object") {
      mergedTerminology.actor = defaultTerminology.actor
    }
    if (!mergedTerminology.character || typeof mergedTerminology.character !== "object") {
      mergedTerminology.character = defaultTerminology.character
    }

    mergedTerminology.actor = {
      singular: mergedTerminology.actor?.singular || defaultTerminology.actor.singular,
      plural: mergedTerminology.actor?.plural || defaultTerminology.actor.plural,
    }
    mergedTerminology.character = {
      singular: mergedTerminology.character?.singular || defaultTerminology.character.singular,
      plural: mergedTerminology.character?.plural || defaultTerminology.character.plural,
    }

    mergedTerminology.actors = mergedTerminology.actor.plural
    mergedTerminology.actor_singular = mergedTerminology.actor.singular
    mergedTerminology.character_singular = mergedTerminology.character.singular

    return mergedTerminology
  }

  const terminology = getCurrentTerminology()

  const safeToLowerCase = (str: string | undefined | null): string => {
    if (typeof str === "string") {
      return str.toLowerCase()
    }
    return ""
  }

  const getCurrentList = () => {
    if (!currentCharacter) return []

    const { activeTabKey } = state.currentFocus
    if (activeTabKey === "shortLists") {
      return currentCharacter.actors.shortLists.flatMap((sl) => sl.actors).filter((a) => !a.isGreenlit)
    }
    const actors = currentCharacter.actors[activeTabKey as keyof typeof currentCharacter.actors]
    return Array.isArray(actors) ? actors.filter((a) => !a.isGreenlit) : []
  }

  const currentList = getCurrentList()
  const currentIndex = state.currentFocus.playerView.currentIndex
  const currentActor = currentList[currentIndex]

  const handleClose = () => {
    dispatch({ type: "CLOSE_PLAYER_VIEW" })
    if (onClose) {
      onClose()
    }
  }

  const handleAddActor = () => {
    handleClose()
    dispatch({ type: "OPEN_MODAL", payload: { type: "addActor" } })
  }

  const handleUploadActors = () => {
    handleClose()
    dispatch({ type: "OPEN_MODAL", payload: { type: "uploadActors" } })
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Early return with enhanced empty states (keeping existing logic but with updated styling)
  if (!currentProject) {
    return (
      <ModalPortal modalType="playerView" onBackdropClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative"
        >
          <div className="flex justify-between items-center p-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Player View
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Project Selected</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              Please select a project to use the Player View feature.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </motion.div>
      </ModalPortal>
    )
  }

  if (!currentCharacter) {
    return (
      <ModalPortal modalType="playerView" onBackdropClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto relative"
        >
          <div className="flex justify-between items-center p-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Player View
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-full flex items-center justify-center">
              <HelpCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No {terminology.character?.singular || "Character"} Selected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              Please select a {safeToLowerCase(terminology.character?.singular || "character")} to use the Player View
              feature.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </motion.div>
      </ModalPortal>
    )
  }

  // Enhanced empty state for no actors (keeping existing logic but with updated styling)
  if (!currentActor || currentList.length === 0) {
    const actorsLabel = terminology.actor?.plural || terminology.actors || "Actors"
    const actorLabel = terminology.actor?.singular || terminology.actor_singular || "Actor"
    const addActorLabel = terminology.addActor || `Add ${actorLabel}`
    const uploadActorsLabel = terminology.uploadActors || `Upload ${actorsLabel}`
    const characterLabel = terminology.character?.singular || terminology.character_singular || "Character"

    return (
      <ModalPortal modalType="playerView" onBackdropClick={handleClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto relative"
        >
          <div className="relative bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Casting for: {currentCharacter.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Ready to start your casting journey</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-white/50 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-lg mx-auto"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-emerald-200 to-emerald-300 dark:from-emerald-800 dark:to-emerald-700 rounded-full flex items-center justify-center">
                  <Users className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
                No {actorsLabel} Available
              </h3>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  The Player View becomes available once you've added {safeToLowerCase(actorsLabel)} to the{" "}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentCharacter.name}</span>{" "}
                  {safeToLowerCase(characterLabel)}. Start by adding some {safeToLowerCase(actorsLabel)} to begin
                  reviewing and voting.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleAddActor}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
                >
                  <Plus className="w-6 h-6" />
                  {addActorLabel}
                </button>

                <button
                  onClick={handleUploadActors}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg font-semibold"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {uploadActorsLabel}
                </button>

                <button
                  onClick={handleClose}
                  className="w-full px-8 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-lg font-medium"
                >
                  Close Player View
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </ModalPortal>
    )
  }

  // Continue with the rest of the component logic...
  const currentHeadshotIndex = state.currentFocus.playerView.currentHeadshotIndex
  const headshots = currentActor.headshots || []

  const getActualHeadshotUrl = (index = 0) => {
    if (headshots.length === 0) {
      return generatePlaceholderUrl()
    }

    const headshot = headshots[index]
    if (!headshot) {
      return generatePlaceholderUrl()
    }

    if (headshot.startsWith("data:image/")) {
      return headshot
    }

    if (headshot.startsWith("http://") || headshot.startsWith("https://")) {
      return headshot
    }

    if (headshot.startsWith("/")) {
      return headshot
    }

    return generatePlaceholderUrl(headshot)
  }

  const getCurrentImageUrl = () => {
    if (imageErrors.has(currentHeadshotIndex)) {
      return generatePlaceholderUrl()
    }
    return getActualHeadshotUrl(currentHeadshotIndex)
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.add(index)
      return newSet
    })
  }

  const handleImageLoad = (index: number) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const handleVote = (vote: "yes" | "no" | "maybe") => {
    if (!state.currentUser) return

    // Special handling for 'maybe' vote - require a note
    if (vote === "maybe") {
      const hasExistingNotes = currentActor.notes && currentActor.notes.length > 0
      if (!hasExistingNotes) {
        setShowMaybeNotePrompt(true)
        return
      }
    }

    setLastVote(vote)
    setVoteHistory((prev) => [...prev, { actorId: currentActor.id, vote }])

    dispatch({
      type: "CAST_VOTE",
      payload: {
        actorId: currentActor.id,
        characterId: currentCharacter.id,
        vote,
        userId: state.currentUser.id,
      },
    })

    setIsTransitioning(true)

    setTimeout(() => {
      if (currentIndex < currentList.length - 1) {
        handleNavigate(1)
      } else {
        setIsTransitioning(false)
      }
    }, 800)
  }

  const handleMaybeWithNote = () => {
    if (!maybeNoteText.trim() || !state.currentUser || !currentActor || !currentCharacter) return

    // First add the note
    const note: Note = {
      id: `note-${Date.now()}-${Math.random()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      timestamp: Date.now(),
      text: maybeNoteText.trim(),
    }

    dispatch({
      type: "ADD_NOTE",
      payload: {
        actorId: currentActor.id,
        characterId: currentCharacter.id,
        note,
      },
    })

    // Then cast the vote
    setLastVote("maybe")
    setVoteHistory((prev) => [...prev, { actorId: currentActor.id, vote: "maybe" }])

    dispatch({
      type: "CAST_VOTE",
      payload: {
        actorId: currentActor.id,
        characterId: currentCharacter.id,
        vote: "maybe",
        userId: state.currentUser.id,
      },
    })

    // Reset the prompt
    setShowMaybeNotePrompt(false)
    setMaybeNoteText("")

    setIsTransitioning(true)

    setTimeout(() => {
      if (currentIndex < currentList.length - 1) {
        handleNavigate(1)
      } else {
        setIsTransitioning(false)
      }
    }, 800)
  }

  const handleNavigate = (direction: number) => {
    setIsTransitioning(false)
    setLastVote(null)
    dispatch({ type: "NAVIGATE_PLAYER_VIEW", payload: direction })
    setImageErrors(new Set())
    setActiveMedia(null)
  }

  const handleHeadshotNavigate = (direction: number) => {
    if (headshots.length <= 1) return
    let newIndex = currentHeadshotIndex + direction
    if (newIndex < 0) newIndex = headshots.length - 1
    if (newIndex >= headshots.length) newIndex = 0
    dispatch({ type: "SET_PLAYER_HEADSHOT", payload: newIndex })
  }

  const getUserVoteDisplay = (userId: string) => {
    const vote = currentActor.userVotes[userId]
    if (vote === "yes") return { display: "Yes", class: "bg-gradient-to-r from-green-500 to-green-600 text-white" }
    if (vote === "no") return { display: "No", class: "bg-gradient-to-r from-red-500 to-red-600 text-white" }
    if (vote === "maybe") return { display: "Maybe", class: "bg-gradient-to-r from-blue-500 to-blue-600 text-white" }
    return { display: "Pending", class: "bg-gray-100 text-gray-500 border border-gray-300" }
  }

  const currentUserVote = state.currentUser ? currentActor.userVotes[state.currentUser.id] : null

  // Get all media dynamically from current actor
  const getAllMedia = () => {
    const media: Array<{
      name: string
      url: string
      platform?: "vimeo" | "youtube"
      videoId?: string
      taggedActorNames: string[]
      markIn?: number
      markOut?: number
    }> = []

    if (currentActor.mediaMaterials) {
      currentActor.mediaMaterials.forEach((material) => {
        const platform = getVideoPlatform(material.url)
        media.push({
          name: material.name,
          url: material.url,
          platform: platform || undefined,
          taggedActorNames: material.taggedActorNames || [],
        })
      })
    }

    if (currentActor.showreels) {
      currentActor.showreels.forEach((reel) => {
        const platform = getVideoPlatform(reel.url)
        media.push({
          name: `Showreel: ${reel.name}`,
          url: reel.url,
          platform: platform || undefined,
          taggedActorNames: reel.taggedActorNames || [],
        })
      })
    }

    if (currentActor.auditionTapes) {
      currentActor.auditionTapes.forEach((tape) => {
        const platform = getVideoPlatform(tape.url)
        media.push({
          name: `Audition: ${tape.name}`,
          url: tape.url,
          platform: platform || undefined,
          taggedActorNames: tape.taggedActorNames || [],
        })
      })
    }

    if (currentActor.vimeoVideos) {
      currentActor.vimeoVideos.forEach((video) => {
        media.push({
          name: video.title || `Video ${video.videoId}`,
          url: video.url,
          platform: video.platform,
          videoId: video.videoId,
          taggedActorNames: video.taggedActorNames || [],
          markIn: video.markIn,
          markOut: video.markOut,
        })
      })
    }

    if (currentActor.youtubeVideos) {
      currentActor.youtubeVideos.forEach((video) => {
        media.push({
          name: video.title || `YouTube Video ${video.videoId}`,
          url: video.url,
          platform: video.platform,
          videoId: video.videoId,
          taggedActorNames: video.taggedActorNames || [],
          markIn: video.markIn,
          markOut: video.markOut,
        })
      })
    }

    return media
  }

  const allMedia = getAllMedia()

  const handleMoreActions = () => {
    setShowActionsModal(true)
  }

  const handleOpenPhotoViewer = (index: number) => {
    setPhotoViewerIndex(index)
    setPhotoViewer(true)
  }

  const handleMediaSelect = (media: typeof activeMedia) => {
    setActiveMedia(media)
  }

  const getVoteIcon = (vote: "yes" | "no" | "maybe" | null) => {
    switch (vote) {
      case "yes":
        return <CheckCircle2 className="w-20 h-20 text-green-500" />
      case "no":
        return <XCircle className="w-20 h-20 text-red-500" />
      case "maybe":
        return <HelpCircle className="w-20 h-20 text-blue-500" />
      default:
        return null
    }
  }

  const progressPercentage = ((currentIndex + 1) / currentList.length) * 100

  return (
    <ModalPortal modalType="playerView" onBackdropClick={handleClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] flex flex-col relative overflow-hidden"
      >
        {/* Compact Header */}
        <div className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center px-6 py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {currentCharacter.name}
                </h2>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{currentActor.name}</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                Use ← → keys to navigate
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compact Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 h-1">
              <motion.div
                className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 h-1 relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </motion.div>
            </div>
            <div className="flex justify-between items-center px-6 py-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                {currentIndex + 1} of {currentList.length}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Main Content - Proportional Three-Column Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Actor Info - Fixed Proportional Width */}
          <div className="w-[25%] min-w-[240px] max-w-[320px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
            {/* Actor Photo - Responsive Size */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentActor.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div
                    className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 mx-auto relative cursor-pointer group"
                    onClick={() => handleOpenPhotoViewer(currentHeadshotIndex)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <img
                      src={getCurrentImageUrl() || "/placeholder.svg"}
                      alt={currentActor.name}
                      className="w-full h-full rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-lg group-hover:shadow-xl transition-all duration-300"
                      onLoad={() => handleImageLoad(currentHeadshotIndex)}
                      onError={() => handleImageError(currentHeadshotIndex)}
                    />

                    {/* Navigation for Headshots - Responsive */}
                    {headshots.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-1 sm:px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHeadshotNavigate(-1)
                          }}
                          className="bg-black/60 backdrop-blur-sm text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-black/80 transition-all transform hover:scale-110"
                        >
                          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHeadshotNavigate(1)
                          }}
                          className="bg-black/60 backdrop-blur-sm text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-black/80 transition-all transform hover:scale-110"
                        >
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    )}

                    {/* Image Counter - Responsive */}
                    {headshots.length > 1 && (
                      <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium">
                        {currentHeadshotIndex + 1}/{headshots.length}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Collapsible Actor Details */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentActor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2 sm:space-y-3 p-3 sm:p-4"
                >
                  {/* Basic Info - Responsive */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 truncate">
                      {currentActor.name}
                    </h3>
                    <div className="space-y-1 text-xs">
                      {currentActor.age && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Age: {currentActor.age}</span>
                        </div>
                      )}
                      {currentActor.playingAge && (
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">Playing: {currentActor.playingAge}</span>
                        </div>
                      )}
                      {currentActor.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400 truncate">{currentActor.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Status Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => toggleSection("status")}
                      className="w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                    >
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Status
                      </h4>
                      {collapsedSections.has("status") ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    {!collapsedSections.has("status") && (
                      <div className="px-2 sm:px-3 pb-2 sm:pb-3">
                        {currentActor.statuses && currentActor.statuses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {currentActor.statuses.map((status) => (
                              <span
                                key={status.id}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                              >
                                {status.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No status assigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Collapsible Skills Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => toggleSection("skills")}
                      className="w-full flex items-center justify-between p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
                    >
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <Star className="w-3 h-3 text-yellow-500 mr-2" />
                        Skills
                      </h4>
                      {collapsedSections.has("skills") ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    {!collapsedSections.has("skills") && (
                      <div className="px-2 sm:px-3 pb-2 sm:pb-3">
                        {currentActor.skills && currentActor.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {currentActor.skills.map((skill) => (
                              <span
                                key={skill}
                                className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">No skills listed</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assets Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <FileText className="w-3 h-3 text-purple-500 mr-2" />
                      Assets
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <ImageIcon className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{headshots.length}</div>
                        <div className="text-xs text-gray-500">Photos</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <Video className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{allMedia.length}</div>
                        <div className="text-xs text-gray-500">Videos</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Center - Media Player with Constrained Proportional Sizing */}
          <div className="flex-1 min-w-0 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-100 dark:to-gray-200 relative">
            {/* Media Player Container - Constrained to Available Space */}
            <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div
                  className="relative max-w-full max-h-full"
                  style={{
                    aspectRatio: "16/10",
                    width: "min(100%, calc((100vh - 350px) * 1.6))",
                    height: "min(calc(100% - 20px), calc(100vh - 350px))",
                    maxWidth: "calc(100vw - 640px)", // Reserve space for both sidebars
                  }}
                >
                  <div className="w-full h-full bg-black rounded-xl overflow-hidden relative shadow-2xl">
                    {activeMedia ? (
                      <div className="w-full h-full">
                        {activeMedia.platform &&
                        (activeMedia.platform === "vimeo" || activeMedia.platform === "youtube") ? (
                          <VideoEmbed
                            url={activeMedia.url}
                            title={activeMedia.name}
                            autoplay={false}
                            controls={true}
                            muted={false}
                            markIn={activeMedia.markIn}
                            markOut={activeMedia.markOut}
                            className="w-full h-full rounded-xl"
                            onError={(error) => console.warn("Video playback error:", error)}
                          />
                        ) : (
                          <div className="text-center flex flex-col items-center justify-center h-full text-white p-4">
                            <Play className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                            <h4 className="text-lg sm:text-xl font-semibold mb-2 truncate max-w-full">
                              {activeMedia.name}
                            </h4>
                            <p className="text-xs sm:text-sm opacity-75 mb-4 truncate max-w-full">
                              URL: {activeMedia.url}
                            </p>
                            <a
                              href={activeMedia.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
                            >
                              Open in new tab
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center flex flex-col items-center justify-center h-full text-white p-4">
                        {isTransitioning && lastVote ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="flex flex-col items-center"
                          >
                            {getVoteIcon(lastVote)}
                            <p className="mt-4 text-xl sm:text-2xl font-bold">
                              {lastVote === "yes" ? "Yes!" : lastVote === "no" ? "No" : "Maybe"}
                            </p>
                            <p className="text-gray-400 mt-2 text-sm sm:text-base">Moving to next actor...</p>
                          </motion.div>
                        ) : (
                          <div className="text-center">
                            <Play className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-gray-600" />
                            <p className="text-lg sm:text-xl text-gray-400 mb-2">Select media to play</p>
                            <p className="text-xs sm:text-sm text-gray-500">Choose from the media list below</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Media List - Fixed Height with Responsive Design */}
            <div className="bg-white dark:bg-gray-50 border-t border-gray-300 dark:border-gray-400 flex-shrink-0">
              <div className="p-2 sm:p-3 lg:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h4 className="text-gray-900 dark:text-gray-800 font-semibold flex items-center text-xs sm:text-sm">
                    <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Media Library ({allMedia.length})
                  </h4>
                  <div className="flex items-center space-x-2">
                    {activeMedia && (
                      <button
                        onClick={() => setActiveMedia(null)}
                        className="text-gray-600 hover:text-gray-900 text-xs transition-colors"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Media List - Responsive Height with Scrolling */}
                <div className="h-28 sm:h-32 lg:h-36 overflow-y-auto space-y-1 sm:space-y-2 mb-2 sm:mb-3 bg-gray-50 dark:bg-gray-100 rounded-lg p-2 sm:p-3 border border-gray-200">
                  {allMedia.length > 0 ? (
                    allMedia.map((media, idx) => (
                      <button
                        key={`${media.url}-${idx}`}
                        onClick={() => handleMediaSelect(media)}
                        className={`block w-full text-left text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all ${
                          activeMedia?.url === media.url
                            ? "bg-blue-600 text-white shadow-lg"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{media.name}</span>
                          </div>
                          {media.platform && (
                            <span
                              className={`text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded flex-shrink-0 ml-2 ${
                                media.platform === "vimeo" ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                              }`}
                            >
                              {media.platform.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs sm:text-sm">
                      <Video className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-50" />
                      <p>No media available</p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons - Responsive Design */}
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-200 rounded-lg p-2 sm:p-3 gap-2 sm:gap-4">
                  <button
                    onClick={() => handleNavigate(-1)}
                    disabled={currentIndex === 0}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-50 text-gray-700 dark:text-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md text-xs sm:text-sm font-medium"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  <div className="text-gray-700 dark:text-gray-800 text-xs sm:text-sm font-semibold px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-50 rounded-lg shadow-sm whitespace-nowrap">
                    {currentIndex + 1} of {currentList.length}
                  </div>

                  <button
                    onClick={() => handleNavigate(1)}
                    disabled={currentIndex === currentList.length - 1}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-50 text-gray-700 dark:text-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md text-xs sm:text-sm font-medium"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Voting & Notes - Fixed Proportional Width */}
          <div className="w-[25%] min-w-[240px] max-w-[320px] bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
            {/* Voting Section - Responsive */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-2"></div>
                Cast Your Vote
              </h4>

              {/* Vote Buttons - Responsive Grid */}
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4">
                <button
                  onClick={() => handleVote("yes")}
                  className={`relative overflow-hidden px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                    currentUserVote === "yes"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-600 shadow-lg shadow-green-500/25"
                      : "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-300 hover:from-green-100 hover:to-green-200"
                  }`}
                >
                  <Heart className="w-3 h-3 mx-auto mb-1" />
                  Yes
                  {currentUserVote === "yes" && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                </button>
                <button
                  onClick={() => handleVote("no")}
                  className={`relative overflow-hidden px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                    currentUserVote === "no"
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-600 shadow-lg shadow-red-500/25"
                      : "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-300 hover:from-red-100 hover:to-red-200"
                  }`}
                >
                  <X className="w-3 h-3 mx-auto mb-1" />
                  No
                  {currentUserVote === "no" && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                </button>
                <button
                  onClick={() => handleVote("maybe")}
                  className={`relative overflow-hidden px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                    currentUserVote === "maybe"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25"
                      : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 hover:from-blue-100 hover:to-blue-200"
                  }`}
                >
                  <Star className="w-3 h-3 mx-auto mb-1" />
                  Maybe
                  {currentUserVote === "maybe" && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                </button>
              </div>

              {/* Team Votes - Responsive */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 shadow-sm border border-gray-100 dark:border-gray-700 mb-3">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Users className="w-3 h-3 mr-2" />
                  Team Votes
                </h5>
                <div className="space-y-1">
                  {state.users.map((user) => {
                    const voteInfo = getUserVoteDisplay(user.id)
                    return (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0"
                            style={{ backgroundColor: user.bgColor, color: user.color }}
                          >
                            {user.initials}
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.name}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full text-xs font-bold ${voteInfo.class} flex-shrink-0`}
                        >
                          {voteInfo.display}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* More Actions Button - Responsive */}
              <button
                onClick={handleMoreActions}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 font-medium text-xs sm:text-sm flex items-center justify-center"
              >
                <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                More Actions
              </button>
            </div>

            {/* Notes Section */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full">
                <PlayerViewNotes actor={currentActor} characterId={currentCharacter.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showActionsModal && (
          <PlayerViewActionsModal
            onClose={() => setShowActionsModal(false)}
            actor={currentActor}
            characterId={currentCharacter.id}
          />
        )}

        {showPhotoViewer && headshots.length > 0 && (
          <div style={{ zIndex: Z_INDEX.PHOTO_VIEWER }}>
            <PhotoViewerModal
              photos={headshots}
              initialIndex={photoViewerIndex}
              actorName={currentActor.name}
              onClose={() => setPhotoViewer(false)}
            />
          </div>
        )}

        {/* Maybe Note Prompt Modal */}
        {showMaybeNotePrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-[70] flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add a Note for "Maybe"</h3>
                    <p className="text-sm text-gray-600">Please explain why you're unsure about this actor</p>
                  </div>
                </div>
                
                <textarea
                  value={maybeNoteText}
                  onChange={(e) => setMaybeNoteText(e.target.value)}
                  placeholder="Add your thoughts about this actor..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  autoFocus
                />
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowMaybeNotePrompt(false)
                      setMaybeNoteText("")
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMaybeWithNote}
                    disabled={!maybeNoteText.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Vote Maybe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ModalPortal>
  )
}
