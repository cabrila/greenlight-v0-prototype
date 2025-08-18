"use client"

import { useState, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import { ChevronLeft, ChevronRight, X, Crown, Star, Heart, MessageSquare } from 'lucide-react'
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

              {/* Cast/Greenlit Overlay */}
              {isCast && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-emerald-800 text-2xl font-bold rounded-lg pointer-events-none">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg">
                    <Crown className="w-6 h-6" />
                    <span>CAST</span>
                  </div>
                </div>
              )}

              {!isCast && currentActor.isGreenlit && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 flex items-center justify-center text-white text-2xl font-bold rounded-lg pointer-events-none">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-xl shadow-lg">
                    GREENLIT
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
                      let bgGradient = "bg-gradient-to-br from-slate-200 to-slate-300"
                      let textColor = "text-slate-600"

                      if (userVote === "yes") {
                        bgGradient = "bg-gradient-to-br from-green-500 to-green-600"
                        textColor = "text-white"
                      } else if (userVote === "no") {
                        bgGradient = "bg-gradient-to-br from-red-500 to-red-600"
                        textColor = "text-white"
                      } else if (userVote === "maybe") {
                        bgGradient = "bg-gradient-to-br from-blue-500 to-blue-600"
                        textColor = "text-white"
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
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                      currentUserVote === "yes"
                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-700"
                        : "bg-gradient-to-r from-green-100 to-green-200 text-green-700 border-green-300 hover:from-green-200 hover:to-green-300"
                    }`}
                  >
                    <Heart className="w-4 h-4 mx-auto mb-1" />
                    Yes
                  </button>
                  <button
                    onClick={() => handleVote("no")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                      currentUserVote === "no"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-700"
                        : "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 hover:from-red-200 hover:to-red-300"
                    }`}
                  >
                    <X className="w-4 h-4 mx-auto mb-1" />
                    No
                  </button>
                  <button
                    onClick={() => handleVote("maybe")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-xl border-2 text-center transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${
                      currentUserVote === "maybe"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-700"
                        : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300 hover:from-blue-200 hover:to-blue-300"
                    }`}
                  >
                    <Star className="w-4 h-4 mx-auto mb-1" />
                    Maybe
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
