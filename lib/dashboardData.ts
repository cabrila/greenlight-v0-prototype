// Data model + realistic mock data for the GoGreenlight project Dashboard.
//
// The dashboard answers four questions at a glance:
//   1. Which reviews require MY response?
//   2. Which reviews am I responsible for following up on?
//   3. How many items are in progress / greenlit / under review per vertical?
//   4. Where do I click to dig deeper?

export type VerticalKey =
  | "characters"
  | "locations"
  | "costumes"
  | "props"
  | "schedule"

// Which modal each vertical opens (matches ModalManager modal keys).
export const VERTICAL_ROUTE: Record<VerticalKey, string> = {
  characters: "casting",
  locations: "locations",
  costumes: "costumes",
  props: "props",
  schedule: "schedule",
}

export type DeadlineTone = "overdue" | "today" | "soon" | "later"

export interface Participant {
  id: string
  name: string
  color: string
}

// A review the current user has been invited to and must respond to.
export interface ReviewRequest {
  id: string
  title: string
  subjectName: string
  vertical: VerticalKey
  verticalLabel: string
  createdBy: string
  /** ISO date string for the deadline. */
  deadline: string
  totalParticipants: number
  respondedParticipants: number
  currentUserHasResponded: boolean
  status: "open" | "responded"
  actionLabel: string
}

// A review the current user created and is responsible for following up on.
export interface CreatedReview {
  id: string
  title: string
  subjectName: string
  vertical: VerticalKey
  verticalLabel: string
  deadline: string
  totalParticipants: number
  respondedParticipants: number
  missingParticipants: Participant[]
  allResponsesReceived: boolean
  canConclude: boolean
}

// A compact status card for a product vertical.
export interface VerticalCard {
  id: VerticalKey
  name: string
  totalLabel: string
  totalCount: number
  progressLabel: string
  progressCount: number
  greenlitLabel: string
  greenlitCount: number
  activeReviewCount: number
  route: string
  /** True when this vertical has new activity since the user last viewed it. */
  hasUpdates?: boolean
}

// Schedule follows a slightly different counting model.
export interface ScheduleCard {
  id: "schedule"
  name: string
  totalScenes: number
  scheduledScenes: number
  /** Either unscheduled scenes or conflicts, depending on the emphasis. */
  secondaryLabel: string
  secondaryCount: number
  secondaryTone: "neutral" | "warning"
  activeReviewCount: number
  route: string
}

// --- Deadline helpers -------------------------------------------------------

