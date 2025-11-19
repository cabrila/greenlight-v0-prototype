"use client"

import type { Character } from "@/types/casting"
import { useCasting } from "@/components/casting/CastingContext"
import { User, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { openModal } from "@/components/modals/ModalManager"
import type { Actor, ShortList } from "@/types/casting"

interface CharacterHeaderProps {
  character?: Character
}

export default function CharacterHeader({ character }: CharacterHeaderProps) {
  const { state } = useCasting()

  const showCharacterDetails = () => {
    if (character) {
      openModal("characterDetails", { character })
    }
  }

  // Calculate statistics for the character
  const getCharacterStats = () => {
    if (!character || !character.actors) {
      return { totalActors: 0, pendingDecisions: 0, greenlit: 0 }
    }

    // Destructure with sensible fall-backs to prevent “undefined is not an object” errors
    const {
      longList = [],
      audition = [],
      approval = [],
      shortLists = [],
      // any additional dynamic lists remain accessible via the rest operator
      ...restLists
    } = character.actors as Record<string, any>

    const dynamicActors = Object.entries(restLists)
      .filter(([, value]) => Array.isArray(value)) // only arrays, ignore metadata
      .flatMap(([, value]) => value as Actor[])

    const shortlistActors = Array.isArray(shortLists)
      ? (shortLists as ShortList[]).flatMap((sl) => sl.actors ?? [])
      : []

    const allActors: Actor[] = [...longList, ...audition, ...approval, ...shortlistActors, ...dynamicActors]

    const totalActors = allActors.length
    const greenlit = allActors.filter((actor) => actor.isGreenlit || actor.isCast).length

    const pendingDecisions = allActors.filter((actor) => {
      if (actor.isGreenlit || actor.isCast) return false

      const votes = Object.values(actor.userVotes || {})
      const totalUsers = state.users.length

      return (
        votes.length > 0 &&
        (votes.length < totalUsers || !actor.consensusAction || actor.consensusAction.type === "stay")
      )
    }).length

    return { totalActors, pendingDecisions, greenlit }
  }

  const stats = getCharacterStats()

  return (
    <header className="bg-gradient-to-r from-white via-slate-50 to-white border-b border-slate-200/60 shadow-sm">
      <div className="px-4 py-2 md:px-6 md:py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
          <div className="flex items-center space-x-3 md:space-x-4 overflow-hidden">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg md:text-xl font-bold text-slate-800 truncate flex items-center gap-1">
                <span className="whitespace-nowrap text-slate-500 font-semibold text-xs sm:text-sm uppercase tracking-tight">Casting for:</span>
                <span
                  className="text-emerald-600 cursor-pointer hover:text-emerald-700 hover:underline transition-all duration-200 decoration-2 underline-offset-2 truncate"
                  onClick={showCharacterDetails}
                  title="Click to view detailed character information"
                >
                  {character?.name || "N/A"}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {/* Total Actors */}
            <div className="flex items-center gap-1.5 md:gap-2 rounded-xl bg-slate-50/50 border border-slate-100 px-2 py-1 md:px-3 md:py-1.5 flex-shrink-0">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-tight whitespace-nowrap leading-none">Total Actors</p>
                <p className="text-xs md:text-sm font-bold text-slate-800 leading-none">{stats.totalActors}</p>
              </div>
            </div>

            {/* Pending Decisions */}
            <div className="flex items-center gap-1.5 md:gap-2 rounded-xl bg-slate-50/50 border border-slate-100 px-2 py-1 md:px-3 md:py-1.5 flex-shrink-0">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-tight whitespace-nowrap leading-none">Pending</p>
                <p className="text-xs md:text-sm font-bold text-slate-800 leading-none">{stats.pendingDecisions}</p>
              </div>
            </div>

            {/* Greenlit */}
            <div className="flex items-center gap-1.5 md:gap-2 rounded-xl bg-slate-50/50 border border-slate-100 px-2 py-1 md:px-3 md:py-1.5 flex-shrink-0">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-tight whitespace-nowrap leading-none">Greenlit</p>
                <p className="text-xs md:text-sm font-bold text-slate-800 leading-none">{stats.greenlit}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
