"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Bell, AlertCircle, LayoutDashboard } from "lucide-react"
import { useCasting } from "@/components/casting/CastingContext"
import FloatingSidebar from "@/components/layout/FloatingSidebar"
import ModalHeader from "@/components/layout/ModalHeader"
import { navigateToModal } from "./ModalManager"
import ReviewRequestSection from "@/components/dashboard/ReviewRequestSection"
import CreatedReviewSection from "@/components/dashboard/CreatedReviewSection"
import VerticalOverviewGrid from "@/components/dashboard/VerticalOverviewGrid"
import type { VerticalFilter } from "@/components/dashboard/VerticalStatusCard"
import {
  mockReviewRequests,
  mockCreatedReviews,
  mockVerticalCards,
  mockScheduleCard,
  type ReviewRequest,
  type CreatedReview,
} from "@/lib/dashboardData"

interface DashboardModalProps {
  onClose: () => void
}

type LoadStatus = "loading" | "ready" | "error"

export default function DashboardModal({ onClose }: DashboardModalProps) {
  const { state } = useCasting()
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const firstName = state.currentUser?.name?.split(" ")[0] || "there"

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [status, setStatus] = useState<LoadStatus>("loading")

  // Live-ish state so actions have real, visible effects in the prototype.
  const [createdReviews, setCreatedReviews] = useState<CreatedReview[]>([])
  const [reminderState, setReminderState] = useState<Record<string, "sending" | "sent" | undefined>>({})
  const [toast, setToast] = useState<{ tone: "success" | "info"; message: string } | null>(null)

  // Simulate a realistic initial load of dashboard data.
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      try {
        setCreatedReviews(mockCreatedReviews)
        setStatus("ready")
      } catch {
        setStatus("error")
      }
    }, 550)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // Auto-dismiss toast.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const openReviewSession = (vertical: string) => {
    // A review's detailed responses live in the vertical's own view.
    navigateToModal(vertical)
  }

  const handleRequestOpen = (review: ReviewRequest) => openReviewSession(review.vertical === "characters" ? "casting" : review.vertical)
  const handleRequestAction = (review: ReviewRequest) => openReviewSession(review.vertical === "characters" ? "casting" : review.vertical)

  const handleCreatedOpen = (review: CreatedReview) =>
    openReviewSession(review.vertical === "characters" ? "casting" : review.vertical)

  const handleSendReminder = (review: CreatedReview) => {
    setReminderState((prev) => ({ ...prev, [review.id]: "sending" }))
    setTimeout(() => {
      setReminderState((prev) => ({ ...prev, [review.id]: "sent" }))
      const names = review.missingParticipants.map((m) => m.name).join(" and ")
      setToast({ tone: "info", message: `Reminder sent to ${names || "remaining participants"}.` })
    }, 900)
  }

  const handleConclude = (review: CreatedReview) => {
    setCreatedReviews((prev) => prev.filter((r) => r.id !== review.id))
    setToast({ tone: "success", message: `"${review.title}" has been concluded.` })
  }

  const handleOpenRoute = (route: string) => navigateToModal(route)
  const handleFilterRoute = (route: string, _filter: VerticalFilter) => {
    // Numbers act as filters into the vertical. Deep-link filters can be wired
    // per-vertical later; for now we open the relevant vertical view.
    navigateToModal(route)
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col z-50 pl-14">
      <FloatingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentModal="dashboard"
      />

      <ModalHeader title="Dashboard" titleColor="bg-emerald-600" onClose={onClose} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-5 sm:px-8 py-6 sm:py-8">
          {/* Project header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 text-emerald-700 mb-1.5">
              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-widest">Project Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 text-balance">
              {currentProject?.name || "Untitled Project"}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Welcome back, {firstName}. Here&apos;s what needs your attention.
            </p>
          </header>

          {status === "loading" && <DashboardSkeleton />}

          {status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 flex flex-col items-center text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" aria-hidden="true" />
              <p className="text-sm font-semibold text-red-800">Couldn&apos;t load the dashboard</p>
              <p className="text-xs text-red-600 mt-1">Please try reopening the project.</p>
            </div>
          )}

          {status === "ready" && (
            <div className="space-y-10">
              {/* Reviews: two columns on wide screens, stacked on mobile */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-6">
                <ReviewRequestSection
                  reviews={mockReviewRequests}
                  onOpen={handleRequestOpen}
                  onAction={handleRequestAction}
                />
                <CreatedReviewSection
                  reviews={createdReviews}
                  reminderState={reminderState}
                  onOpen={handleCreatedOpen}
                  onSendReminder={handleSendReminder}
                  onConclude={handleConclude}
                />
              </div>

              <VerticalOverviewGrid
                cards={mockVerticalCards}
                scheduleCard={mockScheduleCard}
                onOpenRoute={handleOpenRoute}
                onFilterRoute={handleFilterRoute}
              />
            </div>
          )}
        </div>
      </div>

      {/* Toast feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          ) : (
            <Bell className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse" aria-hidden="true">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-6">
        {[0, 1].map((col) => (
          <div key={col}>
            <div className="h-5 w-56 bg-slate-200 rounded mb-4" />
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-32 rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    </div>
  )
}
