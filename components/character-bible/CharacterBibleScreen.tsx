"use client"

import { ArrowLeft } from "lucide-react"
import { CharacterBibleProvider, useCharacterBible } from "./CharacterBibleContext"
import ProjectsList from "./ProjectsList"
import UploadView from "./UploadView"
import ResultsView from "./ResultsView"

interface CharacterBibleScreenProps {
  onBack: () => void
}

function CharacterBibleContent({ onBack }: CharacterBibleScreenProps) {
  const { view } = useCharacterBible()

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1a2e23 0%, #0f1f17 50%, #0a1812 100%)",
      }}
    >
      {/* Top Bar with Back Button (only on list view) */}
      {view === "list" && (
        <header className="shrink-0 flex items-center px-6 py-4 border-b border-white/10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-sans">Back to Home</span>
          </button>
        </header>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "list" && <ProjectsList />}
        {view === "upload" && <UploadView />}
        {view === "results" && <ResultsView />}
      </div>
    </div>
  )
}

export default function CharacterBibleScreen({ onBack }: CharacterBibleScreenProps) {
  return (
    <CharacterBibleProvider>
      <CharacterBibleContent onBack={onBack} />
    </CharacterBibleProvider>
  )
}
