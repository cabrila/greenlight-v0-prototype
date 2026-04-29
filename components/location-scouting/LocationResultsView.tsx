"use client"

import { useState } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, Search } from "lucide-react"
import { useLocationScouting } from "./LocationScoutingContext"
import LocationCard from "./LocationCard"
import { Location } from "@/types/location-scouting"

export default function LocationResultsView() {
  const {
    currentProject,
    setView,
    updateLocation,
    deleteLocation,
    addLocation,
    deleteProject,
  } = useLocationScouting()
  const [searchQuery, setSearchQuery] = useState("")

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50 font-sans">No project selected</p>
      </div>
    )
  }

  const filteredLocations = currentProject.locations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddLocation = () => {
    const newLocation: Location = {
      id: crypto.randomUUID(),
      name: "NEW LOCATION",
      type: "EXT",
      timeOfDay: "DAY",
      description: "Enter a description for this location...",
      scoutingNotes: "Add scouting notes here...",
    }
    addLocation(currentProject.id, newLocation)
  }

  const handleExportJSON = () => {
    const data = JSON.stringify(currentProject, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentProject.name.toLowerCase().replace(/\s+/g, "-")}-locations.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteList = () => {
    if (confirm("Are you sure you want to delete this entire location list?")) {
      deleteProject(currentProject.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 p-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("projects")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to projects"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">
                {currentProject.name}
              </h1>
              <p className="text-white/50 font-sans text-sm">
                Location List • Found {currentProject.locations.length} items.
              </p>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAddLocation}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-sans text-sm transition-colors"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-black font-semibold font-sans text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Save PDF
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-sans text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete List
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a2e23] border border-white/10 rounded-lg text-white placeholder-white/40 font-sans text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </header>

      {/* Locations Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onUpdate={(updated) => updateLocation(currentProject.id, updated)}
              onDelete={() => deleteLocation(currentProject.id, location.id)}
            />
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-white/50 font-sans mb-4">
              {searchQuery ? "No locations match your search" : "No locations yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddLocation}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-black font-semibold font-sans text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Location
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
