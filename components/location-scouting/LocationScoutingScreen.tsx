"use client"

import { LocationScoutingProvider, useLocationScouting } from "./LocationScoutingContext"
import LocationProjectsList from "./LocationProjectsList"
import LocationUploadView from "./LocationUploadView"
import LocationResultsView from "./LocationResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

interface LocationScoutingScreenProps {
  onBack: () => void
  onSignOut?: () => void
}

function LocationScoutingContent({ onBack, onSignOut }: LocationScoutingScreenProps) {
  const { view } = useLocationScouting()

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut}>
      <div className="h-full flex flex-col overflow-hidden">
        {view === "projects" && <LocationProjectsList />}
        {view === "upload" && <LocationUploadView />}
        {view === "results" && <LocationResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function LocationScoutingScreen({ onBack, onSignOut }: LocationScoutingScreenProps) {
  return (
    <LocationScoutingProvider>
      <LocationScoutingContent onBack={onBack} onSignOut={onSignOut} />
    </LocationScoutingProvider>
  )
}
