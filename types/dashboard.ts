// Types for the GoGreenlight project Dashboard.
// Review Sessions are asynchronous, deadline-driven collaboration units — not calendar events.

export type VerticalId =
  | "characters"
  | "actors"
  | "locations"
  | "costumes"
  | "props"
  | "schedule"

export type ReviewStatus = "overdue" | "dueToday" | "upcoming"

/** A review another user invited the current user to respond to. */
export interface ReviewRequest {
  id: string
  title: string
  subjectName: string // the element being assessed, e.g. "Allan Grant"
  vertical: VerticalId
  verticalLabel: string
  createdBy: string // name of the user who created the review
  deadline: string // ISO date string
  totalParticipants: number
  respondedParticipants: number
  currentUserHasResponded: boolean
  status: ReviewStatus
  actionLabel: string // contextual CTA, e.g. "Review candidates"
  /** Modal route the action opens. */
  route: string
}

/** A review the current user created and is responsible for following up on. */
export interface CreatedReview {
  id: string
  title: string
  subjectName: string
  vertical: VerticalId
  verticalLabel: string
  deadline: string
  totalParticipants: number
  respondedParticipants: number
  missingParticipants: string[] // names of people who still owe a response
  allResponsesReceived: boolean
  canConclude: boolean
  status: ReviewStatus
  route: string
}

/** A single clickable metric on a vertical status card. */
export interface VerticalMetric {
  label: string
  count: number
  /** Optional filter key passed to the vertical when opened. */
  filter?: string
  tone?: "default" | "progress" | "greenlit" | "review" | "warning"
}

/** A compact status card for one product vertical. */
export interface VerticalCard {
  id: VerticalId
  name: string
  totalLabel: string // e.g. "characters", "looks", "scenes"
  totalCount: number
  metrics: VerticalMetric[] // up to three: in-progress, greenlit, active reviews
  activeReviewCount: number
  route: string
}
