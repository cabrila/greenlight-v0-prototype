"use client"

import type React from "react"
import { useMemo, useState } from "react"
import type { Character, Actor } from "@/types/casting"
import { Check, ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, MapPin, MessageSquare } from "lucide-react"
import { openModal } from "@/components/modals/ModalManager"

type SortDirection = "asc" | "desc"

type ColumnKey =
  | "name"
  | "age"
  | "playingAge"
  | "location"
  | "gender"
  | "status"
  | "skills"
  | "votes"
  | "notes"
  | "dateAdded"

interface ColumnDef {
  key: ColumnKey
  label: string
  sortable: boolean
  align?: "left" | "center" | "right"
  numeric?: boolean
  className?: string
}

interface ActorListViewProps {
  actors: Actor[]
  character: Character
  users: { id: string; name: string; initials: string; bgColor?: string; color?: string }[]
  selectedActorIds: Set<string>
  onSelect: (actorId: string, e: React.MouseEvent) => void
  onToggleSelectAll: (select: boolean) => void
  draggedActorIds: Set<string>
  dropTarget: string | null
  onDragStart: (e: React.DragEvent, actor: Actor) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent, actor: Actor) => void
  onDrop: (e: React.DragEvent, actor: Actor) => void
}

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name", sortable: true, align: "left" },
  { key: "age", label: "Age", sortable: true, align: "right", numeric: true, className: "hidden sm:table-cell" },
  { key: "playingAge", label: "Play age", sortable: true, align: "left", className: "hidden md:table-cell" },
  { key: "location", label: "Location", sortable: true, align: "left", className: "hidden lg:table-cell" },
  { key: "gender", label: "Gender", sortable: true, align: "left", className: "hidden xl:table-cell" },
  { key: "status", label: "Status", sortable: true, align: "left", className: "hidden md:table-cell" },
  { key: "skills", label: "Skills", sortable: false, align: "left", className: "hidden xl:table-cell" },
  { key: "votes", label: "Consensus", sortable: true, align: "left", className: "hidden sm:table-cell" },
  { key: "notes", label: "Notes", sortable: true, align: "right", numeric: true, className: "hidden lg:table-cell" },
  { key: "dateAdded", label: "Added", sortable: true, align: "right", className: "hidden xl:table-cell" },
]

function parsePlayingAgeMidpoint(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY
  const range = value.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return (Number.parseInt(range[1]) + Number.parseInt(range[2])) / 2
  const single = Number.parseInt(value)
  return isNaN(single) ? Number.POSITIVE_INFINITY : single
}

