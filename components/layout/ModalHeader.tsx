"use client"

import { Home, X, Bell } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal } from "@/components/modals/ModalManager"

interface ModalHeaderProps {
  title: string
  titleColor?: string
  onClose: () => void
  onHome?: () => void
  showProjectName?: boolean
  children?: React.ReactNode
}

export default function ModalHeader({
  title,
  titleColor = "bg-teal-600",
  onClose,
  onHome,
  showProjectName = true,
  children,
}: ModalHeaderProps) {
  const { state } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const unreadNotifications = state.notifications.filter((n) => !n.read).length

  const handleHome = () => {
    if (onHome) {
      onHome()
    } else {
      onClose()
      setTimeout(() => openModal("splashScreen"), 150)
    }
  }

  const handleNotifications = () => {
    openModal("notifications")
  }

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-4">
        <img
          src="/images/gogreenlight-logo.png"
          alt="GoGreenlight"
          className="h-8 w-auto"
        />
        <button
          onClick={handleHome}
          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Home"
          aria-label="Go to Home"
        >
          <Home className="w-4 h-4" />
        </button>
        <div
          className={`inline-flex items-center ${titleColor} text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded`}
        >
          {title}
        </div>
        {showProjectName && (
          currentProject ? (
            <span className="hidden sm:inline text-sm text-gray-500">
              {currentProject.name}
            </span>
          ) : (
            <span className="hidden sm:inline text-sm text-amber-600 font-medium">
              No project selected
            </span>
          )
        )}
        {children}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleNotifications}
          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Notifications"
          aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ""}`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-sm">
              {unreadNotifications}
            </div>
          )}
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
