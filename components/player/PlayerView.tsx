"use client"

import { useState, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { ChevronLeft, ChevronRight, X, Crown, Star, Heart, MessageSquare, CheckCircle2 } from 'lucide-react'
import PlayerViewNotes from "./PlayerViewNotes"
import type { Note } from "@/types/casting"

export default function PlayerView() {
  const { state, dispatch } = useCasting()
  const [currentHeadshotIndex, setCurrentHeadshotIndex] = useState(0)
  const [showMaybeNotePrompt, setShowMaybeNotePrompt] = useState(false)
  const [maybeNoteText, setMaybeNoteText] = useState("")

  // Get current project and character
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  // Get current list of actors
  const getCurrentList = () => {
    if (!currentCharacter) return []

    const { activeTabKey } = state.currentFocus

    if (activeTabKey === "shortLists") {
      return currentCharacter.actors.shortLists.flatMap((sl) => sl.actors)
    }

    const actors = currentCharacter.actors[activeTabKey as keyof typeof currentCharacter.actors]
    return Array.isArray(actors) ? actors : []
  }

  const currentList = getCurrentList()
  const currentActor = currentList[state.currentFocus.playerView.currentIndex]

  // Reset headshot index when actor changes
  useEffect(() => {
    setCurrentHeadshotIndex(0)
  }, [state.currentFocus.playerView.currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events if player view is open and no modals are showing
      if (!state.currentFocus.playerView.isOpen || showMaybeNotePrompt) return
      
      // Prevent default behavior for arrow keys
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault()
      }

      switch (event.key) {
        case "ArrowLeft":
          handlePrevious()
          break
        case "ArrowRight":
          handleNext()
          break
        case "Escape":
          handleClose()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state.currentFocus.playerView.isOpen, showMaybeNotePrompt])

  // Handle navigation
  const handlePrevious = () => {
    if (state.currentFocus.playerView.currentIndex > 0) {
      dispatch({
        type: "NAVIGATE_PLAYER_VIEW",
        payload: -1,
      })
    }
  }

  const handleNext = () => {
    if (state.currentFocus.playerView.currentIndex < currentList.length - 1) {
      dispatch({
        type: "NAVIGATE_PLAYER_VIEW",
        payload: 1,
      })
    }
  }

  const handleClose = () => {
    dispatch({ type: "CLOSE_PLAYER_VIEW" })
  }

  const handleVote = (vote: "yes" | "no" | "maybe") => {
    if (!state.currentUser || !currentActor || !currentCharacter) return

    // Special handling for 'maybe' vote - require a note
    if (vote === "maybe") {
      const hasExistingNotes = currentActor.notes && currentActor.notes.length > 0
      if (!hasExistingNotes) {
        setShowMaybeNotePrompt(true)
        return
      }
    }

    dispatch({
      type: "CAST_VOTE",
      payload: {
        actorId: currentActor.id,
        characterId: currentCharacter.id,
        vote,
        userId: state.currentUser.id,
      },
    })
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
  }

  const navigateHeadshot = (direction: number) => {
    if (!currentActor?.headshots) return

    const headshots = currentActor.headshots
    if (headshots.length <= 1) return

    let newIndex = currentHeadshotIndex + direction
    if (newIndex < 0) newIndex = headshots.length - 1
    if (newIndex >= headshots.length) newIndex = 0

    setCurrentHeadshotIndex(newIndex)
  }

  const getCurrentImageUrl = () => {
    if (!currentActor?.headshots || currentActor.headshots.length === 0) {
      return `/placeholder.svg?height=400&width=300&text=${encodeURIComponent(currentActor?.name?.charAt(0) || "?")}`
    }

    const headshot = currentActor.headshots[currentHeadshotIndex]
    if (!headshot) {
      return `/placeholder.svg?height=400&width=300&text=${encodeURIComponent(currentActor?.name?.charAt(0) || "?")}`
    }

    return headshot
  }

  // Calculate vote statistics
  const getVoteStats = () => {
    if (!currentActor) return { totalUsers: 0, votedUsers: 0, yesVotes: 0, noVotes: 0, maybeVotes: 0 }

    const totalUsers = state.users.length
    const votes = currentActor.userVotes || {}
    const votedUsers = Object.keys(votes).length

    const yesVotes = Object.values(votes).filter((v) => v === "yes").length
    const noVotes = Object.values(votes).filter((v) => v === "no").length
    const maybeVotes = Object.values(votes).filter((v) => v === "maybe").length

    return { totalUsers, votedUsers, yesVotes, noVotes, maybeVotes }
  }

  const voteStats = getVoteStats()
  const currentUserVote = state.currentUser && currentActor ? currentActor.userVotes[state.currentUser.id] : null

  if (!state.currentFocus.playerView.isOpen || !currentActor || !currentCharacter) {
    return null
  }

  const isCast = currentActor.isCast || false
  const isOnApprovalList = currentActor.currentListKey === "approval"

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden">
          {/* Left Panel - Actor Image */}
          <div className="w-1/2 bg-gray-100 relative flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrevious}
              disabled={state.currentFocus.playerView.currentIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              disabled={state.currentFocus.playerView.currentIndex === currentList.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-3 hover:bg-opacity-70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Actor Image */}
            <div className="relative max-w-full max-h-full">
              <img
                src={getCurrentImageUrl() || "/placeholder.svg"}
                alt={currentActor.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />

              {/* Headshot Navigation */}
              {currentActor.headshots && currentActor.headshots.length > 1 && (
                <>
                  <button
                    onClick={() => navigateHeadshot(-1)}
                    disabled={currentHeadshotIndex === 0}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigateHeadshot(1)}
                    disabled={currentHeadshotIndex >= currentActor.headshots.length - 1}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-lg">
                    {currentHeadshotIndex + 1}/{currentActor.headshots.length}
                  </div>
                </>
              )}

              {/* Cast/Greenlit Badge (no photo tint) */}
              {isCast && (
                <div className="absolute top-4 left-4 pointer-events-none z-10">
                  <div className="bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-full flex items-center space-x-2 shadow-md border border-slate-200">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold tracking-wide">CAST</span>
                  </div>
                </div>
              )}

              {!isCast && currentActor.isGreenlit && (
                <div className="absolute top-4 left-4 pointer-events-none z-10">
                  <div className="bg-white/90 backdrop-blur-sm text-slate-800 px-4 py-2 rounded-full flex items-center space-x-2 shadow-md border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold tracking-wide">GREENLIT</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actor Counter */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-lg">
              {state.currentFocus.playerView.currentIndex + 1} of {currentList.length}
            </div>

            {/* Keyboard Navigation Hint */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-lg">
              Use ← → keys to navigate
            </div>
          </div>

          {/* Right Panel - Actor Details and Notes */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentActor.name}</h1>
                  {isCast && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Crown className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm text-emerald-600 font-semibold">Cast as {currentCharacter.name}</span>
                    </div>
                  )}
                  <div className="space-y-1 text-sm text-gray-600">
                    {currentActor.age && (
                      <p>
                        <span className="font-medium">Age:</span> {currentActor.age}
                      </p>
                    )}
                    {currentActor.playingAge && (
                      <p>
                        <span className="font-medium">Playing Age:</span> {currentActor.playingAge}
                      </p>
                    )}
                    {currentActor.location && (
                      <p>
                        <span className="font-medium">Location:</span> {currentActor.location}
                      </p>
                    )}
                    {currentActor.agent && (
                      <p>
                        <span className="font-medium">Agent:</span> {currentActor.agent}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote Statistics */}
                <div className="text-right">
                  <div className="flex space-x-2 mb-2">
                    {state.users.map((user) => {
                      const userVote = currentActor.userVotes[user.id]
                      let bgGradient = "bg-slate-200"
                      let textColor = "text-slate-500"

                      if (userVote === "yes") {
                        bgGradient = "bg-[#b5c9a8]"
                        textColor = "text-[#4a5b3f]"
                      } else if (userVote === "no") {
                        bgGradient = "bg-[#e8b4b8]"
                        textColor = "text-[#8b4c4f]"
                      } else if (userVote === "maybe") {
                        bgGradient = "bg-[#f0d9b5]"
                        textColor = "text-[#7a6a3a]"
                      }

                      return (
                        <div
                          key={user.id}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${bgGradient} ${textColor} shadow-sm`}
                          title={user.name}
                        >
                          {user.initials}
                        </div>
                      )
                    })}
                  </div>
                  <span className="text-sm text-slate-500 font-medium">
                    {voteStats.votedUsers}/{voteStats.totalUsers} voted
                  </span>
                </div>
              </div>

              {/* Special message for Approval list */}
              {isOnApprovalList && voteStats.yesVotes === voteStats.totalUsers && voteStats.totalUsers > 0 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-semibold">
                      🎉 Unanimous approval! This actor is now cast in the role.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons - Hide for cast actors */}
              {!isCast && state.currentUser && (
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <button
                    onClick={() => handleVote("yes")}
                    className={`px-4 py-3 text-sm font-semibold rounded-full text-center transition-all duration-200 ${
                      currentUserVote === "yes"
                        ? "bg-[#b5c9a8] text-[#4a5b3f] ring-2 ring-[#8fa67e]"
                        : "bg-[#d5dece] text-[#6b7a5e] hover:bg-[#c8d4bf]"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleVote("maybe")}
                    className={`px-4 py-3 text-sm font-semibold rounded-full text-center transition-all duration-200 ${
                      currentUserVote === "maybe"
                        ? "bg-[#f0d9b5] text-[#7a6a3a] ring-2 ring-[#d4b88a]"
                        : "bg-[#f5e6d0] text-[#9b8a5e] hover:bg-[#eddbbd]"
                    }`}
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => handleVote("no")}
                    className={`px-4 py-3 text-sm font-semibold rounded-full text-center transition-all duration-200 ${
                      currentUserVote === "no"
                        ? "bg-[#e8b4b8] text-[#8b4c4f] ring-2 ring-[#d49396]"
                        : "bg-[#f0cdd0] text-[#a06b6e] hover:bg-[#e8bfc3]"
                    }`}
                  >
                    No
                  </button>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="flex-1 overflow-hidden">
              <PlayerViewNotes actor={currentActor} characterId={currentCharacter.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Maybe Note Prompt Modal */}
      {showMaybeNotePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center">
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
    </>
  )
}
