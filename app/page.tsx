"use client"

import { useState, useEffect } from "react"
import { CastingProvider } from "@/components/casting/CastingContext"
import { ActorGridProvider } from "@/components/actors/ActorGridContext"
import ModalManager from "@/components/modals/ModalManager"
import { UploadNotificationProvider } from "@/hooks/useUploadNotifications"
import { useSubmissionIntegration } from "@/hooks/useSubmissionIntegration"
import { mockData } from "@/lib/mockData"

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

      {/* Modal Manager handles all modals, including every Player View phase
          (config / player / summary), each rendered via its own ModalPortal. */}
      <ModalManager />
    </div>
  )
}