function RowThumbnail({ actor }: { actor: Actor }) {
  const [error, setError] = useState(false)
  const src = actor.headshots && actor.headshots.length > 0 ? actor.headshots[0] : null
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src || "/placeholder.svg"} alt="" className="w-full h-full object-cover" onError={() => setError(true)} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold bg-gradient-to-br from-slate-100 to-slate-200">
          {actor.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function getConsensus(actor: Actor) {
  const votes = Object.values(actor.userVotes || {}) as string[]
  const yes = votes.filter((v) => v === "yes").length
  const maybe = votes.filter((v) => v === "maybe" || v === "stay").length
  const no = votes.filter((v) => v === "no").length
  const total = votes.length
  const ratio = total > 0 ? yes / total : -1
  return { yes, maybe, no, total, ratio }
}

export default function ActorListView({
  actors,
  character,
  users,
  selectedActorIds,
  onSelect,
  onToggleSelectAll,
  draggedActorIds,
  dropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ActorListViewProps) {
  const [sort, setSort] = useState<{ column: ColumnKey; direction: SortDirection } | null>(null)

  const handleSort = (column: ColumnKey) => {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, direction: "asc" }
      if (prev.direction === "asc") return { column, direction: "desc" }
      return null // third click clears local sort, restoring the incoming order
    })
  }

  const sortedActors = useMemo(() => {
    if (!sort) return actors
    const dir = sort.direction === "asc" ? 1 : -1
    const copy = [...actors]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sort.column) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "age":
          cmp = (Number.parseInt(a.age || "") || Number.POSITIVE_INFINITY) - (Number.parseInt(b.age || "") || Number.POSITIVE_INFINITY)
          break
        case "playingAge":
          cmp = parsePlayingAgeMidpoint(a.playingAge) - parsePlayingAgeMidpoint(b.playingAge)
          break
        case "location":
          cmp = (a.location || "").localeCompare(b.location || "")
          break
        case "gender":
          cmp = (a.gender || "").localeCompare(b.gender || "")
          break
        case "status":
          cmp = (a.statuses?.[0]?.label || "\uffff").localeCompare(b.statuses?.[0]?.label || "\uffff")
          break
        case "votes":
          cmp = getConsensus(a).ratio - getConsensus(b).ratio
          break
        case "notes":
          cmp = (a.notes?.length || 0) - (b.notes?.length || 0)
          break
        case "dateAdded":
          cmp = (a.dateAdded || 0) - (b.dateAdded || 0)
          break
        default:
          cmp = 0
      }
      return cmp * dir
    })
    return copy
  }, [actors, sort])

  const allSelected = actors.length > 0 && actors.every((a) => selectedActorIds.has(a.id))
  const someSelected = actors.some((a) => selectedActorIds.has(a.id)) && !allSelected

  const alignClass = (align?: string) =>
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr className="border-b border-slate-200">
            {/* Select-all checkbox */}
            <th scope="col" className="w-10 px-3 py-2.5 text-left">
              <button
                type="button"
                onClick={() => onToggleSelectAll(!allSelected)}
                aria-label={allSelected ? "Deselect all" : "Select all"}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  allSelected
                    ? "bg-emerald-500 border-emerald-600"
                    : someSelected
                      ? "bg-emerald-100 border-emerald-400"
                      : "bg-white border-slate-300 hover:border-emerald-500"
                }`}
              >
                {allSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                {someSelected && <span className="w-2 h-0.5 bg-emerald-500 rounded" />}
              </button>
            </th>
            {COLUMNS.map((col) => {
              const isActive = sort?.column === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={isActive ? (sort!.direction === "asc" ? "ascending" : "descending") : "none"}
                  className={`px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-slate-500 whitespace-nowrap ${alignClass(
                    col.align,
                  )} ${col.className || ""}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`group inline-flex items-center gap-1 hover:text-slate-800 transition-colors ${
                        col.align === "right" ? "flex-row-reverse" : ""
                      } ${isActive ? "text-emerald-700" : ""}`}
                    >
                      <span>{col.label}</span>
                      {isActive ? (
                        sort!.direction === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60" />
                      )}
                    </button>
                  ) : (
                    <span>{col.label}</span>
                  )}
                </th>
              )
            })}
            <th scope="col" className="w-10 px-3 py-2.5" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {sortedActors.map((actor) => {
            const isSelected = selectedActorIds.has(actor.id)
            const isDragging = draggedActorIds.has(actor.id)
            const isDropTarget = dropTarget === actor.id
            const consensus = getConsensus(actor)

            return (
              <tr
                key={actor.id}
                draggable
                onDragStart={(e) => onDragStart(e, actor)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => onDragOver(e, actor)}
                onDrop={(e) => onDrop(e, actor)}
                onClick={(e) => onSelect(actor.id, e)}
                className={`group border-b border-slate-100 cursor-pointer transition-colors ${
                  isSelected ? "bg-emerald-50 hover:bg-emerald-100" : "hover:bg-slate-50"
                } ${isDragging ? "opacity-50" : ""} ${
                  isDropTarget ? "ring-2 ring-inset ring-emerald-400" : ""
                }`}
              >
                {/* Row checkbox */}
                <td className="px-3 py-2 align-middle">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const synthetic = { ...e, ctrlKey: true, metaKey: true } as unknown as React.MouseEvent
                      onSelect(actor.id, synthetic)
                    }}
                    aria-label={isSelected ? "Deselect" : "Select"}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-emerald-500 border-emerald-600"
                        : "bg-white border-slate-300 hover:border-emerald-500 opacity-60 group-hover:opacity-100"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                </td>

                {/* Name + thumbnail */}
                <td className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RowThumbnail actor={actor} />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openModal("editActor", { actor, characterId: character.id })
                        }}
                        className="block max-w-[220px] truncate text-left font-medium text-slate-800 hover:text-emerald-600 transition-colors"
                        title={actor.name}
                      >
                        {actor.name}
                      </button>
                      {actor.location && (
                        <span className="lg:hidden flex items-center gap-1 text-xs text-slate-400 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {actor.location}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Age */}
                <td className="px-3 py-2 align-middle text-right tabular-nums text-slate-600 hidden sm:table-cell">
                  {actor.age || "—"}
                </td>

                {/* Playing age */}
                <td className="px-3 py-2 align-middle hidden md:table-cell">
                  {actor.playingAge ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-300 text-slate-700 text-xs font-medium">
                      {actor.playingAge}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>

                {/* Location */}
                <td className="px-3 py-2 align-middle text-slate-600 hidden lg:table-cell">
                  <span className="block max-w-[160px] truncate" title={actor.location || ""}>
                    {actor.location || "—"}
                  </span>
                </td>

                {/* Gender */}
                <td className="px-3 py-2 align-middle text-slate-600 capitalize hidden xl:table-cell">
                  {actor.gender || "—"}
                </td>

                {/* Status */}
                <td className="px-3 py-2 align-middle hidden md:table-cell">
                  {actor.statuses && actor.statuses.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border border-current ${actor.statuses[0].bgColor} ${actor.statuses[0].textColor}`}
                      >
                        <span className="max-w-[90px] truncate">{actor.statuses[0].label}</span>
                      </span>
                      {actor.statuses.length > 1 && (
                        <span className="text-xs text-slate-400">+{actor.statuses.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">No status</span>
                  )}
                </td>

                {/* Skills */}
                <td className="px-3 py-2 align-middle hidden xl:table-cell">
                  {actor.skills && actor.skills.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 max-w-[100px] truncate">
                        {actor.skills[0]}
                      </span>
                      {actor.skills.length > 1 && (
                        <span className="text-xs text-slate-400">+{actor.skills.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                {/* Consensus / votes */}
                <td className="px-3 py-2 align-middle hidden sm:table-cell">
                  {consensus.total > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        {consensus.yes > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {consensus.yes}
                          </span>
                        )}
                        {consensus.maybe > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {consensus.maybe}
                          </span>
                        )}
                        {consensus.no > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {consensus.no}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {consensus.total}/{users.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">No votes</span>
                  )}
                </td>

                {/* Notes count */}
                <td className="px-3 py-2 align-middle text-right hidden lg:table-cell">
                  {actor.notes && actor.notes.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 tabular-nums">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      {actor.notes.length}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>

                {/* Date added */}
                <td className="px-3 py-2 align-middle text-right text-xs text-slate-500 tabular-nums hidden xl:table-cell">
                  {actor.dateAdded
                    ? new Date(actor.dateAdded).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    : "—"}
                </td>

                {/* Actions */}
                <td className="px-3 py-2 align-middle">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal("moreActions", { actor, characterId: character.id })
                    }}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md p-1 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
