import type { CanvasItemType } from "./CanvasItemCard"

export interface Collaborator {
  id: string
  name: string
  initials: string
  role: string
  color: string
}

export const ME_ID = "me"

export const COLLABORATORS: Collaborator[] = [
  { id: "u-maya", name: "Maya Chen", initials: "MC", role: "Director", color: "#7c3aed" },
  { id: "u-jordan", name: "Jordan Ellis", initials: "JE", role: "Casting Director", color: "#ea580c" },
  { id: "u-priya", name: "Priya Shah", initials: "PS", role: "Production Designer", color: "#0284c7" },
]

export const collaboratorName = (id: string) =>
  id === ME_ID ? "You" : COLLABORATORS.find((c) => c.id === id)?.name ?? "Someone"

export type ReactionKind = "up" | "down"

export interface ItemReactions {
  up: string[]
  down: string[]
}

export const REVIEWABLE_TYPES: CanvasItemType[] = ["actor", "prop", "costume", "location"]
export const isReviewable = (t: CanvasItemType) => REVIEWABLE_TYPES.includes(t)

/** Apply a reaction for one user. `toggle` removes it if already present. */
export function applyReaction(
  current: ItemReactions | undefined,
  userId: string,
  kind: ReactionKind,
  toggle: boolean,
): ItemReactions {
  const up = (current?.up || []).filter((u) => u !== userId)
  const down = (current?.down || []).filter((u) => u !== userId)
  const had = (current?.[kind] || []).includes(userId)
  if (had && toggle) return { up, down }
  if (kind === "up") up.push(userId)
  else down.push(userId)
  return { up, down }
}
