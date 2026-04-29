"use client"

import { ArrowLeft } from "lucide-react"
import { ActorListProvider, useActorList } from "./ActorListContext"
import ActorProjectsList from "./ActorProjectsList"
import ActorUploadView from "./ActorUploadView"
import ActorResultsView from "./ActorResultsView"

interface ActorListScreenProps {
  onBack: () => void
}

function ActorListContent({ onBack }: ActorListScreenProps) {
  const { view } = useActorList()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #1a2e23 0%, #0f1f17 30%, #0a1812 60%, #061410 100%)",
      }}
    >
      {/* Top Navigation */}
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-sans">Back to Home</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === "list" && <ActorProjectsList />}
        {view === "upload" && <ActorUploadView />}
        {view === "results" && <ActorResultsView />}
      </div>
    </div>
  )
}

export default function ActorListScreen({ onBack }: ActorListScreenProps) {
  return (
    <ActorListProvider>
      <ActorListContent onBack={onBack} />
    </ActorListProvider>
  )
}
