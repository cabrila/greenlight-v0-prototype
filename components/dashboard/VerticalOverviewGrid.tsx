"use client"

import { LayoutGrid } from "lucide-react"
import type { VerticalCard, ScheduleCard } from "@/lib/dashboardData"
import VerticalStatusCard, { type VerticalFilter } from "./VerticalStatusCard"
import ScheduleStatusCard from "./ScheduleStatusCard"

interface VerticalOverviewGridProps {
  cards: VerticalCard[]
  scheduleCard: ScheduleCard
  onOpenRoute: (route: string) => void
  onFilterRoute: (route: string, filter: VerticalFilter) => void
}

export default function VerticalOverviewGrid({
  cards,
  scheduleCard,
  onOpenRoute,
  onFilterRoute,
}: VerticalOverviewGridProps) {
  return (
    <section aria-labelledby="overview-heading">
      <div className="flex items-center gap-2.5 mb-4">
        <LayoutGrid className="w-5 h-5 text-slate-400" aria-hidden="true" />
        <h2 id="overview-heading" className="text-base font-semibold text-slate-900">
          Project overview
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <VerticalStatusCard
            key={card.id}
            card={card}
            onOpen={(c) => onOpenRoute(c.route)}
            onFilter={(c, f) => onFilterRoute(c.route, f)}
          />
        ))}
        <ScheduleStatusCard card={scheduleCard} onOpen={onOpenRoute} onFilter={onFilterRoute} />
      </div>
    </section>
  )
}
