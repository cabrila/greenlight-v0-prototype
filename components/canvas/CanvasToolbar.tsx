"use client"

import { MousePointer2, Type, Image as ImageIcon, Group } from "lucide-react"

export type CanvasTool = "select" | "text" | "image"

interface ToolDef {
  key: CanvasTool
  label: string
  icon: typeof MousePointer2
}

const SELECT_TOOL: ToolDef = { key: "select", label: "Select / Move (V)", icon: MousePointer2 }

const CREATE_TOOLS: ToolDef[] = [
  { key: "text", label: "Text (T)", icon: Type },
  { key: "image", label: "Image (upload)", icon: ImageIcon },
]

interface CanvasToolbarProps {
  activeTool: CanvasTool
  onToolChange: (tool: CanvasTool) => void
  canGroup: boolean
  isGrouped: boolean
  onGroup: () => void
  onUngroup: () => void
}

export default function CanvasToolbar({
  activeTool, onToolChange, canGroup, isGrouped, onGroup, onUngroup,
}: CanvasToolbarProps) {
  const ToolButton = ({ def }: { def: ToolDef }) => {
    const Icon = def.icon
    const active = activeTool === def.key
    return (
      <button
        onClick={() => onToolChange(def.key)}
        title={def.label}
        aria-label={def.label}
        aria-pressed={active}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          active ? "bg-emerald-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.9} />
      </button>
    )
  }

  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 bg-white rounded-2xl shadow-lg border border-slate-200 p-1.5"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ToolButton def={SELECT_TOOL} />

      <span className="w-6 h-px bg-slate-200 my-1" />

      {CREATE_TOOLS.map((d) => <ToolButton key={d.key} def={d} />)}

      <span className="w-6 h-px bg-slate-200 my-1" />

      <button
        onClick={isGrouped ? onUngroup : onGroup}
        disabled={!canGroup && !isGrouped}
        title={isGrouped ? "Ungroup selection" : "Group selection"}
        aria-label={isGrouped ? "Ungroup selection" : "Group selection"}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          isGrouped
            ? "bg-emerald-50 text-emerald-600"
            : canGroup
              ? "text-slate-600 hover:bg-slate-100"
              : "text-slate-300 cursor-not-allowed"
        }`}
      >
        <Group className="w-5 h-5" strokeWidth={1.9} />
      </button>
    </div>
  )
}
