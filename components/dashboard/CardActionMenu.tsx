"use client"

import type React from "react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MoreHorizontal } from "lucide-react"

export interface CardMenuItem {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect: () => void
  /** Renders the item in a destructive red style. */
  danger?: boolean
}

interface CardActionMenuProps {
  items: CardMenuItem[]
  /** Accessible label for the trigger button. */
  label?: string
}

// A compact "kebab" (three-dot) trigger that opens a contextual dropdown in a
// body-level portal so it is never clipped by a card's overflow container.
export default function CardActionMenu({ items, label = "More actions" }: CardActionMenuProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null)

  const MENU_WIDTH = 180

  const recompute = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8))
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left,
      width: MENU_WIDTH,
      zIndex: 130,
    })
  }, [])

  useLayoutEffect(() => {
    if (open) recompute()
  }, [open, recompute])

  useEffect(() => {
    if (!open) return
    const onScroll = () => recompute()
    const onDown = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, recompute])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          open ? "bg-slate-100 text-slate-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>

      {open &&
        menuStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={menuStyle}
            className="rounded-xl border border-slate-200 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  item.onSelect()
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
