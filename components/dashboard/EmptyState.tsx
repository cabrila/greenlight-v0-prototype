"use client"

import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 flex flex-col items-center text-center">
      <span className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs text-pretty">{description}</p>
    </div>
  )
}
