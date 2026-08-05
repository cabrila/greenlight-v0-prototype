"use client"

import { CheckCircle2 } from "lucide-react"
import type { Participant } from "@/lib/dashboardData"

interface MissingParticipantsProps {
  missing: Participant[]
  allResponsesReceived: boolean
}

function formatNames(names: string[]): string {
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
}

// Shows WHO still needs to respond — more actionable than a full roster.
export default function MissingParticipants({ missing, allResponsesReceived }: MissingParticipantsProps) {
  if (allResponsesReceived) {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>All responses received</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-slate-500">Waiting on</span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {missing.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-slate-100 border border-slate-200"
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            >
              {p.name.charAt(0)}
            </span>
            <span className="text-[11px] font-medium text-slate-700">{p.name}</span>
          </span>
        ))}
      </div>
      <span className="sr-only">Still waiting on: {formatNames(missing.map((m) => m.name))}</span>
    </div>
  )
}
