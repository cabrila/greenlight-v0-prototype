"use client"

import { MousePointer2, Hand, Frame, Type, Square, Circle, Image as ImageIcon, Squircle, Group } from "lucide-react"

export type CanvasTool =
  | "select" | "pan" | "frame" | "text" | "rectangle" | "ellipse" | "image" | "rounded"

interface ToolDef {
  key: CanvasTool
  label: string
  icon: typeof MousePointer2
}

const GROUP_A: ToolDef[] = [
  { key: "select", label: "Select / Move (V)", icon: MousePointer2 },
  { key: "pan", label: "Hand / Pan (H)", icon: Hand },
]

const GROUP_B: ToolDef[] = [
  { key: "frame", label: "Frame (F)", icon: Frame },
  { key: "text", label: "Text (T)", icon: Type },
  { key: "rectangle", label: "Rectangle (R)", icon: Square },
  { key: "ellipse", label: "Ellipse (O)", icon: Circle },
  { key: "image", label: "Image", icon: ImageIcon },
  { key: "rounded", label: "Rounded rectangle", icon: Squircle },
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
      {GROUP_A.map((d) => <ToolButton key={d.key} def={d} />)}

      <span className="w-6 h-px bg-slate-200 my-1" />

      {GROUP_B.map((d) => <ToolButton key={d.key} def={d} />)}

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
