"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { X, Image as ImageIcon, Upload } from "lucide-react"
import { isValidImageUrl } from "@/lib/utils"
import type { CanvasItem } from "./CanvasItemCard"

interface CanvasElementProps {
  item: CanvasItem
  isSelected: boolean
  interactive: boolean
  zoom: number
  onSelect: (id: string, isMultiSelect: boolean) => void
  onDrag: (id: string, deltaX: number, deltaY: number) => void
  onResize: (id: string, width: number, height: number) => void
  onRemove: (id: string) => void
  onTextChange: (id: string, text: string) => void
  onSetImage: (id: string) => void
}

const MIN_W = 60
const MIN_H = 36

export default function CanvasElement({
  item, isSelected, interactive, zoom, onSelect, onDrag, onResize, onRemove, onTextChange, onSetImage,
}: CanvasElementProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [editing, setEditing] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const width = item.width ?? 160
  const height = item.height ?? 120

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive || editing) return
    if ((e.target as HTMLElement).closest(".el-control")) return
    onSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey)
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
    e.stopPropagation()
  }

  useEffect(() => {
    if (!isDragging) return
    const move = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        onDrag(item.id, dx, dy)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      }
    }
    const up = () => setIsDragging(false)
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
    document.body.style.userSelect = "none"
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
      document.body.style.userSelect = ""
    }
  }, [isDragging, item.id, onDrag])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: width, h: height }
  }

  useEffect(() => {
    if (!isResizing) return
    const move = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStartRef.current.x) / zoom
      const dy = (e.clientY - resizeStartRef.current.y) / zoom
      onResize(item.id, Math.max(MIN_W, resizeStartRef.current.w + dx), Math.max(MIN_H, resizeStartRef.current.h + dy))
    }
    const up = () => setIsResizing(false)
    document.addEventListener("mousemove", move)
    document.addEventListener("mouseup", up)
    document.body.style.userSelect = "none"
    return () => {
      document.removeEventListener("mousemove", move)
      document.removeEventListener("mouseup", up)
      document.body.style.userSelect = ""
    }
  }, [isResizing, item.id, onResize, zoom])

  const baseStyle: React.CSSProperties = {
    left: item.x,
    top: item.y,
    width,
    height,
    cursor: !interactive ? "inherit" : isDragging ? "grabbing" : "grab",
    zIndex: isSelected || isDragging ? 30 : 1,
  }

  const ring = isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""

  const removeBtn = (
    <button
      className="el-control absolute -top-2.5 -right-2.5 z-20 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all"
      onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
      aria-label="Delete element"
    >
      <X className="w-3 h-3" />
    </button>
  )

  const resizeHandle = isSelected && interactive ? (
    <span
      className="el-control absolute -bottom-1.5 -right-1.5 z-20 w-3.5 h-3.5 rounded-sm bg-white border-2 border-emerald-500 cursor-se-resize"
      onMouseDown={startResize}
    />
  ) : null

  /* --------------------------- Text -------------------------------- */
  if (item.type === "text") {
    return (
      <div
        data-canvas-card="true"
        className={`group absolute select-none rounded-md ${ring}`}
        style={baseStyle}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => interactive && setEditing(true)}
      >
        {editing ? (
          <textarea
            autoFocus
            className="el-control w-full h-full resize-none bg-white/80 rounded-md px-2 py-1.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-snug"
            style={{ fontSize: 16 }}
            value={item.text || ""}
            placeholder="Type text..."
            onChange={(e) => onTextChange(item.id, e.target.value)}
            onBlur={() => setEditing(false)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="w-full h-full px-2 py-1.5 text-slate-900 font-semibold leading-snug overflow-hidden whitespace-pre-wrap" style={{ fontSize: 16 }}>
            {item.text || <span className="text-slate-400">Double-click to edit</span>}
          </div>
        )}
        {removeBtn}
        {resizeHandle}
      </div>
    )
  }

  /* --------------------------- Image ------------------------------- */
  if (item.type === "image") {
    const hasImg = isValidImageUrl(item.image)
    return (
      <div
        data-canvas-card="true"
        className={`group absolute select-none rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm ${ring}`}
        style={baseStyle}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => interactive && onSetImage(item.id)}
      >
        {hasImg ? (
          <img src={item.image || "/placeholder.svg"} alt={item.title || "Image"} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <button
            className="el-control w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/40 transition-colors"
            onClick={(e) => { e.stopPropagation(); onSetImage(item.id) }}
          >
            <Upload className="w-7 h-7" strokeWidth={1.5} />
            <span className="text-xs font-medium">Upload image</span>
            <span className="text-[10px] text-slate-400">Click or double-click</span>
          </button>
        )}
        {removeBtn}
        {resizeHandle}
      </div>
    )
  }

  /* --------------------------- Frame ------------------------------- */
  if (item.type === "frame") {
    return (
      <div
        data-canvas-card="true"
        className={`group absolute select-none rounded-lg bg-white/30 border-2 border-dashed border-slate-400 ${ring}`}
        style={baseStyle}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute -top-6 left-0 flex items-center">
          {editing ? (
            <input
              autoFocus
              className="el-control text-xs font-semibold text-slate-600 bg-white rounded px-1.5 py-0.5 border border-emerald-400 focus:outline-none"
              value={item.text ?? item.title}
              onChange={(e) => onTextChange(item.id, e.target.value)}
              onBlur={() => setEditing(false)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="el-control text-xs font-semibold text-slate-500 px-1 cursor-text"
              onDoubleClick={() => interactive && setEditing(true)}
            >
              {item.text || item.title || "Frame"}
            </span>
          )}
        </div>
        {removeBtn}
        {resizeHandle}
      </div>
    )
  }

  /* ------------------- Rectangle / Rounded / Ellipse --------------- */
  const shapeShape =
    item.type === "ellipse" ? "rounded-full" : item.type === "rounded" ? "rounded-2xl" : "rounded-md"

  return (
    <div
      data-canvas-card="true"
      className={`group absolute select-none border-2 border-emerald-500/70 bg-emerald-500/10 ${shapeShape} ${ring}`}
      style={baseStyle}
      onMouseDown={handleMouseDown}
    >
      {removeBtn}
      {resizeHandle}
    </div>
  )
}
