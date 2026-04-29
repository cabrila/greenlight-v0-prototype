"use client"

import { useState, useEffect } from "react"
import { User } from "firebase/auth"
import { subscribeToAuthStateChanges, isMagicLinkCallback, completeMagicLinkSignIn } from "@/lib/auth"
import LoginScreen from "@/components/auth/LoginScreen"
import SplashScreen from "@/components/home/SplashScreen"
import CharacterBibleScreen from "@/components/character-bible/CharacterBibleScreen"
import LocationScoutingScreen from "@/components/location-scouting/LocationScoutingScreen"
import { CastingProvider } from "@/components/casting/CastingContext"

export default function App() {
  const [view, setView] = useState<"login" | "splash" | "character-bible" | "location-overview">("login")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fallback timeout - if auth doesn't respond within 3 seconds, show login
    const fallbackTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("[v0] Auth timeout - showing login screen")
        setIsLoading(false)
        setView("login")
      }
    }, 3000)

    // Check if this is a magic link callback
    if (typeof window !== "undefined" && isMagicLinkCallback()) {
      console.log("[v0] Magic link detected in URL")
      completeMagicLinkSignIn()
        .then(() => {
          console.log("[v0] Magic link sign-in successful")
          // The auth state change will be picked up by the subscription below
        })
        .catch((err) => {
          console.error("[v0] Magic link completion error:", err)
          setError(err instanceof Error ? err.message : "Failed to verify magic link")
        })
    }

    // Subscribe to authentication state changes
    const unsubscribe = subscribeToAuthStateChanges((authUser) => {
      console.log("[v0] Auth state changed:", authUser?.email)
      clearTimeout(fallbackTimeout)
      setUser(authUser)
      
      if (authUser) {
        setView("splash")
      } else {
        setView("login")
      }
      
      setIsLoading(false)
    })

    return () => {
      clearTimeout(fallbackTimeout)
      unsubscribe()
    }
  }, [])

  const handleSignOut = () => {
    setView("login")
  }

  const handleDemoAccess = () => {
    setView("splash")
  }

  const handleNavigate = (feature: string) => {
    if (feature === "character-bible") {
      setView("character-bible")
    } else if (feature === "location-overview") {
      setView("location-overview")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#2d6b3f] via-[#1a4a2a] to-[#061a10]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-sans">Verifying your session...</p>
        </div>
      </div>
    )
  }

  const renderView = () => {
    console.log("[v0] renderView called, current view:", view)
    switch (view) {
      case "login":
        console.log("[v0] Rendering LoginScreen")
        return <LoginScreen onDemoAccess={handleDemoAccess} />
      case "splash":
        console.log("[v0] Rendering SplashScreen")
        return (
          <CastingProvider>
            <SplashScreen onSignOut={handleSignOut} onNavigate={handleNavigate} />
          </CastingProvider>
        )
      case "character-bible":
        console.log("[v0] Rendering CharacterBibleScreen")
        return <CharacterBibleScreen onBack={() => setView("splash")} />
      case "location-overview":
        console.log("[v0] Rendering LocationScoutingScreen")
        return <LocationScoutingScreen onBack={() => setView("splash")} />
      default:
        console.log("[v0] Rendering default LoginScreen")
        return <LoginScreen onDemoAccess={handleDemoAccess} />
    }
  }

  return (
    <div className="h-screen">
      {renderView()}
      
      {error && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300 font-sans">{error}</p>
        </div>
      )}
    </div>
  )
}
