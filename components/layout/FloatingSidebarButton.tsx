"use client"

import { Menu } from "lucide-react"

interface FloatingSidebarButtonProps {
  onClick: () => void
  isOpen?: boolean
}

export default function FloatingSidebarButton({ onClick, isOpen = false }: FloatingSidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed left-4 top-1/2 -translate-y-1/2 z-[60] p-3 bg-white shadow-lg rounded-xl border border-slate-200/50 transition-all duration-200 hover:shadow-xl hover:bg-slate-50 group ${
        isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Open navigation menu"
      title="Navigation"
    >
      <Menu className="w-5 h-5 text-slate-600 group-hover:text-emerald-600 transition-colors" />
    </button>
  )
}
