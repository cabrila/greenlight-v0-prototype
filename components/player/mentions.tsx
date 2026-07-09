"use client"

import type React from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

export interface MentionPerson {
  id: string
  name: string
  color?: string
}

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Return the ids of people mentioned in `text` via an "@Name" token.
 * Longer names are matched first so "@Jane Doe" is preferred over "@Jane".
 */
export function extractMentions(text: string, people: MentionPerson[]): string[] {
  if (!text) return []
  const sorted = [...people].sort((a, b) => b.name.length - a.name.length)
  const matched = new Set<string>()
  for (const person of sorted) {
    const re = new RegExp(`@${escapeRegExp(person.name)}(?![\\w])`, "i")
    if (re.test(text)) matched.add(person.id)
  }
  return Array.from(matched)
}

/**
 * Render comment text, highlighting any "@Name" tokens that match a known
 * person as a colored pill — mimicking how a tagged user is called out.
 */
export function MentionText({
  text,
  people,
  className,
}: {
  text: string
  people: MentionPerson[]
  className?: string
}) {
  const segments = useMemo(() => {
    if (!text) return [{ type: "text" as const, value: "" }]
    const sorted = [...people].sort((a, b) => b.name.length - a.name.length)
    if (sorted.length === 0) return [{ type: "text" as const, value: text }]

    const pattern = sorted.map((p) => escapeRegExp(p.name)).join("|")
    const re = new RegExp(`@(${pattern})(?![\\w])`, "gi")

    const out: Array<{ type: "text" | "mention"; value: string; person?: MentionPerson }> = []
    let lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIndex) out.push({ type: "text", value: text.slice(lastIndex, m.index) })
      const person = sorted.find((p) => p.name.toLowerCase() === m![1].toLowerCase())
      out.push({ type: "mention", value: m[0], person })
      lastIndex = m.index + m[0].length
    }
    if (lastIndex < text.length) out.push({ type: "text", value: text.slice(lastIndex) })
    return out
  }, [text, people])

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span
            key={i}
            className="inline-flex items-center rounded px-1 py-px font-semibold"
            style={{
              backgroundColor: (seg.person?.color || "#0ea5e9") + "26",
              color: seg.person?.color || "#0284c7",
            }}
          >
            @{seg.person?.name ?? seg.value.slice(1)}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        ),
      )}
    </span>
  )
}

interface MentionTextareaProps {
  value: string
  onChange: (value: string) => void
  people: MentionPerson[]
  onSubmit?: () => void
  placeholder?: string
  rows?: number
  className?: string
  dark?: boolean
  autoFocus?: boolean
  textareaRef?: React.RefObject<HTMLTextAreaElement>
}

/**
 * A textarea that offers an "@" autocomplete of people. Selecting inserts the
 * full "@Name" token, which downstream renders as a highlighted mention pill.
 */
export function MentionTextarea({
  value,
  onChange,
  people,
  onSubmit,
  placeholder,
  rows = 2,
  className,
  dark = false,
  autoFocus,
  textareaRef,
}: MentionTextareaProps) {
  const innerRef = useRef<HTMLTextAreaElement>(null)
  const ref = textareaRef || innerRef
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null)

  const suggestions = useMemo(() => {
    if (!open) return []
    const q = query.toLowerCase()
    return people.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6)
  }, [open, query, people])

  // Position the menu in a fixed, body-level layer so it is never clipped by a
  // scroll/overflow container and always renders above other UI (e.g. the
  // canvas player view portal).
  const MENU_WIDTH = 224 // w-56
  const MENU_MAX_HEIGHT = 208 // max-h-52
  const recomputePosition = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8))
    const spaceAbove = rect.top
    const placeAbove = spaceAbove > MENU_MAX_HEIGHT + 8
    const style: React.CSSProperties = {
      position: "fixed",
      left,
      width: MENU_WIDTH,
      zIndex: 10000, // above the highest app layer (SYSTEM_ALERT = 9999)
    }
    if (placeAbove) {
      style.bottom = window.innerHeight - rect.top + 4
    } else {
      style.top = rect.bottom + 4
    }
    setMenuStyle(style)
  }, [ref])

  // Keep the menu anchored while open, even on scroll or resize.
  useLayoutEffect(() => {
    if (open && suggestions.length > 0) recomputePosition()
  }, [open, suggestions.length, query, recomputePosition])

  useEffect(() => {
    if (!open) return
    const handler = () => recomputePosition()
    window.addEventListener("scroll", handler, true)
    window.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("scroll", handler, true)
      window.removeEventListener("resize", handler)
    }
  }, [open, recomputePosition])

  // Detect an in-progress "@token" immediately before the caret.
  const detectMention = (el: HTMLTextAreaElement) => {
    const caret = el.selectionStart ?? el.value.length
    const before = el.value.slice(0, caret)
    const match = before.match(/@([^\s@]*)$/)
    if (match) {
      setQuery(match[1])
      setActiveIndex(0)
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const applyMention = (person: MentionPerson) => {
    const el = ref.current
    if (!el) return
    const caret = el.selectionStart ?? value.length
    const before = value.slice(0, caret)
    const after = value.slice(caret)
    const newBefore = before.replace(/@([^\s@]*)$/, `@${person.name} `)
    const newValue = newBefore + after
    onChange(newValue)
    setOpen(false)
    setQuery("")
    // Restore caret just after the inserted mention.
    requestAnimationFrame(() => {
      const pos = newBefore.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        applyMention(suggestions[activeIndex])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        return
      }
    }
    // Submit on Enter (respecting IME composition) when the menu is closed.
    if (
      onSubmit &&
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      (e as unknown as { keyCode: number }).keyCode !== 229
    ) {
      e.preventDefault()
      onSubmit()
    }
  }

  const menu =
    open && suggestions.length > 0 && menuStyle && typeof document !== "undefined"
      ? createPortal(
          <ul
            role="listbox"
            style={menuStyle}
            className={`max-h-52 overflow-y-auto rounded-lg border shadow-xl py-1 ${
              dark ? "bg-slate-800 border-white/10" : "bg-white border-slate-200"
            }`}
          >
            {suggestions.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyMention(p)
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-sm text-left transition-colors ${
                    i === activeIndex ? (dark ? "bg-white/10" : "bg-slate-100") : ""
                  } ${dark ? "text-white" : "text-slate-700"}`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: p.color || "#64748b" }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null

  return (
    <div className="relative flex-1">
      {menu}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          detectMention(e.target)
        }}
        onKeyUp={(e) => detectMention(e.currentTarget)}
        onClick={(e) => detectMention(e.currentTarget)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={className}
      />
    </div>
  )
}
