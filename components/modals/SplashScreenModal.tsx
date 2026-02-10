"use client"
import { X, Plus, FolderOpen, Database, Bell, Settings, HelpCircle, Clapperboard, Users, Film, BarChart3, ArrowRight, Sparkles, Calendar, Search } from 'lucide-react'
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
    },
    {
      value: "busy",
      label: "Busy",
      color: "bg-red-500",
      description: "In a meeting or focused work",
    },
    {
      value: "away",
      label: "Away",
      color: "bg-yellow-500",
      description: "Temporarily unavailable",
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
    const handleInitialsChangeEvt = () => {
      if (!state.currentUser) return
      setTempInitials(state.currentUser.initials)
      setShowInitialsEditor(true)
    }

    window.addEventListener("userStatusChange", handleStatusChange as EventListener)
    window.addEventListener("changeInitials", handleInitialsChangeEvt)

    return () => {
      window.removeEventListener("userStatusChange", handleStatusChange as EventListener)
      window.removeEventListener("changeInitials", handleInitialsChangeEvt)
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

  // Compute stats
  const unreadNotifications = state.notifications.filter((n) => !n.read).length
  const projectCount = state.projects.length
  const totalActors = state.projects.reduce((sum, p) => {
    return sum + p.characters.reduce((cSum, c) => {
      return cSum + (c.longList?.length || 0) + (c.auditionList?.length || 0) + (c.approvalList?.length || 0)
    }, 0)
  }, 0)
  const totalCharacters = state.projects.reduce((sum, p) => sum + p.characters.length, 0)

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col z-50 overflow-y-auto">
      {/* Timer indicator */}
      {isTimerActive && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-emerald-500 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/25">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading project...
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-20">
        {/* Left side - Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-wider hidden sm:block">GOGREENLIGHT</span>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-2">
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={handleNotifications}
              className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>
            {unreadNotifications > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">{unreadNotifications}</span>
              </div>
            )}
          </div>

          {/* Settings Icon */}
          <button
            onClick={handleSettings}
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Help */}
          <button
            onClick={() => openModal("helpWizard")}
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-700 mx-1" />

          {/* User Avatar */}
          <div className="relative" ref={userButtonRef}>
            <button
              onClick={handleUserMenu}
              className="relative p-1 rounded-lg hover:bg-gray-800 transition-all duration-200 group"
              title={`${state.currentUser?.name} - ${userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}`}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200"
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
                  className={`w-3.5 h-3.5 rounded-full border-2 border-gray-950 transition-all duration-200 ${getStatusColor(userStatus)}`}
                  title={getStatusLabel(userStatus)}
                />
                {userStatus === "available" && (
                  <div className="absolute w-3.5 h-3.5 bg-green-400 rounded-full animate-ping opacity-75" />
                )}
              </div>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 md:mb-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Casting Management Platform
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance leading-tight">
            Welcome to GoGreenlight
          </h1>
          <p className="text-gray-400 text-base md:text-lg leading-relaxed text-pretty">
            Your complete casting workflow -- from script breakdowns to final selections. Manage projects, discover talent, and streamline your entire casting process.
          </p>
        </div>

        {/* Quick Stats Bar */}
        {(projectCount > 0 || totalActors > 0) && (
          <div className="flex items-center gap-6 mb-10 md:mb-14">
            <div className="flex items-center gap-2 text-sm">
              <Film className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-300 font-medium">{projectCount}</span>
              <span className="text-gray-500">{projectCount === 1 ? 'Project' : 'Projects'}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-300 font-medium">{totalCharacters}</span>
              <span className="text-gray-500">{totalCharacters === 1 ? 'Character' : 'Characters'}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-300 font-medium">{totalActors}</span>
              <span className="text-gray-500">{totalActors === 1 ? 'Actor' : 'Actors'}</span>
            </div>
          </div>
        )}

        {/* Action Cards - Primary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-4xl w-full mb-12 md:mb-16">
          {/* New Project */}
          <button
            onClick={handleNewProject}
            disabled={isTimerActive}
            className="group relative overflow-hidden rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-left"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12)_0%,_transparent_60%)]" />
            <div className="relative p-6 md:p-7 flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1.5">New Project</h3>
                <p className="text-emerald-100/70 text-sm leading-relaxed">Start a new casting project for your production</p>
              </div>
            </div>
          </button>

          {/* Open Project */}
          <button
            onClick={handleOpenProject}
            disabled={isTimerActive}
            className="group relative overflow-hidden rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-left"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.05)_0%,_transparent_60%)]" />
            <div className="relative p-6 md:p-7 flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white/10 rounded-xl">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1.5">Open Project</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Browse and manage your existing productions</p>
              </div>
            </div>
          </button>

          {/* Actor Database */}
          <button
            onClick={handleDatabase}
            disabled={isTimerActive}
            className="group relative overflow-hidden rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-left"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.05)_0%,_transparent_60%)]" />
            <div className="relative p-6 md:p-7 flex flex-col gap-5">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1.5">Actor Database</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Search and discover actors across all projects</p>
              </div>
            </div>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-4xl w-full">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-5">What you can do</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Film,
                title: "Script Analysis",
                desc: "Upload scripts and auto-extract character breakdowns"
              },
              {
                icon: Users,
                title: "Casting Lists",
                desc: "Manage Long Lists, Auditions, and Approvals per character"
              },
              {
                icon: Search,
                title: "Actor Search",
                desc: "Filter by gender, age, location, and availability"
              },
              {
                icon: Calendar,
                title: "Scheduling",
                desc: "Coordinate audition sessions and casting calendars"
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-900/50 border border-gray-800/50"
              >
                <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0 mt-0.5">
                  <feature.icon className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-200 mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacer for scrolling */}
        <div className="h-8" />
      </main>

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Change Initials</h3>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-400 mb-2">New Initials (max 2 characters)</label>
              <input
                type="text"
                value={tempInitials}
                onChange={(e) => setTempInitials(e.target.value)}
                maxLength={2}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-lg font-bold uppercase placeholder-gray-500"
                placeholder="AB"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveInitials}
                disabled={!tempInitials.trim()}
                className="flex-1 bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                Save
              </button>
              <button
                onClick={handleCancelInitials}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm border border-gray-600"
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
