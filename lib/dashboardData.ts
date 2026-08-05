import type { Project } from "@/types/casting"
import type { ReviewRequest, CreatedReview, VerticalCard, ReviewStatus } from "@/types/dashboard"

// --- deadline helpers -------------------------------------------------------

/** Return an ISO date string offset from today by `days` (can be negative). */
function daysFromNow(days: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Classify a deadline into overdue / due today / upcoming. */
export function classifyDeadline(deadline: string): ReviewStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < 0) return "overdue"
  if (diff === 0) return "dueToday"
  return "upcoming"
}

/** Human friendly relative deadline label, e.g. "Deadline today", "Deadline in 4 days". */
export function formatDeadline(deadline: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (diff < -1) return `${Math.abs(diff)} days overdue`
  if (diff === -1) return "1 day overdue"
  if (diff === 0) return "Deadline today"
  if (diff === 1) return "Deadline tomorrow"
  if (diff < 7) return `Deadline in ${diff} days`
  const weekday = due.toLocaleDateString("en-US", { weekday: "long" })
  return `Deadline ${weekday}`
}

/** Sort order for review requests: overdue → due today → nearest upcoming → most recent. */
const STATUS_WEIGHT: Record<ReviewStatus, number> = { overdue: 0, dueToday: 1, upcoming: 2 }

export function sortByPriority<T extends { deadline: string; status: ReviewStatus }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (STATUS_WEIGHT[a.status] !== STATUS_WEIGHT[b.status]) {
      return STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]
    }
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })
}

// --- mock review sessions ---------------------------------------------------

const rawRequests: Omit<ReviewRequest, "status">[] = [
  {
    id: "req-1",
    title: "Longlist review",
    subjectName: "Allan Grant — Lead Character",
    vertical: "characters",
    verticalLabel: "Casting",
    createdBy: "Karin Jagd",
    deadline: daysFromNow(1),
    totalParticipants: 7,
    respondedParticipants: 5,
    currentUserHasResponded: false,
    actionLabel: "Review candidates",
    route: "casting",
  },
  {
    id: "req-2",
    title: "Hospital location review",
    subjectName: "Hospital interior",
    vertical: "locations",
    verticalLabel: "Locations",
    createdBy: "Thomas Berg",
    deadline: daysFromNow(0),
    totalParticipants: 5,
    respondedParticipants: 3,
    currentUserHasResponded: false,
    actionLabel: "Review locations",
    route: "locations",
  },
  {
    id: "req-3",
    title: "Costume concepts",
    subjectName: "Mikkel",
    vertical: "costumes",
    verticalLabel: "Costumes & Makeup",
    createdBy: "Sofie Jensen",
    deadline: daysFromNow(4),
    totalParticipants: 6,
    respondedParticipants: 4,
    currentUserHasResponded: false,
    actionLabel: "Review concepts",
    route: "costumes",
  },
]

const rawCreated: Omit<CreatedReview, "status">[] = [
  {
    id: "cre-1",
    title: "Costume concepts",
    subjectName: "Allan Grant",
    vertical: "costumes",
    verticalLabel: "Costumes & Makeup",
    deadline: daysFromNow(3),
    totalParticipants: 8,
    respondedParticipants: 6,
    missingParticipants: ["Lars Holm", "Sofie Berg"],
    allResponsesReceived: false,
    canConclude: false,
    route: "costumes",
  },
  {
    id: "cre-2",
    title: "Office locations",
    subjectName: "Office interior",
    vertical: "locations",
    verticalLabel: "Locations",
    deadline: daysFromNow(2),
    totalParticipants: 5,
    respondedParticipants: 5,
    missingParticipants: [],
    allResponsesReceived: true,
    canConclude: true,
    route: "locations",
  },
]

export function getReviewRequests(): ReviewRequest[] {
  const withStatus = rawRequests
    .filter((r) => !r.currentUserHasResponded) // answered reviews drop out of this section
    .map((r) => ({ ...r, status: classifyDeadline(r.deadline) }))
  return sortByPriority(withStatus)
}

export function getCreatedReviews(): CreatedReview[] {
  const withStatus = rawCreated.map((r) => ({ ...r, status: classifyDeadline(r.deadline) }))
  return sortByPriority(withStatus)
}

// --- vertical overview ------------------------------------------------------

/**
 * Build the vertical status cards. Totals are derived from real project data
 * where the datamodel makes it cheap; the in-progress / greenlit / review
 * breakdowns use representative mock values for the prototype.
 */
export function getVerticalCards(project?: Project | null): VerticalCard[] {
  const characterCount = project?.characters?.length
  const locationCount =
    project?.locationInventory?.length || project?.locations?.length

  return [
    {
      id: "characters",
      name: "Characters & Casting",
      totalLabel: "characters",
      totalCount: characterCount || 24,
      activeReviewCount: 3,
      route: "casting",
      metrics: [
        { label: "casting in progress", count: 8, filter: "in-progress", tone: "progress" },
        { label: "greenlit", count: 10, filter: "greenlit", tone: "greenlit" },
        { label: "active reviews", count: 3, filter: "reviews", tone: "review" },
      ],
    },
    {
      id: "locations",
      name: "Locations",
      totalLabel: "locations",
      totalCount: locationCount || 16,
      activeReviewCount: 2,
      route: "locations",
      metrics: [
        { label: "scoutings in progress", count: 6, filter: "in-progress", tone: "progress" },
        { label: "greenlit", count: 7, filter: "greenlit", tone: "greenlit" },
        { label: "active reviews", count: 2, filter: "reviews", tone: "review" },
      ],
    },
    {
      id: "costumes",
      name: "Costumes & Makeup",
      totalLabel: "looks",
      totalCount: 42,
      activeReviewCount: 4,
      route: "costumes",
      metrics: [
        { label: "in progress", count: 18, filter: "in-progress", tone: "progress" },
        { label: "greenlit", count: 14, filter: "greenlit", tone: "greenlit" },
        { label: "active reviews", count: 4, filter: "reviews", tone: "review" },
      ],
    },
    {
      id: "props",
      name: "Props",
      totalLabel: "props",
      totalCount: 63,
      activeReviewCount: 5,
      route: "props",
      metrics: [
        { label: "in progress", count: 21, filter: "in-progress", tone: "progress" },
        { label: "greenlit", count: 34, filter: "greenlit", tone: "greenlit" },
        { label: "active reviews", count: 5, filter: "reviews", tone: "review" },
      ],
    },
  ]
}

/** Schedule uses its own counting model (scenes / scheduled / unscheduled). */
export interface ScheduleCardData {
  totalScenes: number
  scheduledScenes: number
  unscheduledScenes: number
  activeReviewCount: number
  route: string
}

export function getScheduleCard(_project?: Project | null): ScheduleCardData {
  return {
    totalScenes: 84,
    scheduledScenes: 66,
    unscheduledScenes: 18,
    activeReviewCount: 2,
    route: "schedule",
  }
}
