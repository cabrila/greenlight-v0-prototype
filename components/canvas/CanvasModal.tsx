"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Search,
  Users,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Layout,
  Fullscreen,
} from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import CanvasActorCard from "./CanvasActorCard"
import CanvasContextMenu from "./CanvasContextMenu"
import CanvasGroup from "./CanvasGroup"
import CreateGroupModal from "./CreateGroupModal"
import { openModal, closeAllModals } from "../modals/ModalManager"

interface CanvasActor {
  id: string
  actorId: string
  x: number
  y: number
  characterName: string
  actor: any
  groupId?: string
}

interface CanvasGroupProps {
  id: string
  name: string
  color: string
  actorIds: string[]
  x: number
  y: number
  width: number
  height: number
}

interface ContextMenu {
  x: number
  y: number
  actorId: string
  isVisible: boolean
}

interface CanvasModalProps {
  onClose: () => void
}

export default function CanvasModal({ onClose }: CanvasModalProps) {
  const { state } = useCasting()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [canvasActors, setCanvasActors] = useState<CanvasActor[]>([])
  const [canvasGroups, setCanvasGroups] = useState<CanvasGroupProps[]>([])
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    x: 0,
    y: 0,
    actorId: "",
    isVisible: false,
  })
  const [showActorNames, setShowActorNames] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get all actors from current project
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const allActors =
    currentProject?.characters.flatMap((char) => {
      const actors: any[] = []

      // Get actors from all lists
      state.tabDefinitions.forEach((tabDef) => {
        if (tabDef.key === "shortLists") {
          char.actors.shortLists.forEach((sl) => {
            actors.push(...sl.actors.map((actor) => ({ ...actor, sourceCharacter: char.name })))
          })
        } else {
          const listActors = char.actors[tabDef.key] || []
          actors.push(...listActors.map((actor: any) => ({ ...actor, sourceCharacter: char.name })))
        }
      })

      return actors
    }) || []

  // Remove duplicates based on actor ID
  const uniqueActors = allActors.filter((actor, index, self) => index === self.findIndex((a) => a.id === actor.id))

  // Filter actors based on search query
  const filteredActors = uniqueActors.filter(
    (actor) =>
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.sourceCharacter.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Enhanced wheel handler for cursor-centered zooming
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      if (!canvasRef.current) return

      // Get canvas dimensions and position
      const rect = canvasRef.current.getBoundingClientRect()

      // Calculate mouse position relative to the canvas
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate mouse position in canvas coordinates (accounting for current pan and zoom)
      const mouseCanvasX = (mouseX - pan.x) / zoom
      const mouseCanvasY = (mouseY - pan.y) / zoom

      // Determine zoom direction and calculate new zoom level
      // Use adaptive zoom speed based on current zoom level
      const baseZoomSpeed = 0.05
      const adaptiveZoomSpeed = baseZoomSpeed * (zoom < 1 ? 0.5 : zoom > 2 ? 1.5 : 1)

      // Determine if we're zooming in or out
      const isZoomIn = e.deltaY < 0

      // Calculate zoom delta with momentum for smoother zooming
      const zoomDelta = isZoomIn ? adaptiveZoomSpeed : -adaptiveZoomSpeed

      // Calculate new zoom level with limits
      const newZoom = Math.max(0.1, Math.min(5, zoom * (1 + zoomDelta)))

      if (newZoom !== zoom) {
        // Calculate new pan position to keep the mouse point fixed
        // This is the key to cursor-centered zooming
        const newPanX = mouseX - mouseCanvasX * newZoom
        const newPanY = mouseY - mouseCanvasY * newZoom

        // Update state
        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })

        // Set zooming flag for animation control
        setIsZooming(true)

        // Clear any existing timeout
        if (zoomTimeoutRef.current) {
          clearTimeout(zoomTimeoutRef.current)
        }

        // Reset zooming flag after a short delay
        zoomTimeoutRef.current = setTimeout(() => {
          setIsZooming(false)
        }, 150)
      }
    },
    [zoom, pan],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Check if the click is on an actor card, group, or UI element
      const target = e.target as HTMLElement
      const isActorCard = target.closest("[data-actor-card]")
      const isGroup = target.closest("[data-canvas-group]")
      const isUIElement = target.closest("button, input, textarea, select, .ui-element")
      const isNavigationControl = target.closest(".image-navigation")

      // Only start canvas dragging if we're not clicking on interactive elements
      if (!isActorCard && !isGroup && !isUIElement && !isNavigationControl) {
        // Clear selection if clicking on empty canvas
        if (!e.ctrlKey && !e.metaKey) {
          setSelectedActorIds([])
        }
        setIsDragging(true)
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        e.preventDefault()
      }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Programmatic zoom controls
  const handleZoomIn = () => {
    if (!canvasRef.current) return

    // Get canvas center
    const rect = canvasRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate center in canvas coordinates
    const centerCanvasX = (centerX - pan.x) / zoom
    const centerCanvasY = (centerY - pan.y) / zoom

    // Calculate new zoom
    const newZoom = Math.min(5, zoom * 1.2)

    // Calculate new pan to keep center fixed
    const newPanX = centerX - centerCanvasX * newZoom
    const newPanY = centerY - centerCanvasY * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleZoomOut = () => {
    if (!canvasRef.current) return

    // Get canvas center
    const rect = canvasRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate center in canvas coordinates
    const centerCanvasX = (centerX - pan.x) / zoom
    const centerCanvasY = (centerY - pan.y) / zoom

    // Calculate new zoom
    const newZoom = Math.max(0.1, zoom / 1.2)

    // Calculate new pan to keep center fixed
    const newPanX = centerX - centerCanvasX * newZoom
    const newPanY = centerY - centerCanvasY * newZoom

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Zoom to fit all actors with improved calculation
  const handleZoomToFit = () => {
    if (canvasActors.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()

    // Account for sidebar width in available canvas space
    const sidebarWidth = sidebarCollapsed ? 80 : 320
    const availableWidth = window.innerWidth - sidebarWidth
    const availableHeight = canvasRect.height

    // More accurate card dimensions
    const CARD_WIDTH = 280
    const CARD_HEIGHT = 200 // Approximate height based on content
    const PADDING = 100 // Generous padding around the content

    // Calculate precise bounding box of all actors
    const actorBounds = canvasActors.map((actor) => ({
      left: actor.x,
      top: actor.y,
      right: actor.x + CARD_WIDTH,
      bottom: actor.y + CARD_HEIGHT,
    }))

    const minX = Math.min(...actorBounds.map((b) => b.left))
    const minY = Math.min(...actorBounds.map((b) => b.top))
    const maxX = Math.max(...actorBounds.map((b) => b.right))
    const maxY = Math.max(...actorBounds.map((b) => b.bottom))

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Handle edge cases
    if (contentWidth <= 0 || contentHeight <= 0) {
      // Single actor or overlapping actors
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const newZoom = 1
      const newPanX = availableWidth / 2 - centerX * newZoom
      const newPanY = availableHeight / 2 - centerY * newZoom

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
      return
    }

    // Calculate zoom factors for both dimensions with padding
    const zoomX = (availableWidth - PADDING * 2) / contentWidth
    const zoomY = (availableHeight - PADDING * 2) / contentHeight

    // Use the smaller zoom factor to ensure everything fits
    // Also limit maximum zoom to prevent over-zooming
    const newZoom = Math.min(zoomX, zoomY, 2.0)

    // Ensure minimum zoom level for usability
    const finalZoom = Math.max(newZoom, 0.1)

    // Calculate pan to center the content in the available space
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2

    const newPanX = availableWidth / 2 - contentCenterX * finalZoom
    const newPanY = availableHeight / 2 - contentCenterY * finalZoom

    // Apply zoom and pan with smooth transition
    setZoom(finalZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  // Zoom to fit selected actors
  const handleZoomToSelection = () => {
    if (selectedActorIds.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const selectedActors = canvasActors.filter((actor) => selectedActorIds.includes(actor.id))
    if (selectedActors.length === 0) return

    const canvasRect = canvas.getBoundingClientRect()
    const sidebarWidth = sidebarCollapsed ? 80 : 320
    const availableWidth = window.innerWidth - sidebarWidth
    const availableHeight = canvasRect.height

    const CARD_WIDTH = 280
    const CARD_HEIGHT = 200
    const PADDING = 80 // Slightly less padding for selection zoom

    // Calculate bounding box of selected actors
    const actorBounds = selectedActors.map((actor) => ({
      left: actor.x,
      top: actor.y,
      right: actor.x + CARD_WIDTH,
      bottom: actor.y + CARD_HEIGHT,
    }))

    const minX = Math.min(...actorBounds.map((b) => b.left))
    const minY = Math.min(...actorBounds.map((b) => b.top))
    const maxX = Math.max(...actorBounds.map((b) => b.right))
    const maxY = Math.max(...actorBounds.map((b) => b.bottom))

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Handle single actor selection
    if (contentWidth <= 0 || contentHeight <= 0) {
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const newZoom = 1.5 // Zoom in a bit for single actor
      const newPanX = availableWidth / 2 - centerX * newZoom
      const newPanY = availableHeight / 2 - centerY * newZoom

      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
      return
    }

    // Calculate zoom factors
    const zoomX = (availableWidth - PADDING * 2) / contentWidth
    const zoomY = (availableHeight - PADDING * 2) / contentHeight
    const newZoom = Math.min(zoomX, zoomY, 3.0) // Allow higher zoom for selections
    const finalZoom = Math.max(newZoom, 0.2)

    // Center the selection
    const contentCenterX = (minX + maxX) / 2
    const contentCenterY = (minY + maxY) / 2
    const newPanX = availableWidth / 2 - contentCenterX * finalZoom
    const newPanY = availableHeight / 2 - contentCenterY * finalZoom

    setZoom(finalZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const actorId = e.dataTransfer.getData("text/plain")
    const actor = uniqueActors.find((a) => a.id === actorId)

    if (actor && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      const newCanvasActor: CanvasActor = {
        id: `canvas-${Date.now()}-${Math.random()}`,
        actorId: actor.id,
        x,
        y,
        characterName: actor.sourceCharacter || "",
        actor,
      }

      setCanvasActors((prev) => [...prev, newCanvasActor])
    }
  }

  const handleActorSelect = (actorId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedActorIds((prev) => (prev.includes(actorId) ? prev.filter((id) => id !== actorId) : [...prev, actorId]))
    } else {
      setSelectedActorIds([actorId])
    }
  }

  const handleActorDrag = useCallback(
    (canvasActorId: string, deltaX: number, deltaY: number) => {
      // If the dragged actor is selected, move all selected actors
      if (selectedActorIds.includes(canvasActorId)) {
        setCanvasActors((prev) =>
          prev.map((actor) =>
            selectedActorIds.includes(actor.id)
              ? { ...actor, x: actor.x + deltaX / zoom, y: actor.y + deltaY / zoom }
              : actor,
          ),
        )
      } else {
        setCanvasActors((prev) =>
          prev.map((actor) =>
            actor.id === canvasActorId ? { ...actor, x: actor.x + deltaX / zoom, y: actor.y + deltaY / zoom } : actor,
          ),
        )
      }

      // Update groups that contain moved actors
      updateGroupBounds()
    },
    [selectedActorIds, zoom],
  )

  // Handle group dragging
  const handleGroupDrag = useCallback(
    (groupId: string, deltaX: number, deltaY: number) => {
      const group = canvasGroups.find((g) => g.id === groupId)
      if (!group) return

      // Move all actors in the group
      setCanvasActors((prev) =>
        prev.map((actor) =>
          group.actorIds.includes(actor.id)
            ? { ...actor, x: actor.x + deltaX / zoom, y: actor.y + deltaY / zoom }
            : actor,
        ),
      )

      // Update group bounds
      updateGroupBounds()
    },
    [canvasGroups, zoom],
  )

  const handleCharacterNameChange = (canvasActorId: string, newName: string) => {
    setCanvasActors((prev) =>
      prev.map((actor) => (actor.id === canvasActorId ? { ...actor, characterName: newName } : actor)),
    )
  }

  const handleContextMenu = (e: React.MouseEvent, canvasActorId: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      actorId: canvasActorId,
      isVisible: true,
    })
  }

  const handleRemoveActor = (canvasActorId: string) => {
    setCanvasActors((prev) => prev.filter((actor) => actor.id !== canvasActorId))
    setSelectedActorIds((prev) => prev.filter((id) => id !== canvasActorId))
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
    updateGroupBounds()
  }

  const handleDuplicateActor = (canvasActorId: string) => {
    const actorToDuplicate = canvasActors.find((a) => a.id === canvasActorId)
    if (actorToDuplicate) {
      const newActor: CanvasActor = {
        ...actorToDuplicate,
        id: `canvas-${Date.now()}-${Math.random()}`,
        x: actorToDuplicate.x + 20,
        y: actorToDuplicate.y + 20,
        groupId: undefined, // Don't inherit group membership
      }
      setCanvasActors((prev) => [...prev, newActor])
    }
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const handleCreateGroup = (name: string, color: string) => {
    if (selectedActorIds.length === 0) return

    const selectedActors = canvasActors.filter((actor) => selectedActorIds.includes(actor.id))
    const bounds = calculateActorBounds(selectedActors)

    const newGroup: CanvasGroupProps = {
      id: `group-${Date.now()}`,
      name,
      color,
      actorIds: selectedActorIds,
      ...bounds,
    }

    // Update actors to belong to this group
    setCanvasActors((prev) =>
      prev.map((actor) => (selectedActorIds.includes(actor.id) ? { ...actor, groupId: newGroup.id } : actor)),
    )

    setCanvasGroups((prev) => [...prev, newGroup])
    setSelectedActorIds([])
    setShowCreateGroupModal(false)
  }

  const handleDeleteGroup = (groupId: string) => {
    setCanvasGroups((prev) => prev.filter((group) => group.id !== groupId))
    setCanvasActors((prev) =>
      prev.map((actor) => (actor.groupId === groupId ? { ...actor, groupId: undefined } : actor)),
    )
  }

  const handleGroupNameChange = (groupId: string, newName: string) => {
    setCanvasGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, name: newName } : group)))
  }

  const handleAddActorToGroup = (canvasActorId: string, groupId: string) => {
    const actorToAdd = canvasActors.find((a) => a.id === canvasActorId)
    if (!actorToAdd) return

    // Update the actor to belong to the group
    setCanvasActors((prev) => prev.map((actor) => (actor.id === canvasActorId ? { ...actor, groupId } : actor)))

    // Update group bounds to include the new actor
    updateGroupBounds()

    // Close context menu
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const handleCreateGroupWithActor = (canvasActorId: string) => {
    setSelectedActorIds([canvasActorId])
    setShowCreateGroupModal(true)
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const calculateActorBounds = (actors: CanvasActor[]) => {
    if (actors.length === 0) return { x: 0, y: 0, width: 0, height: 0 }

    const minX = Math.min(...actors.map((a) => a.x))
    const minY = Math.min(...actors.map((a) => a.y))
    const maxX = Math.max(...actors.map((a) => a.x + 280)) // Updated card width
    const maxY = Math.max(...actors.map((a) => a.y + 200)) // Approximate card height

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  const updateGroupBounds = () => {
    setCanvasGroups((prev) =>
      prev.map((group) => {
        const groupActors = canvasActors.filter((actor) => actor.groupId === group.id)
        const bounds = calculateActorBounds(groupActors)
        return { ...group, ...bounds }
      }),
    )
  }

  const handleSelectAll = () => {
    setSelectedActorIds(canvasActors.map((actor) => actor.id))
  }

  const handleClearSelection = () => {
    setSelectedActorIds([])
  }

  const handleDeleteSelected = () => {
    setCanvasActors((prev) => prev.filter((actor) => !selectedActorIds.includes(actor.id)))
    setSelectedActorIds([])
    updateGroupBounds()
  }

  const handleSaveCanvas = () => {
    const canvasData = {
      actors: canvasActors,
      groups: canvasGroups,
      zoom,
      pan,
      showActorNames,
      sidebarCollapsed,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`canvas-${state.currentFocus.currentProjectId}`, JSON.stringify(canvasData))
    alert("Canvas saved successfully!")
  }

  const handleLoadCanvas = () => {
    const saved = localStorage.getItem(`canvas-${state.currentFocus.currentProjectId}`)
    if (saved) {
      const canvasData = JSON.parse(saved)
      setCanvasActors(canvasData.actors || [])
      setCanvasGroups(canvasData.groups || [])
      setZoom(canvasData.zoom || 1)
      setPan(canvasData.pan || { x: 0, y: 0 })
      setShowActorNames(canvasData.showActorNames ?? true)
      setSidebarCollapsed(canvasData.sidebarCollapsed ?? false)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener("wheel", handleWheel, { passive: false })
      return () => canvas.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel])

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu((prev) => ({ ...prev, isVisible: false }))
    }

    if (contextMenu.isVisible) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu.isVisible])

  useEffect(() => {
    updateGroupBounds()
  }, [canvasActors])

  // Load canvas on mount
  useEffect(() => {
    handleLoadCanvas()
  }, [])

  const handleMoveActorFromContext = (canvasActorId: string) => {
    const canvasActor = canvasActors.find((a) => a.id === canvasActorId)
    if (canvasActor) {
      // Find the character this actor belongs to
      const character = currentProject?.characters.find(
        (char) =>
          char.name === canvasActor.characterName ||
          char.actors.shortLists.some((sl) => sl.actors.some((a) => a.id === canvasActor.actorId)) ||
          state.tabDefinitions.some(
            (tabDef) =>
              tabDef.key !== "shortLists" &&
              (char.actors[tabDef.key] || []).some((a: any) => a.id === canvasActor.actorId),
          ),
      )

      if (character) {
        openModal("moreActions", {
          actor: canvasActor.actor,
          characterId: character.id,
        })
      }
    }
    setContextMenu((prev) => ({ ...prev, isVisible: false }))
  }

  const handleCanvasClose = () => {
    // Close all modals when canvas is closed
    closeAllModals()
    onClose()
  }

  // Enhanced global mouse event listeners for smooth canvas dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPan = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        }
        setPan(newPan)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }

    const handleGlobalWheel = (e: WheelEvent) => {
      // Only handle wheel events when they're on the canvas area
      const target = e.target as HTMLElement
      if (target.closest(".canvas-container")) {
        handleWheel(e)
      }
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)
    }

    // Add global wheel listener for better zoom experience
    document.addEventListener("wheel", handleGlobalWheel, { passive: false })

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
      document.removeEventListener("wheel", handleGlobalWheel)
    }
  }, [isDragging, dragStart, handleWheel])

  // Clean up zoom timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <Layout className="w-6 h-6" />
            <span>Casting Canvas</span>
          </h2>
          <div className="text-sm text-gray-600">Drag actors from the sidebar to the canvas</div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Selection Controls */}
          {selectedActorIds.length > 0 && (
            <div className="flex items-center space-x-1 bg-blue-100 rounded-lg p-1">
              <span className="px-2 text-sm text-blue-800">{selectedActorIds.length} selected</span>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Create Group"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">Group</span>
              </button>
              <button
                onClick={handleDeleteSelected}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearSelection}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actor Names Toggle */}
          <button
            onClick={() => setShowActorNames(!showActorNames)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
              showActorNames ? "bg-gray-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={showActorNames ? "Hide Actor Names" : "Show Actor Names"}
          >
            {showActorNames ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm">Actor Names</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white rounded transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium min-w-[70px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white rounded transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            {selectedActorIds.length > 0 && (
              <button
                onClick={handleZoomToSelection}
                className="p-2 hover:bg-white rounded transition-colors text-blue-600"
                title="Zoom to Selected Actors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleZoomToFit}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Zoom to Fit All Actors"
              disabled={canvasActors.length === 0}
            >
              <Fullscreen className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Save/Load */}
          <button
            onClick={handleSaveCanvas}
            className="flex items-center space-x-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          {/* Close Button */}
          <button
            onClick={handleCanvasClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close Canvas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-100 canvas-container">
          <div
            ref={canvasRef}
            className={`w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-canvas-background="true"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              willChange: isDragging || isZooming ? "transform" : "auto",
              transition: isDragging || isZooming ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            />

            {/* Canvas Groups */}
            {canvasGroups.map((group) => (
              <CanvasGroup
                key={group.id}
                group={group}
                onNameChange={handleGroupNameChange}
                onDelete={handleDeleteGroup}
                onDragGroup={handleGroupDrag}
              />
            ))}

            {/* Canvas Actors */}
            {canvasActors.map((canvasActor) => {
              const group = canvasGroups.find((g) => g.id === canvasActor.groupId)
              return (
                <CanvasActorCard
                  key={canvasActor.id}
                  canvasActor={canvasActor}
                  showActorName={showActorNames}
                  isSelected={selectedActorIds.includes(canvasActor.id)}
                  isInGroup={!!canvasActor.groupId}
                  groupColor={group?.color}
                  onDrag={handleActorDrag}
                  onCharacterNameChange={handleCharacterNameChange}
                  onContextMenu={handleContextMenu}
                  onSelect={handleActorSelect}
                />
              )
            })}
          </div>

          {/* Instructions */}
          {canvasActors.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <div className="text-lg font-medium mb-2">Drag actors from the sidebar to start</div>
                <div className="text-sm">
                  • Drag to move actors around
                  <br />• Ctrl/Cmd+Click to select multiple actors
                  <br />• Create groups from selected actors
                  <br />• Drag group headers to move entire groups
                  <br />• Scroll to zoom in/out at cursor position
                  <br />• Right-click actors for more options
                </div>
              </div>
            </div>
          )}

          {/* Zoom and Pan Instructions */}
          {canvasActors.length > 0 && selectedActorIds.length === 0 && (
            <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg pointer-events-none">
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-1">Navigation:</div>
                <div>• Scroll to zoom in/out at cursor position</div>
                <div>• Click and drag to pan around</div>
                <div>• Ctrl/Cmd+Click to select multiple actors</div>
                <div className="mt-2 text-xs text-gray-500">Zoom: {Math.round(zoom * 100)}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Right Sidebar with Actors */}
        <div
          className={`bg-white border-l border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-80"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!sidebarCollapsed && (
              <>
                <h3 className="font-semibold text-gray-800">Available Actors</h3>
                {canvasActors.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    title="Select All Actors"
                  >
                    Select All
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Search (only when expanded) */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search actors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
              {searchQuery && (
                <div className="mt-2 text-xs text-gray-500">
                  {filteredActors.length} of {uniqueActors.length} actors
                </div>
              )}
            </div>
          )}

          {/* Actors List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className={`space-y-2 ${sidebarCollapsed ? "space-y-1" : ""}`}>
              {filteredActors.length > 0
                ? filteredActors.map((actor) => (
                    <div
                      key={actor.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", actor.id)
                      }}
                      className={`bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors border border-gray-200 hover:border-emerald-300 ${
                        sidebarCollapsed ? "p-1" : "p-3"
                      }`}
                    >
                      {sidebarCollapsed ? (
                        // Collapsed view: Just thumbnail
                        <div className="flex justify-center">
                          <img
                            src={actor.headshots?.[0] || "/placeholder.svg?height=40&width=40"}
                            alt={actor.name}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                            title={`${actor.name} - From: ${actor.sourceCharacter}`}
                          />
                        </div>
                      ) : (
                        // Expanded view: Full details
                        <div className="flex items-center space-x-3">
                          <img
                            src={actor.headshots?.[0] || "/placeholder.svg?height=40&width=40"}
                            alt={actor.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 truncate">{actor.name}</div>
                            <div className="text-xs text-gray-500 truncate">From: {actor.sourceCharacter}</div>
                            {actor.age && <div className="text-xs text-gray-400">Age: {actor.age}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                : !sidebarCollapsed && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-sm">
                        {searchQuery ? "No actors found matching your search" : "No actors available"}
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="text-emerald-600 hover:text-emerald-700 text-sm mt-2"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.isVisible && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          availableGroups={canvasGroups}
          onRemove={() => handleRemoveActor(contextMenu.actorId)}
          onDuplicate={() => handleDuplicateActor(contextMenu.actorId)}
          onMoveActor={() => handleMoveActorFromContext(contextMenu.actorId)}
          onAddToGroup={(groupId) => handleAddActorToGroup(contextMenu.actorId, groupId)}
          onCreateNewGroup={() => handleCreateGroupWithActor(contextMenu.actorId)}
          onClose={() => setContextMenu((prev) => ({ ...prev, isVisible: false }))}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          selectedActorIds={selectedActorIds}
          onCreateGroup={handleCreateGroup}
          onClose={() => {
            setShowCreateGroupModal(false)
            setSelectedActorIds([])
          }}
        />
      )}
    </div>
  )
}
