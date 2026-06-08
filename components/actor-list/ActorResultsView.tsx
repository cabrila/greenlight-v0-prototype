"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, FileSpreadsheet, Pencil, Phone, Mail } from "lucide-react"
import { useActorList } from "./ActorListContext"
import ActorCard from "./ActorCard"
import { Actor } from "@/types/actor-list"
import { exportActorsAsJSON, exportActorsAsPDF, exportActorsAsExcel } from "@/lib/actor-export"
import SearchBar from "@/components/ui/SearchBar"
import ViewModeToggle, { ViewMode } from "@/components/ui/ViewModeToggle"
import Image from "next/image"

export default function ActorResultsView() {
  const { currentProject, goBack, addActor, updateActor, deleteActor, deleteProject } = useActorList()
  const [searchQuery, setSearchQuery] = useState("")
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("full")
  const gridRef = useRef<HTMLDivElement>(null)

  // Scroll to newly added item
  useEffect(() => {
    if (newItemId && gridRef.current) {
      const newElement = gridRef.current.querySelector(`[data-actor-id="${newItemId}"]`)
      if (newElement) {
        newElement.scrollIntoView({ behavior: "smooth", block: "center" })
        // Add a brief highlight effect
        newElement.classList.add("ring-2", "ring-sky-500", "ring-offset-2", "ring-offset-[#0f1f17]")
        setTimeout(() => {
          newElement.classList.remove("ring-2", "ring-sky-500", "ring-offset-2", "ring-offset-[#0f1f17]")
          setNewItemId(null)
        }, 2000)
      }
    }
  }, [newItemId, currentProject?.actors])

  if (!currentProject) return null

  const filteredActors = currentProject.actors.filter(
    (actor) =>
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.notes.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddActor = () => {
    const id = Date.now().toString()
    const newActor: Actor = {
      id,
      name: "New Actor",
      age: 30,
      playingAge: "25-35",
      phone: "+1-555-0000",
      email: "new.actor@email.com",
      headshotUrl: "",
      notes: "",
    }
    addActor(newActor)
    setNewItemId(id)
  }

  const handleExportJSON = () => {
    exportActorsAsJSON(currentProject.actors, currentProject.name)
  }

  const handleExportPDF = () => {
    exportActorsAsPDF(currentProject.actors, currentProject.name)
  }

  const handleExportExcel = () => {
    exportActorsAsExcel(currentProject.actors, currentProject.name)
  }

  const handleDeleteList = () => {
    if (confirm("Are you sure you want to delete this actor list?")) {
      deleteProject(currentProject.id)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10">
        {/* Back Navigation */}
        <div className="px-6 py-3 border-b border-white/5">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-sans">Back to My Actors</span>
          </button>
        </div>

        {/* Title and Actions */}
        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white font-sans">
              {currentProject.name}
            </h1>
            <p className="text-white/50 text-sm font-sans">
              Actor List &bull; Found {currentProject.actors.length} items.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddActor}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Add Actor"
            >
              <Plus className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Add Actor</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              title="Export as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              title="Delete List"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-sans text-sm hidden sm:inline">Delete</span>
            </button>

            {/* View Mode Toggle */}
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search actors..."
          />
        </div>
      </div>

      {/* Actors Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Full View */}
        {viewMode === "full" && (
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredActors.map((actor) => (
              <div key={actor.id} data-actor-id={actor.id} className="transition-all duration-300 rounded-xl">
                <ActorCard
                  actor={actor}
                  onUpdate={updateActor}
                  onDelete={() => deleteActor(actor.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Minimal View - Condensed cards */}
        {viewMode === "minimal" && (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {filteredActors.map((actor) => (
              <div
                key={actor.id}
                data-actor-id={actor.id}
                className="group relative p-3 rounded-lg border border-white/10 bg-[#1a2e23] hover:border-white/20 transition-colors"
              >
                {/* Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteActor(actor.id)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-500/20 flex-shrink-0">
                    {actor.headshotUrl ? (
                      <Image src={actor.headshotUrl} alt={actor.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-400 text-sm font-bold">
                        {actor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{actor.name}</h3>
                    <p className="text-xs text-white/50 truncate">
                      {actor.age && `${actor.age}yo`}
                      {actor.gender && actor.gender !== "Not-specified" && ` • ${actor.gender}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View - Grouped by gender */}
        {viewMode === "list" && (
          <div ref={gridRef} className="space-y-6">
            {["Male", "Female", "Other", "Not-specified"].map((gender) => {
              const genderActors = filteredActors.filter((a) => (a.gender || "Not-specified") === gender)
              if (genderActors.length === 0) return null

              return (
                <div key={gender} className="border border-white/10 rounded-xl overflow-hidden">
                  {/* Category Header */}
                  <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                    <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                      {gender} ({genderActors.length})
                    </h3>
                  </div>

                  {/* List Items */}
                  <div className="divide-y divide-white/5">
                    {genderActors.map((actor) => (
                      <div
                        key={actor.id}
                        data-actor-id={actor.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-sky-500/20 flex-shrink-0">
                          {actor.headshotUrl ? (
                            <Image src={actor.headshotUrl} alt={actor.name} width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sky-400 text-sm font-bold">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name & Details */}
                        <div className="w-40 sm:w-48 md:w-56 min-w-0 flex-shrink-0">
                          <h4 className="text-sm font-semibold text-white truncate">{actor.name}</h4>
                          <p className="text-xs text-white/50 truncate">
                            {actor.age && `Age: ${actor.age}`}
                            {actor.playingAge && ` • Plays: ${actor.playingAge}`}
                          </p>
                        </div>

                        {/* Contact */}
                        <div className="hidden md:flex flex-1 items-center gap-6 text-xs text-white/60 justify-start">
                          {actor.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" />
                              {actor.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {actor.email}
                          </span>
                        </div>

                        {/* Actions */}
                        <button
                          onClick={() => deleteActor(actor.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filteredActors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40 font-sans">
              {searchQuery ? "No actors found matching your search." : "No actors in this list yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
