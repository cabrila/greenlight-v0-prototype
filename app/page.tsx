"use client"

import { useState, useEffect } from "react"
import LoginScreen from "@/components/auth/LoginScreen"
import SplashScreen from "@/components/home/SplashScreen"
import { CastingProvider } from "@/components/casting/CastingContext"

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [view, setView] = useState<"login" | "splash">("login")

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a2618]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b8e986]" />
      </div>
    )
  }

  if (view === "splash") {
    return (
      <CastingProvider>
        <div className="h-screen">
          <SplashScreen onSignOut={() => setView("login")} />
        </div>
      </CastingProvider>
    )
  }

  return <LoginScreen onDemoAccess={() => setView("splash")} />
}
