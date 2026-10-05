"use client"

import { useEffect, useRef, useState } from "react"
import { MousePointer2 } from "lucide-react"
import { COLLABORATORS } from "./canvasCollaborators"

export interface PresenceTarget {
  id: string
  x: number
  y: number
  w: number
  h: number
  reviewable: boolean
}

interface CursorState {
  x: number
  y: number
}

interface CanvasPresenceProps {
  targets: PresenceTarget[]
  zoom: number
}

/** Simulated live collaborators: decorative cursors that wander without interacting with cards. */
export default function CanvasPresence({ targets, zoom }: CanvasPresenceProps) {
  const targetsRef = useRef(targets)
  useEffect(() => {
    targetsRef.current = targets
  }, [targets])

  const [cursors, setCursors] = useState<Record<string, CursorState>>(() => {
    const init: Record<string, CursorState> = {}
    COLLABORATORS.forEach((c, i) => {
      init[c.id] = { x: 260 + i * 220, y: 180 + i * 90 }
    })
    return init
  })

  useEffect(() => {
    let alive = true
    const timers = new Map<string, number>()

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
        const next = wanderPoint()
        setCursors((prev) => ({ ...prev, [c.id]: next }))
        timers.set(c.id, window.setTimeout(step, 2000 + Math.random() * 2400))
      }
      timers.set(c.id, window.setTimeout(step, 500 + i * 650))
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
                </span>
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
