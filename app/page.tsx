"use client"

import { useState, useEffect } from "react"
import LoginScreen from "@/components/auth/LoginScreen"

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)

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

  return <LoginScreen />
}
