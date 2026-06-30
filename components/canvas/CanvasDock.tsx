"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, GalleryHorizontalEnd, X } from "lucide-react"
import CanvasChatbot from "./CanvasChatbot"
import CanvasTimeline from "./CanvasTimeline"

interface CanvasDockProps {
  timelineEnabled: boolean
  timelineData: Record<string, any>
  onTimelineDataChange: (data: Record<string, any>) => void
  onCloseTimeline: () => void
}

type DockTab = "timeline" | "chat"

/** Brand mark used for the Creative Go-Pilot tab/title. */
function GoPilotMark() {
  return (
    <span className="relative inline-flex w-5 h-5 shrink-0" aria-hidden="true">
      <span className="absolute left-0 top-0 w-3 h-3 rounded-[4px] bg-emerald-500" />
      <span className="absolute right-0 bottom-0 w-3 h-3 rounded-[4px] border-2 border-emerald-500 bg-white" />
    </span>
  )
}

/**
 * Bottom-docked panel for the canvas. When the Editing Timeline is enabled it
 * becomes a full-width bar with two tabs (Editing Timeline + Creative Go-Pilot);
 * otherwise it shows the Creative Go-Pilot chat as a compact centered panel.
 * Collapsible in both modes.
 */
export default function CanvasDock({
  timelineEnabled,
  timelineData,
  onTimelineDataChange,
  onCloseTimeline,
}: CanvasDockProps) {
  const [activeTab, setActiveTab] = useState<DockTab>("timeline")
  const [collapsed, setCollapsed] = useState(false)

  // When the timeline is turned on, surface it and make sure the dock is open.
  useEffect(() => {
    if (timelineEnabled) {
      setActiveTab("timeline")
      setCollapsed(false)
    } else {
      setActiveTab("chat")
    }
  }, [timelineEnabled])

  /* -------- Compact mode: chat only (no timeline) -------- */
  if (!timelineEnabled) {
    return (
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-20 w-full max-w-2xl px-4">
        <div className="overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
          <div className="h-1.5 bg-emerald-500" />
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand Creative Go-Pilot" : "Collapse Creative Go-Pilot"}
          >
            <div className="flex items-center gap-2.5">
              <GoPilotMark />
              <span className="text-base font-bold text-slate-800">Creative Go-Pilot</span>
            </div>
            {collapsed ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {!collapsed && <CanvasChatbot />}
        </div>
      </div>
    )
  }

  /* -------- Full mode: tabbed dock (timeline + chat) -------- */
  return (
    <div className="absolute left-0 right-0 bottom-0 z-20 pl-20 pr-4">
      <div className="overflow-hidden rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)]">
        <div className="h-1.5 bg-emerald-500" />

        {/* Tab strip */}
        <div className="flex items-center gap-1 px-2 border-b border-slate-100 bg-slate-50/60">
          <DockTabButton
            active={activeTab === "timeline"}
            onClick={() => { setActiveTab("timeline"); setCollapsed(false) }}
            icon={<GalleryHorizontalEnd className="w-4 h-4" />}
            label="Editing Timeline"
          />
          <DockTabButton
            active={activeTab === "chat"}
            onClick={() => { setActiveTab("chat"); setCollapsed(false) }}
            icon={<GoPilotMark />}
            label="Creative Go-Pilot"
          />

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand panel" : "Collapse panel"}
            >
              {collapsed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onCloseTimeline}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Remove Editing Timeline"
              aria-label="Remove Editing Timeline"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div className={activeTab === "timeline" ? "h-[340px]" : ""}>
            {activeTab === "timeline" ? (
              <CanvasTimeline data={timelineData} onChange={onTimelineDataChange} />
            ) : (
              <CanvasChatbot />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DockTabButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition-colors ${
        active
          ? "border-emerald-500 text-slate-800 bg-white"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/70"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {icon}
      {label}
    </button>
  )
}
