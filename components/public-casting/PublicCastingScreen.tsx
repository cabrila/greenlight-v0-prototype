"use client"

import { useState } from "react"
import { PublicCastingProvider } from "./PublicCastingContext"
import CastingCallsList from "./CastingCallsList"
import CastingCallSetup from "./CastingCallSetup"
import SubmissionsList from "./SubmissionsList"
import FeatureLayout from "@/components/layout/FeatureLayout"

type View = "list" | "setup" | "submissions"

interface PublicCastingScreenProps {
  onBack: () => void
  onSignOut?: () => void
}

function PublicCastingContent({ onBack, onSignOut }: PublicCastingScreenProps) {
  const [view, setView] = useState<View>("list")

  const renderContent = () => {
    switch (view) {
      case "list":
        return (
          <CastingCallsList
            onNewCastingCall={() => setView("setup")}
            onViewSubmissions={() => setView("submissions")}
            onSelectCastingCall={(id) => {
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

  return (
    <FeatureLayout onBack={onBack} onSignOut={onSignOut}>
      <div className="h-full flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </FeatureLayout>
  )
}

export default function PublicCastingScreen({ onBack, onSignOut }: PublicCastingScreenProps) {
  return (
    <PublicCastingProvider>
      <PublicCastingContent onBack={onBack} onSignOut={onSignOut} />
    </PublicCastingProvider>
  )
}
