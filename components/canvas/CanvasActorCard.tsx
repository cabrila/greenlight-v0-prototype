"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CanvasActor {
  id: string
  actorId: string
  x: number
  y: number
  characterName: string
  actor: any
  groupId?: string
}

interface CanvasActorCardProps {
  canvasActor: CanvasActor
  showActorName: boolean
  isSelected: boolean
  isInGroup: boolean
  groupColor?: string
  onDrag: (id: string, deltaX: number, deltaY: number) => void
  onCharacterNameChange: (id: string, newName: string) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
  onSelect: (id: string, isMultiSelect: boolean) => void
}

export default function CanvasActorCard({
  canvasActor,
  showActorName,
  isSelected,
  isInGroup,
  groupColor,
  onDrag,
  onCharacterNameChange,
  onContextMenu,
  onSelect,
}: CanvasActorCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(canvasActor.characterName)
  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Update editValue when characterName changes
  useEffect(() => {
    setEditValue(canvasActor.characterName)
  }, [canvasActor.characterName])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Reset image index when actor changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [canvasActor.actor.id])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on the editable area
    if ((e.target as HTMLElement).closest(".character-edit-area")) {
      return
    }

    // Handle selection
    if (e.ctrlKey || e.metaKey) {
      onSelect(canvasActor.id, true)
    } else {
      onSelect(canvasActor.id, false)
    }

    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Remove this entire function body since dragging is handled by document-level events
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCharacterNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }

  const handleCharacterNameBlur = () => {
    setIsEditing(false)
    onCharacterNameChange(canvasActor.id, editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
      onCharacterNameChange(canvasActor.id, editValue)
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setEditValue(canvasActor.characterName)
    }
  }

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : (canvasActor.actor.headshots?.length || 1) - 1))
  }

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev < (canvasActor.actor.headshots?.length || 1) - 1 ? prev + 1 : 0))
  }

  // Handle document-level mouse events for dragging
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartRef.current.x
        const deltaY = e.clientY - dragStartRef.current.y
        onDrag(canvasActor.id, deltaX, deltaY)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleDocumentMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleDocumentMouseMove)
      document.addEventListener("mouseup", handleDocumentMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove)
      document.removeEventListener("mouseup", handleDocumentMouseUp)
    }
  }, [isDragging, canvasActor.id, onDrag])

  return (
    <motion.div
      ref={cardRef}
      className={`absolute flex bg-white rounded-lg shadow-md overflow-hidden select-none group ${
        isSelected ? "ring-2 ring-blue-500" : ""
      } ${isInGroup ? `border-2 border-dashed ${groupColor ? groupColor : "border-gray-400"}` : ""}`}
      style={{
        left: canvasActor.x,
        top: canvasActor.y,
        width: "280px",
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.8 : 1,
        zIndex: isSelected || isDragging ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => onContextMenu(e, canvasActor.id)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      data-actor-card="true"
    >
      {/* Thumbnail with carousel (50% of card width) */}
      <div className="w-1/2 h-full relative">
        <img
          src={canvasActor.actor.headshots?.[currentImageIndex] || "/placeholder.svg?height=160&width=140"}
          alt={canvasActor.actor.name}
          className="w-full h-full object-cover"
          style={{ aspectRatio: "1/1.2" }}
          draggable={false}
        />

        {/* Navigation arrows - only show if multiple images */}
        {canvasActor.actor.headshots && canvasActor.actor.headshots.length > 1 && (
          <div className="image-navigation">
            {/* Left arrow */}
            <button
              onClick={handlePreviousImage}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Previous image"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            {/* Right arrow */}
            <button
              onClick={handleNextImage}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Next image"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Image indicator dots */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {canvasActor.actor.headshots.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(index)
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    index === currentImageIndex ? "bg-white" : "bg-white bg-opacity-50 hover:bg-opacity-75"
                  }`}
                  title={`Image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text content (50% of card width) */}
      <div className="w-1/2 p-3 flex flex-col">
        {/* Actor name (toggleable) */}
        {showActorName && (
          <div className="text-sm font-medium text-gray-600 mb-2 truncate">{canvasActor.actor.name}</div>
        )}

        {/* Character name (editable) */}
        <div
          className={`character-edit-area flex-grow ${showActorName ? "" : "pt-1"}`}
          onClick={handleCharacterNameClick}
        >
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={editValue}
              onChange={handleCharacterNameChange}
              onBlur={handleCharacterNameBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full min-h-[60px] p-2 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter character details..."
            />
          ) : (
            <div className="text-base font-bold text-gray-600 min-h-[60px] p-1 hover:bg-gray-50 rounded cursor-text">
              {canvasActor.characterName || "Click to add character details..."}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
