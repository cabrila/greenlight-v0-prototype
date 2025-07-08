"use client"

import type React from "react"

import { useCasting } from "@/components/casting/CastingContext"
import {
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Settings,
  Eye,
  Layout,
  Database,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import { useState, useEffect, useRef } from "react"
import { mockData } from "@/lib/mockData"

export default function Sidebar() {
  const { state, dispatch } = useCasting()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)

  const [collapsedSections, setCollapsedSections] = useState<{
    currentUser: boolean
    cardDisplay: boolean
    dataTools: boolean
  }>({
    currentUser: true,
    cardDisplay: true,
    dataTools: true,
  })

  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    x: number
    y: number
    userId: string | null
  }>({
    isVisible: false,
    x: 0,
    y: 0,
    userId: null,
  })

  const contextMenuRef = useRef<{
    isVisible: boolean
    x: number
    y: number
    userId: string | null
  }>({
    isVisible: false,
    x: 0,
    y: 0,
    userId: null,
  })

  const handleClickOutsideRef = useRef<(e: MouseEvent) => void>(() => {})

  const handleCloseContextMenu = () => {
    setContextMenu({
      isVisible: false,
      x: 0,
      y: 0,
      userId: null,
    })
    contextMenuRef.current = {
      isVisible: false,
      x: 0,
      y: 0,
      userId: null,
    }
  }

  useEffect(() => {
    handleClickOutsideRef.current = (e: MouseEvent) => {
      if (contextMenuRef.current.isVisible) {
        handleCloseContextMenu()
      }
    }

    document.addEventListener("click", handleClickOutsideRef.current)

    return () => {
      document.removeEventListener("click", handleClickOutsideRef.current)
    }
  }, [])

  // Load collapsed sections state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed-sections")
    if (savedState) {
      try {
        setCollapsedSections(JSON.parse(savedState))
      } catch (error) {
        console.error("Error loading collapsed sections state:", error)
      }
    }
  }, [])

  // Save collapsed sections state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed-sections", JSON.stringify(collapsedSections))
  }, [collapsedSections])

  if (!state) {
    return <div className="w-72 bg-white shadow-lg hidden md:flex">Loading...</div>
  }

  const handleUserChange = (userId: string) => {
    const user = state.users.find((u) => u.id === userId)
    if (user) {
      dispatch({ type: "SET_CURRENT_USER", payload: user })
    }
  }

  const handleCardSettingChange = (field: string, value: boolean) => {
    dispatch({
      type: "UPDATE_CARD_SETTINGS",
      payload: { field, value },
    })
  }

  const handleOpenPlayerView = () => {
    dispatch({ type: "OPEN_PLAYER_VIEW" })
  }

  const handleOpenCanvas = () => {
    openModal("canvas")
  }

  const handleClearCache = () => {
    // Set flag to show splash screen after cache clear
    if (typeof window !== "undefined") {
      localStorage.setItem("greenlight-cache-cleared", "true")
    }
    openModal("clearCache")
  }

  const handleLoadDemoData = async () => {
    setIsLoadingDemo(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      dispatch({ type: "LOAD_DEMO_DATA", payload: mockData })
      console.log("Demo data loaded successfully")
    } catch (error) {
      console.error("Error loading demo data:", error)
    } finally {
      setIsLoadingDemo(false)
    }
  }

  const handleOpenHelpWizard = () => {
    openModal("helpWizard")
  }

  const handleOpenSplashScreen = () => {
    openModal("splashScreen")
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleRightClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault()
    setContextMenu({
      isVisible: true,
      x: e.clientX,
      y: e.clientY,
      userId,
    })
    contextMenuRef.current = {
      isVisible: true,
      x: e.clientX,
      y: e.clientY,
      userId,
    }
  }

  const handleRenameUser = () => {
    if (!contextMenu.userId) return

    const user = state.users.find((u) => u.id === contextMenu.userId)
    if (!user) return

    const newName = prompt(`Rename user "${user.name}":`, user.name)
    if (newName && newName.trim() && newName.trim() !== user.name) {
      const nameParts = newName.trim().split(" ")
      const newInitials =
        nameParts.length >= 2
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : newName.trim().substring(0, 2).toUpperCase()

      dispatch({
        type: "UPDATE_USER",
        payload: {
          userId: contextMenu.userId,
          updates: {
            name: newName.trim(),
            initials: newInitials,
          },
        },
      })
    }
    handleCloseContextMenu()
  }

  const toggleSection = (section: "currentUser" | "cardDisplay" | "dataTools") => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div
      className={`bg-gradient-to-b from-white via-slate-50 to-white shadow-[4px_0px_8px_-1px_rgba(0,0,0,0.05)] hidden md:flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out border-r border-slate-200/60 z-10 ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-4 border-b border-slate-200/60">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 group"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quick Actions Section */}
        <div className="p-4 space-y-3">
          <button
            onClick={handleOpenPlayerView}
            className={`w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium ${
              isCollapsed ? "px-3" : ""
            }`}
            title={isCollapsed ? "Open Player View" : ""}
          >
            <Play size={18} />
            {!isCollapsed && <span>Player View</span>}
          </button>

          <button
            onClick={handleOpenCanvas}
            className={`w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium ${
              isCollapsed ? "px-3" : ""
            }`}
            title={isCollapsed ? "Open Canvas" : ""}
          >
            <Layout size={18} />
            {!isCollapsed && <span>Canvas View</span>}
          </button>
        </div>

        {/* Current User Section */}
        <div className="border-t border-slate-200/60 p-4">
          <div className={`flex items-center mb-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => isCollapsed && setIsCollapsed(false)}
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-200 cursor-pointer"
                title={isCollapsed ? "Expand to view current user options" : ""}
              >
                <User className="w-4 h-4 text-white" />
              </button>
              {!isCollapsed && (
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Current User</h2>
                  <p className="text-xs text-slate-500">Active team member</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => toggleSection("currentUser")}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title={collapsedSections.currentUser ? "Expand section" : "Collapse section"}
              >
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    collapsedSections.currentUser ? "" : "rotate-90"
                  }`}
                />
              </button>
            )}
          </div>

          {isCollapsed ? (
            <div className="flex justify-center">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white"
                style={{
                  background: `linear-gradient(135deg, ${state.currentUser?.bgColor}, ${state.currentUser?.bgColor}dd)`,
                  color: state.currentUser?.color,
                }}
                title={state.currentUser?.name || "No user selected"}
              >
                {state.currentUser?.initials || "?"}
              </div>
            </div>
          ) : (
            !isCollapsed &&
            !collapsedSections.currentUser && (
              <div className="space-y-2">
                {state.users.map((user) => (
                  <div key={user.id} onContextMenu={(e) => handleRightClick(e, user.id)}>
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="currentUser"
                        value={user.id}
                        checked={state.currentUser?.id === user.id}
                        onChange={() => handleUserChange(user.id)}
                        className="form-radio h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${user.bgColor}, ${user.bgColor}dd)`,
                          color: user.color,
                        }}
                      >
                        {user.initials}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{user.name}</span>
                    </label>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Card View Settings Section */}
        <div className="border-t border-slate-200/60 p-4">
          <div className={`flex items-center mb-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => isCollapsed && setIsCollapsed(false)}
                className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 cursor-pointer"
                title={isCollapsed ? "Expand to customize card view" : ""}
              >
                <Eye className="w-4 h-4 text-white" />
              </button>
              {!isCollapsed && (
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Card Display</h2>
                  <p className="text-xs text-slate-500">Customize view options</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => toggleSection("cardDisplay")}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title={collapsedSections.cardDisplay ? "Expand section" : "Collapse section"}
              >
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    collapsedSections.cardDisplay ? "" : "rotate-90"
                  }`}
                />
              </button>
            )}
          </div>

          {isCollapsed ? (
            <div className="flex justify-center">{/* Palette button removed */}</div>
          ) : (
            !collapsedSections.cardDisplay && (
              <div className="space-y-2">
                {Object.entries(state.cardViewSettings || {}).map(([field, value]) => {
                  if (["showProgress", "showTags", "showReels", "auditionTapes"].includes(field)) {
                    return null
                  }
                  return (
                    <div key={field}>
                      <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleCardSettingChange(field, e.target.checked)}
                          className="form-checkbox h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700 capitalize">
                          {field === "imdb"
                            ? "IMDB"
                            : field === "imdbUrl"
                              ? "IMDB"
                              : field === "mediaAndNotes"
                                ? "Media & Notes"
                                : field.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>

        {/* Data Management Section */}
        <div className="border-t border-slate-200/60 p-4">
          <div className={`flex items-center mb-4 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => isCollapsed && setIsCollapsed(false)}
                className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer"
                title={isCollapsed ? "Expand to access data tools" : ""}
              >
                <Settings className="w-4 h-4 text-white" />
              </button>
              {!isCollapsed && (
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Data Tools</h2>
                  <p className="text-xs text-slate-500">Manage application data</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => toggleSection("dataTools")}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title={collapsedSections.dataTools ? "Expand section" : "Collapse section"}
              >
                <ChevronRight
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    collapsedSections.dataTools ? "" : "rotate-90"
                  }`}
                />
              </button>
            )}
          </div>

          {isCollapsed ? (
            <div className="flex justify-center">
              <div></div>
            </div>
          ) : (
            !collapsedSections.dataTools && (
              <div className="space-y-2">
                {/* Clear Cache Button */}
                <button
                  onClick={handleClearCache}
                  className="flex items-center space-x-3 w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all duration-200 font-medium"
                  title="Clear all cached data and reset application"
                >
                  <Trash2 size={16} />
                  <span>Clear Cache</span>
                </button>

                {/* Load Demo Data Button */}
                <button
                  onClick={handleLoadDemoData}
                  disabled={isLoadingDemo}
                  className="flex items-center space-x-3 w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  title="Load demo data and reset to initial state"
                >
                  {isLoadingDemo ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Database size={16} />
                  )}
                  <span>{isLoadingDemo ? "Loading..." : "Load Demo Data"}</span>
                </button>

                {/* Splash Screen Button */}
                <button
                  onClick={handleOpenSplashScreen}
                  className="flex items-center space-x-3 w-full text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all duration-200 font-medium"
                  title="Open splash screen"
                >
                  <Sparkles size={16} />
                  <span>Splash Screen</span>
                </button>

                {/* Help Button */}
                <button
                  onClick={handleOpenHelpWizard}
                  className="flex items-center space-x-3 w-full text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-xl transition-all duration-200 font-medium"
                  title="Open help wizard"
                >
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.isVisible && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 min-w-[140px] backdrop-blur-md"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleRenameUser}
            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-3 transition-colors rounded-xl"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Rename User</span>
          </button>
        </div>
      )}
    </div>
  )
}
