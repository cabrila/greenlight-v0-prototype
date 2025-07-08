"use client"

import type React from "react"

import { useCasting } from "@/components/casting/CastingContext"
import type { Character, Actor } from "@/types/casting"
import { useState, useCallback, useEffect, useRef } from "react"
import { ArrowRightCircle, Mail, Crown, List, CheckCircle, Users } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"
import ActorCard from "@/components/actors/ActorCard"

interface ActorGridProps {
  character: Character
}

export default function ActorGrid({ character }: ActorGridProps) {
  const { state, dispatch } = useCasting()
  const { activeTabKey, searchTerm, currentSortOption, cardDisplayMode } = state.currentFocus

  // Enhanced drag and drop state with better cleanup
  const [draggedActor, setDraggedActor] = useState<Actor | null>(null)
  const [dropTarget, setDropTarget] = useState<{ actorId: string; position: "before" | "after" } | null>(null)
  const [isDragOverGrid, setIsDragOverGrid] = useState(false)
  const [draggedActorIds, setDraggedActorIds] = useState<Set<string>>(new Set())
  const [isMultiDragging, setIsMultiDragging] = useState(false)

  // Multi-select state
  const [selectedActorIds, setSelectedActorIds] = useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [voteFilter, setVoteFilter] = useState<string>("")

  // Drag cleanup timeout ref
  const dragCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dragStateRef = useRef({
    isDragging: false,
    draggedActorId: null as string | null,
    draggedActorIds: new Set<string>(),
  })

  // Enhanced drag state cleanup function
  const cleanupDragState = useCallback(() => {
    console.log("🧹 ActorGrid: Cleaning up drag state")

    // Clear all drag-related state
    setDraggedActor(null)
    setDropTarget(null)
    setIsDragOverGrid(false)
    setDraggedActorIds(new Set())
    setIsMultiDragging(false)

    // Update ref state
    dragStateRef.current = {
      isDragging: false,
      draggedActorId: null,
      draggedActorIds: new Set(),
    }

    // Clear any pending cleanup timeouts
    if (dragCleanupTimeoutRef.current) {
      clearTimeout(dragCleanupTimeoutRef.current)
      dragCleanupTimeoutRef.current = null
    }

    console.log("✅ ActorGrid: Drag state cleaned up")
  }, [])

  // Scheduled cleanup with timeout fallback
  const scheduleDragCleanup = useCallback(
    (delay = 100) => {
      if (dragCleanupTimeoutRef.current) {
        clearTimeout(dragCleanupTimeoutRef.current)
      }

      dragCleanupTimeoutRef.current = setTimeout(() => {
        cleanupDragState()
      }, delay)
    },
    [cleanupDragState],
  )

  // Clear selection when changing tabs or characters
  useEffect(() => {
    setSelectedActorIds(new Set())
    setLastSelectedId(null)
    cleanupDragState() // Also cleanup drag state when switching contexts
  }, [activeTabKey, character.id, cleanupDragState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupTimeoutRef.current) {
        clearTimeout(dragCleanupTimeoutRef.current)
      }
    }
  }, [])

  // Handle keyboard events for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key clears selection and drag state
      if (e.key === "Escape") {
        setSelectedActorIds(new Set())
        setLastSelectedId(null)
        cleanupDragState()
      }

      // Ctrl+A or Cmd+A selects all visible actors
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        const actors = filterAndSortActors(getActorsForTab())
        const allIds = new Set(actors.map((actor) => actor.id))
        setSelectedActorIds(allIds)
        setLastSelectedId(actors.length > 0 ? actors[actors.length - 1].id : null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTabKey, character.id, cleanupDragState])

  // Utility function to check if drag contains image files
  const hasImageFiles = (dataTransfer: DataTransfer): boolean => {
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return Array.from(dataTransfer.files).some((file) => file.type.startsWith("image/"))
    }

    const types = Array.from(dataTransfer.types)
    return types.some((type) => type.includes("image") || type === "Files" || type === "application/x-moz-file")
  }

  // Utility function to check if drag contains actor data
  const hasActorData = (dataTransfer: DataTransfer): boolean => {
    const textData = dataTransfer.getData("text/plain")
    const jsonData = dataTransfer.getData("application/json")

    if (textData && textData.startsWith("actor-")) {
      return true
    }

    if (jsonData) {
      try {
        const data = JSON.parse(jsonData)
        return data.dragType === "actor" || data.actorId || data.sourceTabKey
      } catch {
        return false
      }
    }

    return false
  }

  const getActorsForTab = (): Actor[] => {
    if (activeTabKey === "shortLists") {
      return character.actors.shortLists.flatMap((sl) => sl.actors)
    }

    const actors = character.actors[activeTabKey as keyof typeof character.actors]
    return Array.isArray(actors) ? actors : []
  }

  // Enhanced search function to include all the new fields
  const matchesSearch = (actor: Actor, searchTerm: string): boolean => {
    if (!searchTerm) return true

    const search = searchTerm.toLowerCase()

    // Core fields
    if (actor.name?.toLowerCase().includes(search)) return true
    if (actor.gender?.toLowerCase().includes(search)) return true
    if (actor.ethnicity?.toLowerCase().includes(search)) return true
    if (actor.location?.toLowerCase().includes(search)) return true
    if (actor.agent?.toLowerCase().includes(search)) return true

    // Skills & Abilities
    if (actor.skills?.some((skill) => skill.toLowerCase().includes(search))) return true

    // Additional fields from the enhanced actor data
    if ((actor as any).language?.toLowerCase().includes(search)) return true
    if ((actor as any).height?.toLowerCase().includes(search)) return true
    if ((actor as any).bodyType?.toLowerCase().includes(search)) return true
    if ((actor as any).shoeSize?.toLowerCase().includes(search)) return true
    if ((actor as any).hairColor?.toLowerCase().includes(search)) return true
    if ((actor as any).eyeColor?.toLowerCase().includes(search)) return true
    if ((actor as any).nakednessLevel?.toLowerCase().includes(search)) return true

    // Past Productions - search through array of productions
    if ((actor as any).pastProductions?.some((production: string) => production.toLowerCase().includes(search)))
      return true

    // IMDB URL (might contain searchable text)
    if ((actor as any).imdbUrl?.toLowerCase().includes(search)) return true

    return false
  }

  const filterAndSortActors = (actors: Actor[]): Actor[] => {
    // For Approval list, show ALL actors including greenlit ones
    // For other lists, filter out greenlit actors
    let filtered = activeTabKey === "approval" ? actors : actors.filter((actor) => !actor.isGreenlit)

    // Apply enhanced search filter
    if (searchTerm) {
      filtered = filtered.filter((actor) => matchesSearch(actor, searchTerm))
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((actor) => actor.statuses?.some((status) => statusFilter.includes(status.id)))
    }

    // Apply vote filter
    if (voteFilter) {
      filtered = filtered.filter((actor) => {
        const votes = Object.values(actor.userVotes || {})
        switch (voteFilter) {
          case "unanimous_yes":
            return votes.length === state.users.length && votes.every((v) => v === "yes")
          case "unanimous_no":
            return votes.length === state.users.length && votes.every((v) => v === "no")
          case "mixed":
            return votes.length > 0 && new Set(votes).size > 1
          case "no_votes":
            return votes.length === 0
          default:
            return true
        }
      })
    }

    // Apply sorting
    const hasCustomOrder = filtered.some((actor) => typeof actor.sortOrder === "number")

    if (currentSortOption === "custom" || hasCustomOrder) {
      filtered.sort((a, b) => {
        const aOrder = a.sortOrder ?? 999999
        const bOrder = b.sortOrder ?? 999999
        return aOrder - bOrder
      })
    } else {
      filtered.sort((a, b) => {
        switch (currentSortOption) {
          case "alphabetical":
            return a.name.localeCompare(b.name)
          case "consensus":
            const aVotes = Object.values(a.userVotes || {})
            const bVotes = Object.values(b.userVotes || {})
            const aYesVotes = aVotes.filter((v) => v === "yes").length
            const bYesVotes = bVotes.filter((v) => v === "yes").length
            const aVoteCount = aVotes.length
            const bVoteCount = bVotes.length

            const aRatio = aVoteCount > 0 ? aYesVotes / aVoteCount : 0
            const bRatio = bVoteCount > 0 ? bYesVotes / bVoteCount : 0

            if (aRatio !== bRatio) {
              return bRatio - aRatio
            }
            return bVoteCount - aVoteCount
          case "status":
            const aStatus = a.statuses?.[0]?.name || "zzz"
            const bStatus = b.statuses?.[0]?.name || "zzz"
            return aStatus.localeCompare(bStatus)
          case "dateAdded":
            const aDate = a.dateAdded || 0
            const bDate = b.dateAdded || 0
            return bDate - aDate
          case "age":
            const aAge = Number.parseInt(a.age || "999")
            const bAge = Number.parseInt(b.age || "999")
            return aAge - bAge
          case "notes":
            const aNotes = a.notes?.length || 0
            const bNotes = b.notes?.length || 0
            return bNotes - aNotes
          default:
            return 0
        }
      })
    }

    // For Approval list, sort cast/greenlit actors to the top
    if (activeTabKey === "approval") {
      filtered.sort((a, b) => {
        if (a.isCast && !b.isCast) return -1
        if (!a.isCast && b.isCast) return 1
        if (a.isGreenlit && !b.isGreenlit) return -1
        if (!a.isGreenlit && b.isGreenlit) return 1
        return 0
      })
    }

    // Move soft rejected to end for long list
    if (activeTabKey === "longList") {
      filtered.sort((a, b) => {
        if (a.isSoftRejected === b.isSoftRejected) return 0
        return a.isSoftRejected ? 1 : -1
      })
    }

    return filtered
  }

  // Enhanced validation for actor movement
  const validateActorMovement = (
    actorIds: string[],
    destinationKey: string,
  ): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = []
    const valid = true

    const actorsToMove = getSelectedActors(actorIds)

    if (destinationKey === "approval") {
      const actorsWithoutVotes = actorsToMove.filter(
        (actor) => !actor.userVotes || Object.keys(actor.userVotes).length === 0,
      )

      if (actorsWithoutVotes.length > 0) {
        warnings.push(`${actorsWithoutVotes.length} actor(s) have no votes yet. Consider getting team input first.`)
      }

      const actorsFromLongList = actorsToMove.filter((actor) => actor.currentListKey === "longList")
      if (actorsFromLongList.length > 0) {
        warnings.push(
          `${actorsFromLongList.length} actor(s) are moving directly from Long List to Approval. This skips the audition stage.`,
        )
      }
    }

    if (destinationKey === "longList") {
      const actorsFromApproval = actorsToMove.filter((actor) => actor.currentListKey === "approval")
      if (actorsFromApproval.length > 0) {
        warnings.push(
          `${actorsFromApproval.length} actor(s) are moving back from Approval. Their voting history will be preserved.`,
        )
      }

      const greenlitActors = actorsToMove.filter((actor) => actor.isGreenlit || actor.isCast)
      if (greenlitActors.length > 0) {
        warnings.push(
          `${greenlitActors.length} greenlit/cast actor(s) are being moved back to Long List. This will reset their cast status.`,
        )
      }
    }

    return { valid, warnings }
  }

  // Get selected actors from IDs
  const getSelectedActors = (actorIds: string[]): Actor[] => {
    const allActors: Actor[] = []

    for (const listKey of ["longList", "audition", "approval"]) {
      const list = character.actors[listKey as keyof typeof character.actors] as Actor[]
      if (Array.isArray(list)) {
        allActors.push(...list.filter((a) => actorIds.includes(a.id)))
      }
    }

    for (const shortlist of character.actors.shortLists) {
      allActors.push(...shortlist.actors.filter((a) => actorIds.includes(a.id)))
    }

    for (const [key, actors] of Object.entries(character.actors)) {
      if (!["longList", "audition", "approval", "shortLists"].includes(key) && Array.isArray(actors)) {
        allActors.push(...(actors as Actor[]).filter((a) => actorIds.includes(a.id)))
      }
    }

    return allActors
  }

  // Selection handlers
  const handleActorSelect = useCallback(
    (actorId: string, e: React.MouseEvent) => {
      e.preventDefault()

      const actors = filterAndSortActors(getActorsForTab())

      if (e.shiftKey && lastSelectedId) {
        const currentIndex = actors.findIndex((a) => a.id === actorId)
        const lastIndex = actors.findIndex((a) => a.id === lastSelectedId)

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex)
          const end = Math.max(currentIndex, lastIndex)

          const newSelection = new Set(selectedActorIds)
          for (let i = start; i <= end; i++) {
            newSelection.add(actors[i].id)
          }

          setSelectedActorIds(newSelection)
          setLastSelectedId(actorId)
        }
      } else if (e.ctrlKey || e.metaKey) {
        const newSelection = new Set(selectedActorIds)
        if (newSelection.has(actorId)) {
          newSelection.delete(actorId)
        } else {
          newSelection.add(actorId)
        }

        setSelectedActorIds(newSelection)
        setLastSelectedId(actorId)
      } else {
        setSelectedActorIds(new Set([actorId]))
        setLastSelectedId(actorId)
      }
    },
    [lastSelectedId, selectedActorIds, activeTabKey, character.id],
  )

  // Enhanced drag and drop handlers with better state management
  const handleDragStart = useCallback(
    (e: React.DragEvent, actor: Actor) => {
      console.log("🎯 ActorGrid: Drag start for actor:", actor.name)

      if (hasImageFiles(e.dataTransfer)) {
        console.log("🚫 ActorGrid: Image files detected, aborting actor drag")
        return
      }

      // Ensure actor is selected
      if (!selectedActorIds.has(actor.id)) {
        setSelectedActorIds(new Set([actor.id]))
        setLastSelectedId(actor.id)
      }

      // Update drag state
      const selectedIds = Array.from(selectedActorIds.has(actor.id) ? selectedActorIds : new Set([actor.id]))
      const isMultiDrag = selectedIds.length > 1

      setDraggedActor(actor)
      setDraggedActorIds(new Set(selectedIds))
      setIsMultiDragging(isMultiDrag)

      // Update ref state for tracking
      dragStateRef.current = {
        isDragging: true,
        draggedActorId: actor.id,
        draggedActorIds: new Set(selectedIds),
      }

      e.dataTransfer.effectAllowed = "move"

      const actorDataId = `actor-${actor.id}`
      e.dataTransfer.setData("text/plain", actorDataId)

      let sourceLocation: any = null

      if (activeTabKey === "shortLists") {
        for (const shortlist of character.actors.shortLists) {
          if (shortlist.actors.some((a) => a.id === actor.id)) {
            sourceLocation = { type: "shortlist", shortlistId: shortlist.id }
            break
          }
        }
      } else if (["longList", "audition", "approval"].includes(activeTabKey)) {
        sourceLocation = { type: "standard", key: activeTabKey }
      } else {
        sourceLocation = { type: "custom", key: activeTabKey }
      }

      const dragData = {
        sourceTabKey: activeTabKey,
        sourceLocation,
        actorName: actor.name,
        actorId: actor.id,
        selectedActorIds: selectedIds,
        isMultiDrag,
        dragType: "actor",
      }

      e.dataTransfer.setData("application/json", JSON.stringify(dragData))

      if (isMultiDrag) {
        const dragPreview = document.createElement("div")
        dragPreview.className = "bg-white rounded-xl shadow-2xl p-4 border-2 border-emerald-500 backdrop-blur-sm"
        dragPreview.innerHTML = `
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div>
            <div class="font-bold text-emerald-700 text-lg">${selectedIds.length} actors selected</div>
            <div class="text-sm text-emerald-600">Ready to move</div>
          </div>
        </div>
      `
        dragPreview.style.position = "absolute"
        dragPreview.style.top = "-1000px"
        dragPreview.style.opacity = "0.95"
        dragPreview.style.transform = "scale(1.05)"
        document.body.appendChild(dragPreview)

        e.dataTransfer.setDragImage(dragPreview, 100, 40)

        setTimeout(() => {
          if (document.body.contains(dragPreview)) {
            document.body.removeChild(dragPreview)
          }
        }, 0)
      }

      console.log("✅ ActorGrid: Drag start completed")
    },
    [activeTabKey, character.actors.shortLists, selectedActorIds],
  )

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      console.log("🏁 ActorGrid: Drag end triggered")

      // Schedule cleanup with a small delay to ensure drop handlers complete first
      scheduleDragCleanup(50)
    },
    [scheduleDragCleanup],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetActor: Actor) => {
      if (hasImageFiles(e.dataTransfer)) {
        return
      }

      if (!draggedActor || draggedActor.id === targetActor.id) return

      e.preventDefault()
      e.dataTransfer.dropEffect = "move"

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      const position = e.clientY < midpoint ? "before" : "after"

      setDropTarget({ actorId: targetActor.id, position })
    },
    [draggedActor],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, targetActor: Actor) => {
      console.log("💧 ActorGrid: Drop on actor:", targetActor.name)

      e.preventDefault()

      if (hasImageFiles(e.dataTransfer)) {
        console.log("🚫 ActorGrid: Image files detected, aborting actor drop")
        scheduleDragCleanup(0)
        return
      }

      if (!draggedActor || !dropTarget || draggedActor.id === targetActor.id) {
        console.log("🚫 ActorGrid: Invalid drop conditions")
        scheduleDragCleanup(0)
        return
      }

      const draggedActorData = e.dataTransfer.getData("application/json")
      let sourceInfo
      try {
        sourceInfo = JSON.parse(draggedActorData)
      } catch {
        console.log("🚫 ActorGrid: Failed to parse drag data")
        scheduleDragCleanup(0)
        return
      }

      if (sourceInfo.sourceTabKey === activeTabKey) {
        let listType: "standard" | "shortlist" | "custom" = "standard"
        let listKey = activeTabKey
        let shortlistId: string | undefined

        if (activeTabKey === "shortLists") {
          listType = "shortlist"
          for (const shortlist of character.actors.shortLists) {
            const hasDragged = shortlist.actors.some((a) => a.id === draggedActor.id)
            const hasTarget = shortlist.actors.some((a) => a.id === targetActor.id)
            if (hasDragged && hasTarget) {
              shortlistId = shortlist.id
              listKey = "shortLists"
              break
            }
          }

          if (!shortlistId) {
            console.log("🚫 ActorGrid: Shortlist not found")
            scheduleDragCleanup(0)
            return
          }
        } else if (!["longList", "audition", "approval"].includes(activeTabKey)) {
          listType = "custom"
        }

        if (sourceInfo.isMultiDrag && sourceInfo.selectedActorIds) {
          dispatch({
            type: "REORDER_MULTIPLE_ACTORS",
            payload: {
              characterId: character.id,
              listType,
              listKey,
              shortlistId,
              actorIds: sourceInfo.selectedActorIds,
              targetActorId: targetActor.id,
              insertPosition: dropTarget.position,
            },
          })
        } else {
          dispatch({
            type: "REORDER_ACTORS",
            payload: {
              characterId: character.id,
              listType,
              listKey,
              shortlistId,
              draggedActorId: draggedActor.id,
              targetActorId: targetActor.id,
              insertPosition: dropTarget.position,
            },
          })
        }

        if (currentSortOption !== "custom") {
          dispatch({
            type: "SET_SORT_OPTION",
            payload: "custom",
          })
        }

        console.log("✅ ActorGrid: Reorder completed")
      }

      // Clean up immediately after successful drop
      scheduleDragCleanup(0)
    },
    [
      draggedActor,
      dropTarget,
      activeTabKey,
      character.id,
      character.actors.shortLists,
      dispatch,
      currentSortOption,
      scheduleDragCleanup,
    ],
  )

  // Handle dropping on empty grid area
  const handleGridDragOver = useCallback(
    (e: React.DragEvent) => {
      if (hasImageFiles(e.dataTransfer)) {
        return
      }

      if (!hasActorData(e.dataTransfer)) {
        return
      }

      e.preventDefault()
      setIsDragOverGrid(true)
    },
    [activeTabKey],
  )

  const handleGridDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isDragOverGrid) {
        return
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragOverGrid(false)
      }
    },
    [isDragOverGrid],
  )

  const handleGridDrop = useCallback(
    (e: React.DragEvent) => {
      console.log("💧 ActorGrid: Grid drop triggered")

      e.preventDefault()
      e.stopPropagation()
      setIsDragOverGrid(false)

      if (hasImageFiles(e.dataTransfer)) {
        console.log("🚫 ActorGrid: Image files detected, aborting grid drop")
        scheduleDragCleanup(0)
        return
      }

      if (!hasActorData(e.dataTransfer)) {
        console.log("🚫 ActorGrid: No actor data detected")
        scheduleDragCleanup(0)
        return
      }

      const draggedActorData = e.dataTransfer.getData("application/json")
      const draggedActorId = e.dataTransfer.getData("text/plain")

      if (!draggedActorData || !draggedActorId) {
        console.log("🚫 ActorGrid: Missing drag data")
        scheduleDragCleanup(0)
        return
      }

      const actualActorId = draggedActorId.startsWith("actor-") ? draggedActorId.replace("actor-", "") : draggedActorId

      let sourceInfo
      try {
        sourceInfo = JSON.parse(draggedActorData)
      } catch (error) {
        console.log("🚫 ActorGrid: Failed to parse drag data")
        scheduleDragCleanup(0)
        return
      }

      if (sourceInfo.sourceTabKey === activeTabKey) {
        console.log("🔄 ActorGrid: Same tab drop, cleaning up")
        scheduleDragCleanup(0)
        return
      }

      const actorIds = sourceInfo.selectedActorIds || [actualActorId]
      const validation = validateActorMovement(actorIds, activeTabKey)

      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join("\n")
        if (!confirm(`Warning:\n\n${warningMessage}\n\nDo you want to continue with the move?`)) {
          scheduleDragCleanup(0)
          return
        }
      }

      let destinationType: "standard" | "shortlist" | "custom" = "standard"
      const destinationKey = activeTabKey
      let destinationShortlistId: string | undefined

      if (activeTabKey === "shortLists") {
        destinationType = "shortlist"
        if (character.actors.shortLists.length > 0) {
          destinationShortlistId = character.actors.shortLists[0].id
        }
      } else if (["longList", "approval"].includes(activeTabKey)) {
        destinationType = "standard"
      } else if (!["audition"].includes(activeTabKey)) {
        destinationType = "custom"
      }

      const movePayload = {
        actorIds: sourceInfo.selectedActorIds || [actualActorId],
        characterId: character.id,
        sourceLocation: sourceInfo.sourceLocation,
        destinationType,
        destinationKey,
        destinationShortlistId,
        moveReason: activeTabKey === "longList" ? "reset" : activeTabKey === "approval" ? "final_review" : "standard",
      }

      if (sourceInfo.isMultiDrag && sourceInfo.selectedActorIds && sourceInfo.selectedActorIds.length > 0) {
        dispatch({
          type: "MOVE_MULTIPLE_ACTORS",
          payload: movePayload,
        })
      } else {
        dispatch({
          type: "MOVE_ACTOR",
          payload: {
            actorId: actualActorId,
            characterId: character.id,
            sourceLocation: sourceInfo.sourceLocation,
            destinationType,
            destinationKey,
            destinationShortlistId,
            moveReason: movePayload.moveReason,
          },
        })
      }

      // Clear selection after successful move
      setSelectedActorIds(new Set())
      setLastSelectedId(null)

      const actorCount = sourceInfo.isMultiDrag ? sourceInfo.selectedActorIds.length : 1
      const actorText = actorCount > 1 ? `${actorCount} actors` : sourceInfo.actorName

      let notificationMessage = `${actorText} moved to ${activeTabKey}`
      let notificationTitle = "Actor Moved Successfully"
      let notificationPriority: "low" | "medium" | "high" = "low"

      if (activeTabKey === "approval") {
        notificationMessage = `${actorText} moved to Approval for final review and casting decisions`
        notificationTitle = "Moved to Approval"
        notificationPriority = "medium"
      } else if (activeTabKey === "longList") {
        notificationMessage = `${actorText} moved to Long List. Status and progress have been reset for fresh evaluation.`
        notificationTitle = "Moved to Long List"
        notificationPriority = "low"
      }

      const notification = {
        id: `drag-success-${Date.now()}`,
        type: "system" as const,
        title: notificationTitle,
        message: notificationMessage,
        timestamp: Date.now(),
        read: false,
        priority: notificationPriority,
      }

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: notification,
      })

      console.log("✅ ActorGrid: Grid drop completed successfully")

      // Clean up immediately after successful drop
      scheduleDragCleanup(0)
    },
    [activeTabKey, character.actors.shortLists, character.id, dispatch, scheduleDragCleanup],
  )

  // Handle opening modals
  const handleMoveToList = useCallback(() => {
    if (selectedActorIds.size === 0) return

    openModal("moveMultipleActors", {
      actorIds: Array.from(selectedActorIds),
      characterId: character.id,
    })
  }, [selectedActorIds, character.id])

  const handleContactActors = useCallback(() => {
    if (selectedActorIds.size === 0) return

    openModal("contactActor", {
      actorIds: Array.from(selectedActorIds),
      characterId: character.id,
    })
  }, [selectedActorIds, character.id])

  // Quick move functions
  const handleQuickMoveToLongList = useCallback(() => {
    if (selectedActorIds.size === 0) return

    const actorIds = Array.from(selectedActorIds)
    const validation = validateActorMovement(actorIds, "longList")

    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join("\n")
      if (!confirm(`Warning:\n\n${warningMessage}\n\nDo you want to continue moving to Long List?`)) {
        return
      }
    }

    const selectedActors = getSelectedActors(actorIds)
    let sourceLocation: any = null

    if (selectedActors.length > 0) {
      const firstActor = selectedActors[0]
      if (activeTabKey === "shortLists") {
        for (const shortlist of character.actors.shortLists) {
          if (shortlist.actors.some((a) => a.id === firstActor.id)) {
            sourceLocation = { type: "shortlist", shortlistId: shortlist.id }
            break
          }
        }
      } else if (["longList", "audition", "approval"].includes(activeTabKey)) {
        sourceLocation = { type: "standard", key: activeTabKey }
      } else {
        sourceLocation = { type: "custom", key: activeTabKey }
      }
    }

    dispatch({
      type: "MOVE_MULTIPLE_ACTORS",
      payload: {
        actorIds,
        characterId: character.id,
        sourceLocation,
        destinationType: "standard",
        destinationKey: "longList",
        moveReason: "reset",
      },
    })

    setSelectedActorIds(new Set())
    setLastSelectedId(null)

    const notification = {
      id: `quick-move-longlist-${Date.now()}`,
      type: "system" as const,
      title: "Moved to Long List",
      message: `${actorIds.length} actor${actorIds.length > 1 ? "s" : ""} moved to Long List for fresh evaluation`,
      timestamp: Date.now(),
      read: false,
      priority: "low" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })
  }, [selectedActorIds, character.id, activeTabKey, character.actors.shortLists, dispatch])

  const handleQuickMoveToApproval = useCallback(() => {
    if (selectedActorIds.size === 0) return

    const actorIds = Array.from(selectedActorIds)
    const validation = validateActorMovement(actorIds, "approval")

    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join("\n")
      if (!confirm(`Warning:\n\n${warningMessage}\n\nDo you want to continue moving to Approval?`)) {
        return
      }
    }

    const selectedActors = getSelectedActors(actorIds)
    let sourceLocation: any = null

    if (selectedActors.length > 0) {
      const firstActor = selectedActors[0]
      if (activeTabKey === "shortLists") {
        for (const shortlist of character.actors.shortLists) {
          if (shortlist.actors.some((a) => a.id === firstActor.id)) {
            sourceLocation = { type: "shortlist", shortlistId: shortlist.id }
            break
          }
        }
      } else if (["longList", "audition", "approval"].includes(activeTabKey)) {
        sourceLocation = { type: "standard", key: activeTabKey }
      } else {
        sourceLocation = { type: "custom", key: activeTabKey }
      }
    }

    dispatch({
      type: "MOVE_MULTIPLE_ACTORS",
      payload: {
        actorIds,
        characterId: character.id,
        sourceLocation,
        destinationType: "standard",
        destinationKey: "approval",
        moveReason: "final_review",
      },
    })

    setSelectedActorIds(new Set())
    setLastSelectedId(null)

    const notification = {
      id: `quick-move-approval-${Date.now()}`,
      type: "system" as const,
      title: "Moved to Approval",
      message: `${actorIds.length} actor${actorIds.length > 1 ? "s" : ""} moved to Approval for final review and casting decisions`,
      timestamp: Date.now(),
      read: false,
      priority: "medium" as const,
    }

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: notification,
    })
  }, [selectedActorIds, character.id, activeTabKey, character.actors.shortLists, dispatch])

  // Add this function after the existing handlers
  const handleGridClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the grid background, not on actor cards
    if (e.target === e.currentTarget) {
      setSelectedActorIds(new Set())
      setLastSelectedId(null)
    }
  }, [])

  const actors = filterAndSortActors(getActorsForTab())

  // Special messages for Long List and Approval tabs
  const isLongListTab = activeTabKey === "longList"
  const isApprovalTab = activeTabKey === "approval"

  const longListMessage = isLongListTab
    ? "Starting point for actor evaluation - all actors begin their journey here"
    : null
  const approvalMessage = isApprovalTab ? "Final approval stage - actors here are ready for casting decisions" : null

  const getGridClasses = () => {
    switch (cardDisplayMode) {
      case "list-view":
        return "flex flex-col gap-4 w-full" // Vertical stack with consistent gaps
      case "simple":
        return "grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 w-full justify-items-start" // Auto-fit grid with minimum card width
      default: // detailed view
        return "grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4 w-full justify-items-start" // Auto-fit grid with 350px minimum
    }
  }

  if (actors.length === 0) {
    return (
      <div className="w-full max-w-none mx-auto px-4 space-y-6">
        {/* Special messages for Long List and Approval tabs */}
        {longListMessage && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
            <List className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-blue-700 font-medium">{longListMessage}</div>
          </div>
        )}

        {approvalMessage && (
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
            <Crown className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-emerald-700 font-medium">{approvalMessage}</div>
          </div>
        )}

        <div
          className={`text-center text-gray-500 py-20 min-h-[500px] border-2 border-dashed rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragOverGrid
              ? isApprovalTab
                ? "border-emerald-400 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 text-emerald-700 shadow-2xl transform scale-105 ring-4 ring-emerald-200 ring-opacity-50"
                : isLongListTab
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 text-blue-700 shadow-2xl transform scale-105 ring-4 ring-blue-200 ring-opacity-50"
                  : "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-lg transform scale-105"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleGridDragOver}
          onDragLeave={handleGridDragLeave}
          onDrop={handleGridDrop}
          onClick={handleGridClick}
        >
          {isDragOverGrid ? (
            <div className="flex flex-col items-center space-y-6">
              <div
                className={`w-24 h-24 ${
                  isApprovalTab
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    : isLongListTab
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-blue-500"
                } rounded-full flex items-center justify-center shadow-xl animate-pulse`}
              >
                {isApprovalTab ? (
                  <Crown className="w-12 h-12 text-white" />
                ) : isLongListTab ? (
                  <List className="w-12 h-12 text-white" />
                ) : (
                  <Users className="w-12 h-12 text-white" />
                )}
              </div>
              <div className="text-center max-w-md">
                <div className="text-2xl font-bold mb-3">
                  {isApprovalTab
                    ? `Move ${isMultiDragging ? `${selectedActorIds.size} actors` : "actor"} to Approval`
                    : isLongListTab
                      ? `Move ${isMultiDragging ? `${selectedActorIds.size} actors` : "actor"} to Long List`
                      : `Drop ${isMultiDragging ? "actors" : "actor"} here`}
                </div>
                <div className="text-base opacity-75">
                  {isApprovalTab
                    ? `${isMultiDragging ? "These actors will be" : "This actor will be"} ready for final casting decisions and team review`
                    : isLongListTab
                      ? `${isMultiDragging ? "These actors will be" : "This actor will be"} reset for fresh evaluation from the beginning`
                      : `Move ${isMultiDragging ? "selected actors" : "actor"} to this list`}
                </div>
                {(isApprovalTab || isLongListTab) && isMultiDragging && (
                  <div
                    className={`mt-4 px-6 py-2 ${isApprovalTab ? "bg-emerald-600" : "bg-blue-600"} text-white rounded-full text-sm font-semibold inline-block shadow-lg`}
                  >
                    {isApprovalTab ? "Batch Approval Ready" : "Batch Reset Ready"}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-2xl font-medium text-slate-600">
                {searchTerm
                  ? `No actors found matching "${searchTerm}"`
                  : isApprovalTab
                    ? "No actors in approval yet."
                    : isLongListTab
                      ? "No actors in long list yet."
                      : "No actors in this list."}
              </div>
              <div className="text-base text-slate-500 max-w-md text-center leading-relaxed">
                {searchTerm ? (
                  <>
                    Search includes: Name, Gender, Ethnicity, Language, Height, Body Type, Hair/Eye Color, Skills, Past
                    Productions, and more.
                  </>
                ) : isApprovalTab ? (
                  "Drag actors here for final approval and casting decisions. Multi-select supported for batch operations."
                ) : isLongListTab ? (
                  "Get started by adding actors using the controls above, or drag actors here from other tabs."
                ) : (
                  "Drag actors here from other tabs. Use Ctrl/Cmd+Click for multi-select."
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none mx-auto px-4 space-y-6">
      {/* Special messages for Long List and Approval tabs */}
      {longListMessage && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
          <List className="w-5 h-5 text-blue-600" />
          <div className="text-sm text-blue-700 font-medium">{longListMessage}</div>
        </div>
      )}

      {approvalMessage && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
          <Crown className="w-5 h-5 text-emerald-600" />
          <div className="text-sm text-emerald-700 font-medium">{approvalMessage}</div>
        </div>
      )}

      {/* Enhanced Selection Controls with Quick Move buttons */}
      {selectedActorIds.size > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-emerald-800">
                    {selectedActorIds.size} actor{selectedActorIds.size > 1 ? "s" : ""} selected
                  </div>
                  <div className="text-sm text-emerald-600">Ready for batch operations</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Quick Move Buttons - Only show if not already on that tab */}
              {activeTabKey !== "longList" && (
                <button
                  onClick={handleQuickMoveToLongList}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
                >
                  <List className="w-4 h-4" />
                  <span>Move to Long List</span>
                </button>
              )}

              {activeTabKey !== "approval" && (
                <button
                  onClick={handleQuickMoveToApproval}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
                >
                  <Crown className="w-4 h-4" />
                  <span>Move to Approval</span>
                </button>
              )}

              {/* Existing buttons */}
              <button
                onClick={handleMoveToList}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
              >
                <ArrowRightCircle className="w-4 h-4" />
                <span>Move to List</span>
              </button>

              <button
                onClick={handleContactActors}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </button>

              <button
                onClick={() => {
                  setSelectedActorIds(new Set())
                  setLastSelectedId(null)
                }}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400 rounded-lg font-medium transition-colors text-sm shadow-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actor Grid */}
      <div
        className={`${getGridClasses()} ${
          isDragOverGrid
            ? isApprovalTab
              ? "bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 rounded-2xl p-6 border-2 border-emerald-300 shadow-xl"
              : isLongListTab
                ? "bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-2xl p-6 border-2 border-blue-300 shadow-xl"
                : "bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-300 shadow-lg"
            : ""
        }`}
        onDragOver={handleGridDragOver}
        onDragLeave={handleGridDragLeave}
        onDrop={handleGridDrop}
        onClick={handleGridClick}
      >
        {actors.map((actor) => (
          <div
            key={actor.id}
            className={`relative transition-all duration-200 ${
              dropTarget?.actorId === actor.id
                ? dropTarget.position === "before"
                  ? "border-t-4 border-emerald-500 pt-2"
                  : "border-b-4 border-emerald-500 pb-2"
                : ""
            } ${
              draggedActorIds.has(actor.id)
                ? "opacity-50 transform scale-95 ring-2 ring-emerald-400 ring-opacity-50"
                : ""
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, actor)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, actor)}
            onDrop={(e) => handleDrop(e, actor)}
          >
            <ActorCard
              actor={actor}
              character={character}
              isSelected={selectedActorIds.has(actor.id)}
              onSelect={handleActorSelect}
              viewMode={cardDisplayMode}
              isDragging={draggedActorIds.has(actor.id)}
              isDropTarget={dropTarget?.actorId === actor.id}
              dropPosition={dropTarget?.actorId === actor.id ? dropTarget.position : null}
              onDragStart={(e) => handleDragStart(e, actor)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, actor)}
              onDrop={(e) => handleDrop(e, actor)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
