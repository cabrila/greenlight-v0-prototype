"use client"

import { useState, useEffect } from "react"
import { CastingProvider, useCasting } from "@/components/casting/CastingContext"
import { ActorGridProvider } from "@/components/actors/ActorGridContext"
import ModalManager from "@/components/modals/ModalManager"
import PlayerViewModal from "@/components/modals/PlayerViewModal"
import { UploadNotificationProvider } from "@/hooks/useUploadNotifications"
import { useSubmissionIntegration } from "@/hooks/useSubmissionIntegration"
import { mockData } from "@/lib/mockData"
import GoGreenlightCoPilot from "@/components/copilot/GoGreenlightCoPilot"
import SplashScreen from "@/components/home/SplashScreen"

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

  // Initialize submission integration
  useSubmissionIntegration()

  // One-time placeholder sanitization on first visit
  useEffect(() => {
    const PLACEHOLDER_SANITIZED_KEY = "gogreenlight-placeholder-sanitized-v7"

    if (typeof window !== "undefined") {
      if (!window.localStorage.getItem(PLACEHOLDER_SANITIZED_KEY)) {
        try {
          localStorage.clear()
          window.localStorage.setItem(PLACEHOLDER_SANITIZED_KEY, "true")
        } catch {
          /* ignore errors */
        }
      }
    }
  }, [])

  return (
    <div className="h-screen overflow-hidden antialiased text-gray-800 text-sm">
      {/* Main Content - Splash Screen as Home */}
      <SplashScreen />

      {/* Modal Manager handles all modals including CastingModal */}
      <ModalManager />

      {/* Player View Modal */}
      {state.currentFocus.playerView.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PlayerViewModal onClose={() => dispatch({ type: "CLOSE_PLAYER_VIEW" })} />
        </div>
      )}

      {/* GoGreenlight CoPilot - Always visible */}
      <GoGreenlightCoPilot />
    </div>
  )
}
