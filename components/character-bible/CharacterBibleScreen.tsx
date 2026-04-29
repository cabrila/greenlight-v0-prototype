"use client"

import { CharacterBibleProvider, useCharacterBible } from "./CharacterBibleContext"
import ProjectsList from "./ProjectsList"
import UploadView from "./UploadView"
import ResultsView from "./ResultsView"
import FeatureLayout from "@/components/layout/FeatureLayout"

interface CharacterBibleScreenProps {
  onBack: () => void
  onSignOut?: () => void
}

function CharacterBibleContent({ onBack, onSignOut }: CharacterBibleScreenProps) {
  const { view } = useCharacterBible()

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut}>
      <div className="h-full flex flex-col overflow-hidden">
        {view === "list" && <ProjectsList />}
        {view === "upload" && <UploadView />}
        {view === "results" && <ResultsView />}
      </div>
    </FeatureLayout>
  )
}

export default function CharacterBibleScreen({ onBack, onSignOut }: CharacterBibleScreenProps) {
  return (
    <CharacterBibleProvider>
      <CharacterBibleContent onBack={onBack} onSignOut={onSignOut} />
    </CharacterBibleProvider>
  )
}
