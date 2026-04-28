"use client"

import { useState, useRef, useEffect } from "react"
import { LogOut } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"

interface SplashScreenProps {
  onSignOut?: () => void
}

export default function SplashScreen({ onSignOut }: SplashScreenProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userButtonRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { state } = useCasting()

  const handleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

  const handleSignOut = () => {
    setIsUserMenuOpen(false)
    onSignOut?.()
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isUserMenuOpen])

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Top Navigation Bar - Only Logo and User Avatar */}
      <header className="relative flex justify-between items-center px-6 py-3 border-b border-white/10 shrink-0 z-20">
        <div className="flex items-center">
          <img
            src="/images/gogreenlight-logo.png"
            alt="GoGreenlight"
            className="h-9 w-auto"
          />
        </div>
        <div className="relative" ref={userButtonRef}>
          <button
            onClick={handleUserMenu}
            className="relative p-1 rounded-lg hover:bg-white/10 transition-all duration-200"
            title={state.currentUser?.name || "User"}
            aria-label="User menu"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: state.currentUser?.bgColor || "#6B7280",
                color: state.currentUser?.color || "#FFFFFF",
              }}
            >
              {state.currentUser?.initials || "??"}
            </div>
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-2 w-48 bg-[#1a3a25] border border-white/15 rounded-lg shadow-xl overflow-hidden z-50"
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">
                  {state.currentUser?.name || "User"}
                </p>
                <p className="text-xs text-white/50 truncate">
                  {state.currentUser?.email || ""}
                </p>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Centered Hero */}
      <main className="flex-1 flex items-center justify-center relative z-10">
        <div className="text-center px-6 max-w-2xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance leading-tight">
            Every creative asset.{" "}
            <span className="text-emerald-300">One platform.</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg leading-relaxed text-pretty max-w-xl mx-auto">
            GoGreenlight centralizes your entire production workflow -- scripts,
            casting, props, costumes, locations, and design -- so nothing falls
            through the cracks.
          </p>
        </div>
      </main>

      {/* Bottom tagline */}
      <footer className="text-center py-6 shrink-0">
        <p className="text-[11px] text-white/20 tracking-wide">
          GoGreenlight -- All your creative assets, one dashboard, zero silos.
        </p>
      </footer>
    </div>
  )
}
