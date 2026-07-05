"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MousePointer2, Eye, X } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface Collaborator {
  id: string
  name: string
  color: string
  cursor: Point
  targetCursor: Point
  /** Canvas-space point the collaborator is centering their view on. */
  view: { cx: number; cy: number; zoom: number }
  targetView: { cx: number; cy: number; zoom: number }
  nextRetarget: number
  message?: string
}

const SEED: { id: string; name: string; color: string }[] = [
  { id: "u-mara", name: "Mara Lindqvist", color: "#0ea5e9" },
  { id: "u-tobias", name: "Tobias Reyes", color: "#f59e0b" },
  { id: "u-priya", name: "Priya Anand", color: "#ec4899" },
]

const CHATTER = [
  "Love this direction",
  "Can we see option B?",
  "This location works",
  "Swap the lead here",
  "Great mood",
  "Let's group these",
]

interface CanvasPresenceProps {
  /** Live viewport transform from the parent canvas. */
  pan: Point
  zoom: number
  /** Ref to the scrollable/zoomable canvas element (for viewport size). */
  viewportRef: React.RefObject<HTMLDivElement | null>
  /** Canvas-space anchor points (item positions) so cursors gravitate to content. */
  anchors: Point[]
  /** Request the parent to move its viewport (used while following). */
  onViewportRequest: (pan: Point, zoom: number) => void
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function CanvasPresence({ pan, zoom, viewportRef, anchors, onViewportRequest }: CanvasPresenceProps) {
  const collabsRef = useRef<Collaborator[]>([])
  const [, forceRender] = useState(0)
  const rafRef = useRef<number | null>(null)
  const [followId, setFollowId] = useState<string | null>(null)
  const followRef = useRef<string | null>(null)
  const anchorsRef = useRef<Point[]>(anchors)
  const viewReqRef = useRef(onViewportRequest)

  useEffect(() => { anchorsRef.current = anchors }, [anchors])
  useEffect(() => { viewReqRef.current = onViewportRequest }, [onViewportRequest])
  useEffect(() => { followRef.current = followId }, [followId])

  /* Pick a fresh target near a content anchor (or a random spot). */
  const pickTarget = useCallback((): Point => {
    const a = anchorsRef.current
    if (a.length) {
      const base = a[Math.floor(Math.random() * a.length)]
      return { x: base.x + (Math.random() - 0.5) * 320, y: base.y + (Math.random() - 0.5) * 320 }
    }
    return { x: (Math.random() - 0.5) * 1400, y: (Math.random() - 0.5) * 900 }
  }, [])

  /* Seed collaborators once. */
  useEffect(() => {
    const now = performance.now()
    collabsRef.current = SEED.map((s, i) => {
      const start = pickTarget()
      return {
        ...s,
        cursor: { ...start },
        targetCursor: pickTarget(),
        view: { cx: start.x, cy: start.y, zoom: 1 },
        targetView: { cx: start.x, cy: start.y, zoom: 1 },
        nextRetarget: now + 1200 + i * 700,
      }
    })
    forceRender((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Animation loop: interpolate cursors + viewpoints, retarget periodically. */
  useEffect(() => {
    const step = () => {
      const now = performance.now()
      collabsRef.current = collabsRef.current.map((c) => {
        let { targetCursor, targetView, nextRetarget, message } = c
        if (now >= nextRetarget) {
          targetCursor = pickTarget()
          targetView = { cx: targetCursor.x, cy: targetCursor.y, zoom: 0.7 + Math.random() * 0.7 }
          nextRetarget = now + 2200 + Math.random() * 2600
          message = Math.random() < 0.5 ? CHATTER[Math.floor(Math.random() * CHATTER.length)] : undefined
        }
        const cursor = {
          x: lerp(c.cursor.x, targetCursor.x, 0.045),
          y: lerp(c.cursor.y, targetCursor.y, 0.045),
        }
        const view = {
          cx: lerp(c.view.cx, targetView.cx, 0.03),
          cy: lerp(c.view.cy, targetView.cy, 0.03),
          zoom: lerp(c.view.zoom, targetView.zoom, 0.03),
        }
        return { ...c, cursor, targetCursor, view, targetView, nextRetarget, message }
      })

      // Drive the parent viewport while following.
      const fid = followRef.current
      if (fid) {
        const target = collabsRef.current.find((c) => c.id === fid)
        const rect = viewportRef.current?.getBoundingClientRect()
        if (target && rect) {
          const z = target.view.zoom
          viewReqRef.current(
            { x: rect.width / 2 - target.view.cx * z, y: rect.height / 2 - target.view.cy * z },
            z,
          )
        }
      }

      forceRender((n) => (n + 1) % 1000000)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [pickTarget, viewportRef])

  const collabs = collabsRef.current
  const following = collabs.find((c) => c.id === followId)

  const toggleFollow = (id: string) => setFollowId((cur) => (cur === id ? null : id))

  return (
    <>
      {/* Live cursors (positioned in screen space from canvas coords) */}
      {collabs.map((c) => {
        const screenX = pan.x + c.cursor.x * zoom
        const screenY = pan.y + c.cursor.y * zoom
        // Cull cursors far outside the viewport for tidiness.
        const rect = viewportRef.current?.getBoundingClientRect()
        if (rect && (screenX < -80 || screenY < -80 || screenX > rect.width + 80 || screenY > rect.height + 80)) {
          return null
        }
        return (
          <div
            key={c.id}
            className="pointer-events-none absolute z-[45] transition-transform duration-75"
            style={{ left: screenX, top: screenY, transform: "translate(-2px, -2px)" }}
          >
            <MousePointer2 className="w-5 h-5 drop-shadow" style={{ color: c.color, fill: c.color }} />
            <div
              className="mt-0.5 ml-3 inline-flex flex-col gap-1 items-start"
              style={{ maxWidth: 180 }}
            >
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white shadow-sm whitespace-nowrap"
                style={{ backgroundColor: c.color }}
              >
                {c.name.split(" ")[0]}
              </span>
              {c.message && (
                <span className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-700 bg-white shadow border border-slate-200 whitespace-nowrap">
                  {c.message}
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* Presence bar (top-right of canvas) */}
      <div className="absolute top-4 right-4 z-[46] flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
        {following && (
          <div
            className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full text-white shadow-lg"
            style={{ backgroundColor: following.color }}
          >
            <Eye className="w-4 h-4" />
            <span className="text-xs font-semibold">Following {following.name.split(" ")[0]}</span>
            <button
              onClick={() => setFollowId(null)}
              className="w-6 h-6 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center transition-colors"
              aria-label="Stop following"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center bg-white rounded-full shadow-lg border border-slate-200 p-1">
          {collabs.map((c) => {
            const active = c.id === followId
            return (
              <button
                key={c.id}
                onClick={() => toggleFollow(c.id)}
                title={active ? `Stop following ${c.name}` : `Follow ${c.name}`}
                aria-label={active ? `Stop following ${c.name}` : `Follow ${c.name}`}
                aria-pressed={active}
                className={`relative w-8 h-8 -ml-1.5 first:ml-0 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 transition-transform hover:-translate-y-0.5 ${
                  active ? "ring-slate-900 z-10" : "ring-white"
                }`}
                style={{ backgroundColor: c.color }}
              >
                {c.name.split(" ").map((p) => p.charAt(0)).join("").slice(0, 2)}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
