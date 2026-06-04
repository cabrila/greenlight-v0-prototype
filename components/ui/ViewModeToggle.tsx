"use client"

import { LayoutGrid, List, AlignJustify } from "lucide-react"

export type ViewMode = "full" | "minimal" | "list"

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

export default function ViewModeToggle({ viewMode, onChange, className = "" }: ViewModeToggleProps) {
  return (
    <div className={`flex items-center bg-white/5 rounded-lg p-0.5 ${className}`}>
      <button
        onClick={() => onChange("full")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-sans transition-all ${
          viewMode === "full"
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
        title="Full View"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Full</span>
      </button>
      <button
        onClick={() => onChange("minimal")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-sans transition-all ${
          viewMode === "minimal"
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
        title="Minimal View"
      >
        <AlignJustify className="w-4 h-4" />
        <span className="hidden sm:inline">Minimal</span>
      </button>
      <button
        onClick={() => onChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-sans transition-all ${
          viewMode === "list"
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
        title="List View"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
    </div>
  )
}
