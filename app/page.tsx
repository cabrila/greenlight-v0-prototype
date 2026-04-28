"use client"

import { useState, useEffect } from "react"
import { CastingProvider } from "@/components/casting/CastingContext"
import { mockData } from "@/lib/mockData"
import SplashScreen from "@/components/home/SplashScreen"

export default function CastingApp() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a2618]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <CastingProvider initialData={mockData}>
      <div className="h-screen overflow-hidden antialiased text-gray-800 text-sm">
        <SplashScreen />
      </div>
    </CastingProvider>
  )
}
