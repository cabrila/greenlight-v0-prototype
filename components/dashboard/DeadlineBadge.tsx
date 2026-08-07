"use client"

import { AlertTriangle, Clock, CalendarClock } from "lucide-react"
import { getDeadlineInfo } from "@/lib/dashboardData"

interface DeadlineBadgeProps {
  deadline: string
  className?: string
}

// Communicates urgency with color + icon + text (never color alone).
export default function DeadlineBadge({ deadline, className = "" }: DeadlineBadgeProps) {
  const { tone, label } = getDeadlineInfo(deadline)

  const styles: Record<string, { wrap: string; Icon: typeof Clock }> = {
    overdue: { wrap: "bg-red-50 text-red-700 border-red-200", Icon: AlertTriangle },
    today: { wrap: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
    soon: { wrap: "bg-slate-100 text-slate-700 border-slate-200", Icon: CalendarClock },
    later: { wrap: "bg-slate-100 text-slate-600 border-slate-200", Icon: CalendarClock },
  }

  const { wrap, Icon } = styles[tone]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${wrap} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
