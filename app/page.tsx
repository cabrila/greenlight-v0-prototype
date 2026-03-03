"use client"

import { useState, useEffect } from "react"
import { CastingProvider, useCasting } from "@/components/casting/CastingContext"
import { ActorGridProvider } from "@/components/actors/ActorGridContext"
import Sidebar from "@/components/layout/Sidebar"
import MainContent from "@/components/layout/MainContent"
import CharactersSidebar from "@/components/layout/CharactersSidebar"
import ModalManager, { openModal } from "@/components/modals/ModalManager"
import PlayerViewModal from "@/components/modals/PlayerViewModal"
import { UploadNotificationProvider } from "@/hooks/useUploadNotifications"
import { useSubmissionIntegration } from "@/hooks/useSubmissionIntegration"
import { mockData } from "@/lib/mockData"

export default function CastingApp() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <CastingProvider initialData={mockData}>
      <UploadNotificationProvider>
        <ActorGridProvider>
          <CastingAppContent />
        </ActorGridProvider>
      </UploadNotificationProvider>
    </CastingProvider>
  )
}

function CastingAppContent() {
  const { state, dispatch } = useCasting()

  // Initialise submission integration
  useSubmissionIntegration()

  // Show splash screen on first visit only
  useEffect(() => {
    const FIRST_VISIT_KEY = "gogreenlight-first-visit-complete"
    const CACHE_CLEARED_KEY = "gogreenlight-cache-cleared"
    const PLACEHOLDER_SANITIZED_KEY = "gogreenlight-placeholder-sanitized-v7"

    if (typeof window !== "undefined") {
      // One-time full localStorage clear to remove any corrupted image data
      if (!window.localStorage.getItem(PLACEHOLDER_SANITIZED_KEY)) {
        try {
          // Clear ALL localStorage to ensure completely fresh state
          localStorage.clear()
          window.localStorage.setItem(PLACEHOLDER_SANITIZED_KEY, "true")
        } catch { /* ignore errors */ }
      }

      const isFirstVisit = !window.localStorage.getItem(FIRST_VISIT_KEY)
      const wasCacheCleared = window.localStorage.getItem(CACHE_CLEARED_KEY) === "true"

      if (isFirstVisit || wasCacheCleared) {
        // Mark first visit as complete
        window.localStorage.setItem(FIRST_VISIT_KEY, "true")

        // Clear the cache cleared flag
        if (wasCacheCleared) {
          window.localStorage.removeItem(CACHE_CLEARED_KEY)
        }

        // Small delay so the rest of the UI mounts first
        setTimeout(() => openModal("splashScreen"), 500)
      }
    }
  }, [])

  return (
    <div className="flex h-screen antialiased text-gray-800 text-sm bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MainContent />
      </div>
      <CharactersSidebar />

      <ModalManager />

      {/* Player View Modal */}
      {state.currentFocus.playerView.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PlayerViewModal onClose={() => dispatch({ type: "CLOSE_PLAYER_VIEW" })} />
        </div>
      )}
    </div>
  )
}
