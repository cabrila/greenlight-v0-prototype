"use client"

import { useState } from "react"
import { PublicCastingProvider } from "./PublicCastingContext"
import CastingCallsList from "./CastingCallsList"
import CastingCallSetup from "./CastingCallSetup"
import SubmissionsList from "./SubmissionsList"

type View = "list" | "setup" | "submissions"

interface PublicCastingScreenProps {
  onBack: () => void
}

function PublicCastingContent({ onBack }: PublicCastingScreenProps) {
  const [view, setView] = useState<View>("list")

  switch (view) {
    case "list":
      return (
        <CastingCallsList
          onBack={onBack}
          onNewCastingCall={() => setView("setup")}
          onViewSubmissions={() => setView("submissions")}
          onSelectCastingCall={(id) => {
            // Could show casting call details/edit view here
            console.log("Selected casting call:", id)
          }}
        />
      )
    case "setup":
      return (
        <CastingCallSetup
          onBack={() => setView("list")}
          onSuccess={() => setView("list")}
        />
      )
    case "submissions":
      return <SubmissionsList onBack={() => setView("list")} />
    default:
      return null
  }
}

export default function PublicCastingScreen({ onBack }: PublicCastingScreenProps) {
  return (
    <PublicCastingProvider>
      <PublicCastingContent onBack={onBack} />
    </PublicCastingProvider>
  )
}
