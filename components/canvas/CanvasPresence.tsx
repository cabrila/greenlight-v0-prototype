"use client"

import { useEffect, useRef, useState } from "react"
import { MousePointer2, ThumbsUp, ThumbsDown } from "lucide-react"
import { COLLABORATORS, type ReactionKind } from "./canvasCollaborators"

export interface PresenceTarget {
  id: string
  x: number
  y: number
  w: number
  h: number
  reviewable: boolean
}

type CursorAction = "move" | "select" | "comment" | "react-up" | "react-down"

interface CursorState {
  x: number
  y: number
  targetId: string | null
  action: CursorAction
  bubble: string | null
}

const COMMENT_LINES = [
  "Love this one",
  "Can we see more angles?",
  "Strong option",
  "Not sure about the tone",
  "Works for the scene",
  "Check availability?",
  "This fits the brief",
]

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

interface CanvasPresenceProps {
  targets: PresenceTarget[]
  zoom: number
  onReact: (itemId: string, userId: string, kind: ReactionKind) => void
}

/** Simulated live collaborators: cursors that wander the board, select, comment and react. */
export default function CanvasPresence({ targets, zoom, onReact }: CanvasPresenceProps) {
  const targetsRef = useRef(targets)
  const onReactRef = useRef(onReact)
  useEffect(() => {
    targetsRef.current = targets
    onReactRef.current = onReact
  })

  const [cursors, setCursors] = useState<Record<string, CursorState>>(() => {
    const init: Record<string, CursorState> = {}
    COLLABORATORS.forEach((c, i) => {
      init[c.id] = { x: 260 + i * 220, y: 180 + i * 90, targetId: null, action: "move", bubble: null }
    })
    return init
  })

  useEffect(() => {
    let alive = true
    const timers: number[] = []

    const wanderPoint = () => {
      const ts = targetsRef.current
      if (!ts.length) return { x: 120 + Math.random() * 760, y: 100 + Math.random() * 460 }
      const minX = Math.min(...ts.map((t) => t.x)) - 120
      const minY = Math.min(...ts.map((t) => t.y)) - 100
      const maxX = Math.max(...ts.map((t) => t.x + t.w)) + 120
      const maxY = Math.max(...ts.map((t) => t.y + t.h)) + 100
      return { x: minX + Math.random() * (maxX - minX), y: minY + Math.random() * (maxY - minY) }
    }

    COLLABORATORS.forEach((c, i) => {
      const step = () => {
        if (!alive) return
        const ts = targetsRef.current
        let next: CursorState
        if (ts.length && Math.random() < 0.72) {
          const t = pick(ts)
          const roll = Math.random()
          let action: CursorAction = "select"
          if (t.reviewable) {
            if (roll < 0.14) action = "react-up"
            else if (roll < 0.19) action = "react-down"
            else if (roll < 0.33) action = "comment"
          }
          next = {
            x: t.x + t.w * (0.3 + Math.random() * 0.45),
            y: t.y + t.h * (0.35 + Math.random() * 0.45),
            targetId: t.id,
            action,
            bubble: action === "comment" ? pick(COMMENT_LINES) : null,
          }
          if (action === "react-up" || action === "react-down") {
            const kind: ReactionKind = action === "react-up" ? "up" : "down"
            timers.push(window.setTimeout(() => alive && onReactRef.current(t.id, c.id, kind), 1100))
          }
        } else {
          next = { ...wanderPoint(), targetId: null, action: "move", bubble: null }
        }
        setCursors((prev) => ({ ...prev, [c.id]: next }))
        timers.push(window.setTimeout(step, 2000 + Math.random() * 2400))
      }
      timers.push(window.setTimeout(step, 500 + i * 650))
    })

    return () => {
      alive = false
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const inv = 1 / zoom

  return (
    <>
      {COLLABORATORS.map((c) => {
        const cur = cursors[c.id]
        const target = cur.targetId ? targets.find((t) => t.id === cur.targetId) : undefined
        if (!target || cur.action === "move") return null
        return (
          <div
            key={`sel-${c.id}`}
            aria-hidden="true"
            className="absolute pointer-events-none rounded-xl"
            style={{
              left: target.x - 4,
              top: target.y - 4,
              width: target.w + 8,
              height: target.h + 8,
              border: `${2 * inv}px solid ${c.color}`,
              zIndex: 38,
              transition: "all 300ms ease",
            }}
          />
        )
      })}

      {COLLABORATORS.map((c) => {
        const cur = cursors[c.id]
        const reacting = cur.action === "react-up" || cur.action === "react-down"
        return (
          <div
            key={c.id}
            aria-hidden="true"
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              transform: `translate(${cur.x}px, ${cur.y}px)`,
              transition: "transform 1.1s cubic-bezier(0.22, 0.61, 0.36, 1)",
              zIndex: 45,
            }}
          >
            <div style={{ transform: `scale(${inv})`, transformOrigin: "top left" }} className="flex items-start">
              <MousePointer2 className="h-5 w-5 drop-shadow" style={{ color: "white", fill: c.color }} strokeWidth={1.5} />
              <div className="ml-0.5 mt-4 flex flex-col items-start gap-1">
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm whitespace-nowrap"
                  style={{ backgroundColor: c.color }}
                >
                  {c.name.split(" ")[0]}
                  {reacting &&
                    (cur.action === "react-up" ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />)}
                </span>
                {cur.bubble && (
                  <span className="max-w-[180px] rounded-lg rounded-tl-sm bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-md border border-slate-200">
                    {cur.bubble}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

export function PresenceAvatars() {
  return (
    <div className="hidden md:flex items-center gap-2" aria-label={`${COLLABORATORS.length} collaborators active`}>
      <div className="flex -space-x-2">
        {COLLABORATORS.map((c) => (
          <span
            key={c.id}
            title={`${c.name} · ${c.role}`}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white"
            style={{ backgroundColor: c.color }}
          >
            {c.initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        ))}
      </div>
      <span className="text-xs text-slate-500 hidden xl:inline">{COLLABORATORS.length} active</span>
    </div>
  )
}
