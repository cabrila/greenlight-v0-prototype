"use client"

import { ArrowLeft } from "lucide-react"
import { LocationScoutingProvider, useLocationScouting } from "./LocationScoutingContext"
import LocationProjectsList from "./LocationProjectsList"
import LocationUploadView from "./LocationUploadView"
import LocationResultsView from "./LocationResultsView"

interface LocationScoutingScreenProps {
  onBack: () => void
}

function LocationScoutingContent({ onBack }: LocationScoutingScreenProps) {
  const { view } = useLocationScouting()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #2d6b3f 0%, #1a4a2a 30%, #0f3520 55%, #0a2618 80%, #061a10 100%)",
      }}
    >
      {/* Top Navigation */}
      {view === "projects" && (
        <header className="flex items-center gap-4 p-6 border-b border-white/10">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-xl font-bold text-white font-sans">Location Scouting</h1>
        </header>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {view === "projects" && <LocationProjectsList />}
        {view === "upload" && <LocationUploadView />}
        {view === "results" && <LocationResultsView />}
      </div>
    </div>
  )
}

export default function LocationScoutingScreen({ onBack }: LocationScoutingScreenProps) {
  return (
    <LocationScoutingProvider>
      <LocationScoutingContent onBack={onBack} />
    </LocationScoutingProvider>
  )
}