/** Returns a date offset from "today" (local midnight) by n days, ISO string. */
function dayOffset(n: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export function getDeadlineInfo(iso: string): {
  tone: DeadlineTone
  label: string
  daysDiff: number
} {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const deadline = new Date(iso)
  deadline.setHours(0, 0, 0, 0)
  const msPerDay = 1000 * 60 * 60 * 24
  const daysDiff = Math.round((deadline.getTime() - now.getTime()) / msPerDay)

  if (daysDiff < 0) {
    const n = Math.abs(daysDiff)
    return { tone: "overdue", label: n === 1 ? "Overdue by 1 day" : `Overdue by ${n} days`, daysDiff }
  }
  if (daysDiff === 0) return { tone: "today", label: "Due today", daysDiff }
  if (daysDiff === 1) return { tone: "soon", label: "Due tomorrow", daysDiff }
  if (daysDiff <= 4) return { tone: "soon", label: `Due in ${daysDiff} days`, daysDiff }

  const weekday = deadline.toLocaleDateString("en-US", { weekday: "long" })
  return { tone: "later", label: `Due ${weekday}`, daysDiff }
}

/** Sort order: overdue -> today -> nearest upcoming -> latest created. */
export function sortReviewRequests(requests: ReviewRequest[]): ReviewRequest[] {
  return [...requests].sort((a, b) => {
    const da = getDeadlineInfo(a.deadline).daysDiff
    const db = getDeadlineInfo(b.deadline).daysDiff
    return da - db
  })
}

// --- Mock data --------------------------------------------------------------

export const mockReviewRequests: ReviewRequest[] = [
  {
    id: "rr-1",
    title: "Hospital location review",
    subjectName: "Hospital interior",
    vertical: "locations",
    verticalLabel: "Locations",
    createdBy: "Thomas Berg",
    deadline: dayOffset(0), // today
    totalParticipants: 5,
    respondedParticipants: 3,
    currentUserHasResponded: false,
    status: "open",
    actionLabel: "Review locations",
  },
  {
    id: "rr-2",
    title: "Longlist review — Allan Grant",
    subjectName: "Lead Character Casting",
    vertical: "characters",
    verticalLabel: "Characters & Casting",
    createdBy: "Karin Jagd",
    deadline: dayOffset(1), // tomorrow
    totalParticipants: 7,
    respondedParticipants: 5,
    currentUserHasResponded: false,
    status: "open",
    actionLabel: "Review candidates",
  },
  {
    id: "rr-3",
    title: "Costume concepts — Mikkel",
    subjectName: "Detective wardrobe looks",
    vertical: "costumes",
    verticalLabel: "Costumes & Makeup",
    createdBy: "Sofie Jensen",
    deadline: dayOffset(4), // in four days
    totalParticipants: 6,
    respondedParticipants: 4,
    currentUserHasResponded: false,
    status: "open",
    actionLabel: "Review looks",
  },
]

export const mockCreatedReviews: CreatedReview[] = [
  {
    id: "cr-1",
    title: "Costume concepts — Allan Grant",
    subjectName: "Lead wardrobe looks",
    vertical: "costumes",
    verticalLabel: "Costumes & Makeup",
    deadline: dayOffset(3), // Friday-ish
    totalParticipants: 8,
    respondedParticipants: 6,
    missingParticipants: [
      { id: "u-lars", name: "Lars Holm", color: "#6366f1" },
      { id: "u-sofie", name: "Sofie Berg", color: "#ec4899" },
    ],
    allResponsesReceived: false,
    canConclude: false,
  },
  {
    id: "cr-2",
    title: "Office locations",
    subjectName: "Office exterior & interior",
    vertical: "locations",
    verticalLabel: "Locations",
    deadline: dayOffset(-1), // overdue but complete
    totalParticipants: 5,
    respondedParticipants: 5,
    missingParticipants: [],
    allResponsesReceived: true,
    canConclude: true,
  },
]

export const mockVerticalCards: VerticalCard[] = [
  {
    id: "characters",
    name: "Characters & Casting",
    totalLabel: "characters",
    totalCount: 24,
    progressLabel: "casting in progress",
    progressCount: 8,
    greenlitLabel: "greenlit",
    greenlitCount: 10,
    activeReviewCount: 3,
    route: VERTICAL_ROUTE.characters,
    hasUpdates: true,
  },
  {
    id: "locations",
    name: "Locations",
    totalLabel: "locations",
    totalCount: 16,
    progressLabel: "scoutings in progress",
    progressCount: 6,
    greenlitLabel: "greenlit",
    greenlitCount: 7,
    activeReviewCount: 2,
    route: VERTICAL_ROUTE.locations,
  },
  {
    id: "costumes",
    name: "Costumes & Makeup",
    totalLabel: "looks",
    totalCount: 42,
    progressLabel: "in progress",
    progressCount: 18,
    greenlitLabel: "greenlit",
    greenlitCount: 14,
    activeReviewCount: 4,
    route: VERTICAL_ROUTE.costumes,
  },
  {
    id: "props",
    name: "Props",
    totalLabel: "props",
    totalCount: 63,
    progressLabel: "in progress",
    progressCount: 21,
    greenlitLabel: "greenlit",
    greenlitCount: 34,
    activeReviewCount: 5,
    route: VERTICAL_ROUTE.props,
    hasUpdates: true,
  },
]

export const mockScheduleCard: ScheduleCard = {
  id: "schedule",
  name: "Schedule",
  totalScenes: 84,
  scheduledScenes: 66,
  secondaryLabel: "unscheduled",
  secondaryCount: 18,
  secondaryTone: "warning",
  activeReviewCount: 2,
  route: VERTICAL_ROUTE.schedule,
}
