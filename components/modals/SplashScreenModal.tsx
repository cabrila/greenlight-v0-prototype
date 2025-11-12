"use client"
import { X, Plus, FolderOpen, Database, Bell, Settings, HelpCircle, Clapperboard } from "lucide-react"
import { openModal } from "./ModalManager"
import { useState, useEffect, useRef } from "react"
import UserMenu from "../layout/UserMenu"
import { useCasting } from "@/components/casting/CastingContext"

interface SplashScreenModalProps {
  onClose: () => void
}

export default function SplashScreenModal({ onClose }: SplashScreenModalProps) {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onCloseRef = useRef(onClose)
  const userButtonRef = useRef<HTMLDivElement>(null)
  const { state, dispatch } = useCasting()

  const [userStatus, setUserStatus] = useState<"available" | "busy" | "away">("available")
  const [showInitialsEditor, setShowInitialsEditor] = useState(false)
  const [tempInitials, setTempInitials] = useState("")

  // Status configuration
  const statusOptions = [
    {
      value: "available",
      label: "Available",
      color: "bg-green-500",
      description: "Ready to collaborate",
      icon: "🟢",
    },
    {
      value: "busy",
      label: "Busy",
      color: "bg-red-500",
      description: "In a meeting or focused work",
      icon: "🔴",
    },
    {
      value: "away",
      label: "Away",
      color: "bg-yellow-500",
      description: "Temporarily unavailable",
      icon: "🟡",
    },
  ] as const

  // Helper functions for status
  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.color || "bg-gray-500"
  }

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status)
    return statusOption?.label || "Unknown"
  }

  // Handle initials change
  const handleInitialsChange = () => {
    if (!state.currentUser) return

    setTempInitials(state.currentUser.initials)
    setShowInitialsEditor(true)
  }

  const handleSaveInitials = () => {
    if (!state.currentUser || !tempInitials.trim()) return

    const newInitials = tempInitials.trim().toUpperCase().substring(0, 2)

    dispatch({
      type: "UPDATE_USER",
      payload: {
        userId: state.currentUser.id,
        updates: { initials: newInitials },
      },
    })

    setShowInitialsEditor(false)
    setTempInitials("")
  }

  const handleCancelInitials = () => {
    setShowInitialsEditor(false)
    setTempInitials("")
  }

  // Auto-update status based on activity (simulate activity detection)
  useEffect(() => {
    let activityTimer: NodeJS.Timeout
    let awayTimer: NodeJS.Timeout

    const resetActivityTimer = () => {
      clearTimeout(activityTimer)
      clearTimeout(awayTimer)

      if (userStatus === "away") {
        setUserStatus("available")
      }

      // Set to away after 5 minutes of inactivity
      awayTimer = setTimeout(
        () => {
          if (userStatus !== "busy") {
            setUserStatus("away")
          }
        },
        5 * 60 * 1000,
      ) // 5 minutes
    }

    // Activity listeners
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]

    activityEvents.forEach((event) => {
      document.addEventListener(event, resetActivityTimer, true)
    })

    // Initial timer
    resetActivityTimer()

    return () => {
      clearTimeout(activityTimer)
      clearTimeout(awayTimer)
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetActivityTimer, true)
      })
    }
  }, [userStatus])

  // Update the ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Add after existing useEffect hooks
  useEffect(() => {
    // Listen for status changes from UserMenu
    const handleStatusChange = (event: CustomEvent) => {
      setUserStatus(event.detail.status)
    }

    // Listen for initials change requests from UserMenu
    const handleInitialsChange = () => {
      if (!state.currentUser) return
      setTempInitials(state.currentUser.initials)
      setShowInitialsEditor(true)
    }

    window.addEventListener("userStatusChange", handleStatusChange as EventListener)
    window.addEventListener("changeInitials", handleInitialsChange)

    return () => {
      window.removeEventListener("userStatusChange", handleStatusChange as EventListener)
      window.removeEventListener("changeInitials", handleInitialsChange)
    }
  }, [state.currentUser])

  const startTimer = () => {
    if (isTimerActive) return // Prevent multiple timers

    setIsTimerActive(true)

    timerRef.current = setTimeout(() => {
      // Close splash screen and open project manager
      onCloseRef.current()
      setTimeout(() => {
        openModal("projectManager")
      }, 100) // Small delay to ensure splash screen closes first

      setIsTimerActive(false)
    }, 3000) // 3 seconds
  }

  const handleNewProject = () => {
    startTimer()
  }

  const handleOpenProject = () => {
    startTimer()
  }

  const handleDatabase = () => {
    onClose()
    setTimeout(() => {
      openModal("database")
    }, 100)
  }

  const handleNotifications = () => {
    openModal("notifications")
  }

  const handleSettings = () => {
    openModal("userPermissions")
  }

  const handleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const handleCloseUserMenu = () => {
    setIsUserMenuOpen(false)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const unreadNotifications = state.notifications.filter((n) => !n.read).length

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Timer indicator (optional visual feedback) */}
      {isTimerActive && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium">Loading...</div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-center p-6">
        {/* Left side - Greenlight Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-600 tracking-wide">GREENLIGHT</h1>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center space-x-4">
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={handleNotifications}
              className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
            >
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            {unreadNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-medium">{unreadNotifications}</span>
              </div>
            )}
          </div>

          {/* Settings Icon */}
          <button
            onClick={handleSettings}
            className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Icon - Enhanced Interactive */}
          <div className="relative" ref={userButtonRef}>
            <button
              onClick={handleUserMenu}
              className="relative p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-200 group"
              title={`${state.currentUser?.name} - ${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}`}
            >
              {/* User Avatar with Initials */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: state.currentUser?.bgColor || "#6B7280",
                  color: state.currentUser?.color || "#FFFFFF",
                }}
              >
                {state.currentUser?.initials || "??"}
              </div>

              {/* Status Indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white transition-all duration-200 ${getStatusColor(userStatus)}`}
                  title={getStatusLabel(userStatus)}
                />
                {/* Pulse animation for online status */}
                {userStatus === "available" && (
                  <div className="absolute w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75" />
                )}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            </button>
          </div>

          {/* Close Button */}
          <button onClick={onClose} className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          {/* New Project Card */}
          <button
            onClick={handleNewProject}
            disabled={isTimerActive}
            className="group relative overflow-hidden rounded-3xl aspect-square bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="relative h-full flex flex-col items-center justify-center p-8">
              <div className="mb-4 p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">New Project</h3>
              <div className="text-3xl">🎬</div>
            </div>
          </button>

          {/* Open Project Card */}
          <button
            onClick={handleOpenProject}
            disabled={isTimerActive}
            className="group relative overflow-hidden rounded-3xl aspect-square bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="relative h-full flex flex-col items-center justify-center p-8">
              <div className="mb-4 p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Open Project</h3>
              <div className="text-3xl">📁</div>
            </div>
          </button>

          {/* Database Card */}
          <button
            onClick={handleDatabase}
            disabled={isTimerActive}
            className="group relative overflow-hidden rounded-3xl aspect-square bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="relative h-full flex flex-col items-center justify-center p-8">
              <div className="mb-4 p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Database</h3>
              <div className="text-3xl">💾</div>
            </div>
          </button>
        </div>
      </div>

      {/* Help Button */}
      <div className="absolute bottom-6 left-6">
        <button
          onClick={() => openModal("helpWizard")}
          className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* User Menu */}
      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={handleCloseUserMenu}
        anchorRef={userButtonRef}
        userStatus={userStatus}
        onStatusChange={setUserStatus}
      />

      {/* Initials Editor Modal */}
      {showInitialsEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Change Initials</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Initials (max 2 characters)</label>
              <input
                type="text"
                value={tempInitials}
                onChange={(e) => setTempInitials(e.target.value)}
                maxLength={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-lg font-bold uppercase"
                placeholder="AB"
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSaveInitials}
                disabled={!tempInitials.trim()}
                className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelInitials}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
