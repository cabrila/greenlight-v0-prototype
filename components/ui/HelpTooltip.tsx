"use client"

import { useState } from "react"
import { HelpCircle, X } from "lucide-react"

interface HelpTooltipProps {
  className?: string
}

export default function HelpTooltip({ className = "" }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const helpContent = {
    shortcuts: [
      { key: "Ctrl/Cmd + A", action: "Select all actors" },
      { key: "Ctrl/Cmd + Click", action: "Multi-select actors" },
      { key: "Shift + Click", action: "Select range of actors" },
      { key: "Delete", action: "Remove selected actors" },
      { key: "Escape", action: "Clear selection" },
    ],
    longListInfo: {
      title: "Long List View",
      description:
        "The main casting workspace where you can view, organize, and manage all actors for your project. Use the view controls to switch between different display modes and customize what information is shown on each actor card.",
      features: [
        "Add new actors individually or upload from CSV/Excel",
        "Search and filter actors by various criteria",
        "Switch between grid, detailed, and list view modes",
        "Customize card display settings",
        "Multi-select actors for batch operations",
      ],
    },
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 group"
        aria-label="Show help information"
        title="Selection shortcuts and view information"
      >
        <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Help & Shortcuts</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Close help"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selection Shortcuts */}
          <div className="mb-4">
            <h4 className="font-medium text-slate-700 mb-2 text-sm">Selection Shortcuts</h4>
            <div className="space-y-1">
              {helpContent.shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Long List Information */}
          <div>
            <h4 className="font-medium text-slate-700 mb-2 text-sm">{helpContent.longListInfo.title}</h4>
            <p className="text-xs text-slate-600 mb-2 leading-relaxed">{helpContent.longListInfo.description}</p>
            <ul className="space-y-1">
              {helpContent.longListInfo.features.map((feature, index) => (
                <li key={index} className="text-xs text-slate-600 flex items-start">
                  <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
