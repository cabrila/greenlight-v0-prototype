"use client"

import type { LucideIcon } from "lucide-react"
import { Users, MapPin, Shirt, Package, CalendarRange, ArrowRight, Sparkles } from "lucide-react"
import type { VerticalCard, VerticalId, VerticalMetric } from "@/types/dashboard"
import type { ScheduleCardData } from "@/lib/dashboardData"

const ICONS: Record<VerticalId, LucideIcon> = {
  characters: Users,
  actors: Users,
  locations: MapPin,
  costumes: Shirt,
  props: Package,
  schedule: CalendarRange,
}

const TONE_TEXT: Record<NonNullable<VerticalMetric["tone"]>, string> = {
  default: "text-slate-900",
  progress: "text-slate-900",
  greenlit: "text-emerald-600",
  review: "text-indigo-600",
  warning: "text-amber-600",
}

/** A single clickable metric: a big number over a small label. */
function Metric({
  count,
  label,
  tone = "default",
  onClick,
}: {
  count: number
  label: string
  tone?: VerticalMetric["tone"]
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group/metric flex flex-col items-start rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <span className={`text-xl font-semibold tabular-nums ${TONE_TEXT[tone ?? "default"]}`}>{count}</span>
      <span className="text-[11px] leading-tight text-slate-500 group-hover/metric:text-slate-700">{label}</span>
    </button>
  )
}

interface CardShellProps {
  id: VerticalId
  name: string
  totalCount: number
  totalLabel: string
  children: React.ReactNode
  onOpen: () => void
  hasUpdates?: boolean
  updateCount?: number
}

function CardShell({ id, name, totalCount, totalLabel, children, onOpen, hasUpdates, updateCount }: CardShellProps) {
  const Icon = ICONS[id]
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        hasUpdates ? "border-emerald-300 ring-1 ring-emerald-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${
              hasUpdates ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {hasUpdates && (
              <span className="absolute -right-1 -top-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </span>
            )}
          </span>
          <div>
            <button
              onClick={onOpen}
              className="rounded text-left text-sm font-semibold text-slate-900 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {name}
            </button>
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-700 tabular-nums">{totalCount}</span> {totalLabel}
            </p>
          </div>
        </div>

        {hasUpdates && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {updateCount && updateCount > 0 ? (
              <>
                {updateCount} new<span className="sr-only"> updates</span>
              </>
            ) : (
              "Updated"
            )}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 border-t border-slate-100 pt-3">{children}</div>

      <button
        onClick={onOpen}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        Open {name.toLowerCase()}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </article>
  )
}

export function VerticalStatusCard({
  card,
  onOpen,
}: {
  card: VerticalCard
  onOpen: (route: string, filter?: string) => void
}) {
  return (
    <CardShell
      id={card.id}
      name={card.name}
      totalCount={card.totalCount}
      totalLabel={card.totalLabel}
      hasUpdates={card.hasUpdates}
      updateCount={card.updateCount}
      onOpen={() => onOpen(card.route)}
    >
      {card.metrics.map((m) => (
        <Metric
          key={m.label}
          count={m.count}
          label={m.label}
          tone={m.tone}
          onClick={() => onOpen(card.route, m.filter)}
        />
      ))}
    </CardShell>
  )
}

export function ScheduleStatusCard({
  data,
  onOpen,
}: {
  data: ScheduleCardData
  onOpen: (route: string, filter?: string) => void
}) {
  return (
    <CardShell
      id="schedule"
      name="Schedule"
      totalCount={data.totalScenes}
      totalLabel="scenes"
      onOpen={() => onOpen(data.route)}
    >
      <Metric count={data.scheduledScenes} label="scheduled" tone="greenlit" onClick={() => onOpen(data.route, "scheduled")} />
      <Metric count={data.unscheduledScenes} label="unscheduled" tone="warning" onClick={() => onOpen(data.route, "unscheduled")} />
      <Metric count={data.activeReviewCount} label="active reviews" tone="review" onClick={() => onOpen(data.route, "reviews")} />
    </CardShell>
  )
}
