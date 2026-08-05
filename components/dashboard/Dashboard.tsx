"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, LayoutDashboard, RefreshCw } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import { navigateToModal } from "@/components/modals/ModalManager"
import {
  getReviewRequests,
  getCreatedReviews,
  getVerticalCards,
  getScheduleCard,
} from "@/lib/dashboardData"
import type { ReviewRequest, CreatedReview, VerticalCard } from "@/types/dashboard"
import type { ScheduleCardData } from "@/lib/dashboardData"
import ReviewCard from "./ReviewCard"
import { VerticalStatusCard, ScheduleStatusCard } from "./VerticalStatusCard"
import { EmptyState } from "./DashboardPrimitives"

interface DashboardData {
  requests: ReviewRequest[]
  created: CreatedReview[]
  verticals: VerticalCard[]
  schedule: ScheduleCardData
}

/** Section heading with a count chip. */
function SectionHeader({ title, count, hint }: { title: string; count?: number; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      {typeof count === "number" && (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
          {count}
        </span>
      )}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  )
}

export default function Dashboard() {
  const { state } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentUser = state.currentUser

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [data, setData] = useState<DashboardData | null>(null)
  const [reminded, setReminded] = useState<Record<string, boolean>>({})
  const [concluded, setConcluded] = useState<Record<string, boolean>>({})

  // Simulate an async load of the dashboard snapshot.
  const load = () => {
    setStatus("loading")
    const timer = setTimeout(() => {
      try {
        setData({
          requests: getReviewRequests(),
          created: getCreatedReviews(),
          verticals: getVerticalCards(currentProject),
          schedule: getScheduleCard(currentProject),
        })
        setStatus("ready")
      } catch {
        setStatus("error")
      }
    }, 450)
    return () => clearTimeout(timer)
  }

  useEffect(() => {
    const cleanup = load()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id])

  const openVertical = (route: string, filter?: string) => {
    navigateToModal(route, filter ? { dashboardFilter: filter } : undefined)
  }

  const handleSendReminder = (id: string) => setReminded((r) => ({ ...r, [id]: true }))
  const handleConclude = (id: string) => setConcluded((c) => ({ ...c, [id]: true }))

  const activeCreated = useMemo(
    () => (data?.created || []).filter((r) => !concluded[r.id]),
    [data, concluded],
  )

  const firstName = currentUser?.name?.split(" ")[0]

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-600">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          Project dashboard
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 text-balance sm:text-3xl">
          {currentProject?.name || "Untitled project"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {firstName ? `Welcome back, ${firstName}. ` : ""}
          Here&apos;s what needs your attention across the production.
        </p>
      </header>

      {status === "loading" && <DashboardSkeleton />}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-12 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-red-500" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-800">We couldn&apos;t load your dashboard</p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            Something went wrong while fetching your review sessions and project overview.
          </p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {status === "ready" && data && (
        <div className="space-y-10">
          {/* Review sections — two columns on wide screens, stacked on mobile */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <section aria-labelledby="requests-heading">
              <div id="requests-heading">
                <SectionHeader title="Reviews requiring your response" count={data.requests.length} />
              </div>
              {data.requests.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.requests.map((r) => (
                    <ReviewCard key={r.id} variant="request" review={r} onOpen={openVertical} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="You're all caught up"
                  description="No review sessions are waiting on your response right now."
                />
              )}
            </section>

            <section aria-labelledby="created-heading">
              <div id="created-heading">
                <SectionHeader title="Your review sessions" count={activeCreated.length} />
              </div>
              {activeCreated.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activeCreated.map((r) => (
                    <ReviewCard
                      key={r.id}
                      variant="created"
                      review={r}
                      onOpen={openVertical}
                      onSendReminder={handleSendReminder}
                      onConclude={handleConclude}
                      reminderSent={reminded[r.id]}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No active review sessions"
                  description="Review sessions you create will appear here so you can track responses."
                />
              )}
            </section>
          </div>

          {/* Project overview */}
          <section aria-labelledby="overview-heading">
            <div id="overview-heading">
              <SectionHeader title="Project overview" hint="Tap any number to open that view" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.verticals.map((card) => (
                <VerticalStatusCard key={card.id} card={card} onOpen={openVertical} />
              ))}
              <ScheduleStatusCard data={data.schedule} onOpen={openVertical} />
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

/** Skeleton placeholders while the snapshot loads. */
function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col}>
            <div className="mb-4 h-6 w-56 animate-pulse rounded bg-slate-200" />
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-4 h-6 w-44 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
