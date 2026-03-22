"use client"

import { useState, useRef, useEffect } from "react"
import {
  X,
  Folder,
  ScrollText,
  UserCircle,
  Sparkles,
  FileText,
  Users,
  Package,
  Scissors,
  MapPin,
  Paintbrush,
  Calendar,
  Tv,
  Settings,
  ChevronDown,
  Database,
  HelpCircle,
  Trash2,
  Film,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { openModal, closeModal } from "@/components/modals/ModalManager"
import UserMenu from "./UserMenu"

interface FloatingSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentModal?: string
}

export default function FloatingSidebar({ isOpen, onClose, currentModal }: FloatingSidebarProps) {
  const { state, dispatch } = useCasting()
  const [castingToolsOpen, setCastingToolsOpen] = useState(false)
  const [dataToolsOpen, setDataToolsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const userAvatarRef = useRef<HTMLDivElement>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  const handleNavigation = (modalName: string) => {
    onClose()
    if (currentModal) {
      closeModal(currentModal)
    }
    setTimeout(() => openModal(modalName), 150)
  }

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true)
    try {
      const { mockData } = await import("@/lib/mockData")
      await new Promise((resolve) => setTimeout(resolve, 500))
      dispatch({ type: "LOAD_DEMO_DATA", payload: mockData })
    } catch (error) {
      console.error("Error loading demo data:", error)
    } finally {
      setIsLoadingDemo(false)
    }
  }

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gogreenlight-cache-cleared", "true")
    }
    onClose()
    openModal("clearCache")
  }

  const handleOpenHelpWizard = () => {
    onClose()
    openModal("helpWizard")
  }

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[65] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-white via-slate-50 to-white shadow-2xl z-[70] flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/60">
          <img src="/images/gogreenlight-logo.png" alt="GoGreenlight" className="h-9 w-auto" />
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Project Selector */}
          <button
            onClick={() => handleNavigation("projectManager")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Folder className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Project: {currentProject?.name || "N/A"}</span>
          </button>

          {/* Casting */}
          <button
            onClick={() => handleNavigation("casting")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Film className="w-4 h-4" />
            <span>Casting</span>
          </button>

          {/* Script */}
          <button
            onClick={() => handleNavigation("script")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-amber-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <ScrollText className="w-4 h-4" />
            <span>Script</span>
          </button>

          {/* Characters */}
          <button
            onClick={() => handleNavigation("characters")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <UserCircle className="w-4 h-4" />
            <span>Characters</span>
          </button>

          {/* Casting Tools Accordion */}
          <div className="rounded-xl border border-slate-200/50 bg-white/60 overflow-hidden">
            <button
              onClick={() => setCastingToolsOpen(!castingToolsOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white transition-all duration-200"
            >
              <span className="flex items-center space-x-3">
                <Sparkles className="w-4 h-4" />
                <span>Casting Tools</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  castingToolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                castingToolsOpen ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="px-2 pb-2 space-y-1">
                <button
                  onClick={() => handleNavigation("castingBreakdown")}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Casting Breakdown</span>
                </button>
                <button
                  onClick={() => handleNavigation("teamSuggestions")}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Team Suggestions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Props */}
          <button
            onClick={() => handleNavigation("props")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-amber-700 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Package className="w-4 h-4" />
            <span>Props</span>
          </button>

          {/* Costumes & Makeup */}
          <button
            onClick={() => handleNavigation("costumes")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-pink-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Scissors className="w-4 h-4" />
            <span>Costumes & Makeup</span>
          </button>

          {/* Locations */}
          <button
            onClick={() => handleNavigation("locations")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-teal-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <MapPin className="w-4 h-4" />
            <span>Locations</span>
          </button>

          {/* Production Design */}
          <button
            onClick={() => handleNavigation("productionDesign")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Paintbrush className="w-4 h-4" />
            <span>Production Design</span>
          </button>

          {/* Schedule */}
          <button
            onClick={() => handleNavigation("schedule")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-indigo-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </button>

          {/* Casting for TV */}
          <button
            onClick={() => handleNavigation("castingForTV")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-cyan-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Tv className="w-4 h-4" />
            <span>Casting for TV</span>
          </button>

          {/* Permissions */}
          <button
            onClick={() => handleNavigation("userPermissions")}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-orange-600 bg-white/60 hover:bg-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200/50"
          >
            <Settings className="w-4 h-4" />
            <span>Permissions</span>
          </button>

          {/* Data Tools Accordion */}
          <div className="rounded-xl border border-slate-200/50 bg-white/60 overflow-hidden mt-4">
            <button
              onClick={() => setDataToolsOpen(!dataToolsOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white transition-all duration-200"
            >
              <span className="flex items-center space-x-3">
                <Database className="w-4 h-4" />
                <span>Data & Settings</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  dataToolsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                dataToolsOpen ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="px-2 pb-2 space-y-1">
                <button
                  onClick={handleLoadDemoData}
                  disabled={isLoadingDemo}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isLoadingDemo ? "Loading..." : "Load Demo Data"}</span>
                </button>
                <button
                  onClick={handleClearCache}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache</span>
                </button>
                <button
                  onClick={handleOpenHelpWizard}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Help</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - User Avatar */}
        {state.currentUser && (
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center space-x-3">
              <div
                ref={userAvatarRef}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  background: `linear-gradient(135deg, ${state.currentUser.bgColor}, ${state.currentUser.bgColor}dd)`,
                  color: state.currentUser.color,
                }}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                {state.currentUser.initials}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{state.currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{state.currentUser.role || "Team Member"}</p>
              </div>
            </div>
            {isUserMenuOpen && userAvatarRef.current && (
              <UserMenu
                anchorEl={userAvatarRef.current}
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}
