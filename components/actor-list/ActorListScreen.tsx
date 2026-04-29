"use client"

import { ActorListProvider, useActorList } from "./ActorListContext"
import ActorProjectsList from "./ActorProjectsList"
import ActorUploadView from "./ActorUploadView"
import ActorResultsView from "./ActorResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

interface ActorListScreenProps {
  onBack: () => void
  onSignOut?: () => void
}

function ActorListContent({ onBack, onSignOut }: ActorListScreenProps) {
  const { view } = useActorList()

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut}>
      <div className="h-full flex flex-col overflow-hidden">
        {view === "list" && <ActorProjectsList />}
        {view === "upload" && <ActorUploadView />}
        {view === "results" && <ActorResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function ActorListScreen({ onBack, onSignOut }: ActorListScreenProps) {
  return (
    <ActorListProvider>
      <ActorListContent onBack={onBack} onSignOut={onSignOut} />
    </ActorListProvider>
  )
}
