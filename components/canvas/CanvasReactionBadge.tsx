"use client"

import { ThumbsUp, ThumbsDown } from "lucide-react"
import { ME_ID, collaboratorName, type ItemReactions, type ReactionKind } from "./canvasCollaborators"

interface CanvasReactionBadgeProps {
  itemId: string
  x: number
  y: number
  width: number
  zoom: number
  reactions: ItemReactions
  onToggle: (itemId: string, kind: ReactionKind) => void
}

/** Reaction pill pinned to the top-right corner of a canvas card — it moves with the card. */
export default function CanvasReactionBadge({ itemId, x, y, width, zoom, reactions, onToggle }: CanvasReactionBadgeProps) {
  const kinds: { kind: ReactionKind; icon: typeof ThumbsUp; users: string[]; active: string }[] = [
    { kind: "up", icon: ThumbsUp, users: reactions.up, active: "bg-emerald-500 text-white" },
    { kind: "down", icon: ThumbsDown, users: reactions.down, active: "bg-rose-500 text-white" },
  ]
  const visible = kinds.filter((k) => k.users.length > 0)
  if (!visible.length) return null

  return (
    <div
      className="absolute flex items-center gap-1 rounded-full bg-white p-0.5 shadow-md border border-slate-200"
      style={{
        left: x + width,
        top: y,
        transform: `translate(-85%, -55%) scale(${Math.max(0.8, 1 / zoom)})`,
        transformOrigin: "center",
        zIndex: 36,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {visible.map(({ kind, icon: Icon, users, active }) => {
        const mine = users.includes(ME_ID)
        const names = users.map(collaboratorName).join(", ")
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onToggle(itemId, kind)}
            title={names}
            aria-label={`${kind === "up" ? "Thumbs up" : "Thumbs down"} from ${names}. ${mine ? "Remove yours" : "Add yours"}`}
            aria-pressed={mine}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors ${
              mine ? active : kind === "up" ? "text-emerald-700 hover:bg-emerald-50" : "text-rose-700 hover:bg-rose-50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {users.length}
          </button>
        )
      })}
    </div>
  )
}
