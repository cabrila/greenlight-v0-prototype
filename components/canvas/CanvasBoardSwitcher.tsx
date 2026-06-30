"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Plus, Check, Pencil } from "lucide-react"

export interface CanvasBoard {
  id: string
  name: string
}

interface CanvasBoardSwitcherProps {
  boards: CanvasBoard[]
  activeBoardId: string
  onSwitch: (id: string) => void
  onAdd: () => void
  onRename: (id: string, name: string) => void
}

export default function CanvasBoardSwitcher({
  boards,
  activeBoardId,
  onSwitch,
  onAdd,
  onRename,
}: CanvasBoardSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeIndex = Math.max(0, boards.findIndex((b) => b.id === activeBoardId))
  const activeBoard = boards[activeIndex] || boards[0]

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setEditingId(null)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const startEditing = (board: CanvasBoard) => {
    setEditingId(board.id)
    setDraftName(board.name)
  }

  const commitEditing = () => {
    if (editingId) {
      const name = draftName.trim()
      if (name) onRename(editingId, name)
    }
    setEditingId(null)
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-colors ${
          open ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
        title="Switch board"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold tabular-nums">
          {activeIndex + 1}
        </span>
        <span className="text-sm font-medium text-slate-800 max-w-[160px] truncate">
          {activeBoard?.name || "Board 1"}
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-72 rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">Pages</span>
            <button
              type="button"
              onClick={onAdd}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Add board"
              aria-label="Add board"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Board list */}
          <div className="p-2 max-h-72 overflow-y-auto">
            {boards.map((board) => {
              const isActive = board.id === activeBoardId
              const isEditing = editingId === board.id
              return (
                <div
                  key={board.id}
                  className={`group flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    if (isEditing) return
                    onSwitch(board.id)
                    setOpen(false)
                  }}
                >
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                      isActive ? "bg-white border border-emerald-200" : "bg-slate-100"
                    }`}
                  >
                    <ImagePlus className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
                  </span>

                  {isEditing ? (
                    <input
                      ref={inputRef}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={commitEditing}
                      onKeyDown={(e) => {
                        if (e.nativeEvent.isComposing || e.keyCode === 229) return
                        if (e.key === "Enter") commitEditing()
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      className="flex-1 min-w-0 text-sm font-semibold text-slate-800 bg-white border border-emerald-300 rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  ) : (
                    <span
                      className="flex-1 min-w-0 text-sm font-semibold text-slate-800 truncate"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startEditing(board)
                      }}
                    >
                      {board.name}
                    </span>
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(board)
                      }}
                      className="p-1 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-600 transition-all"
                      title="Rename board"
                      aria-label="Rename board"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isActive && !isEditing && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
