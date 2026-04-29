"use client"

import { useState } from "react"
import { ArrowLeft, Plus, FileJson, Download, Trash2, Search } from "lucide-react"
import { useActorList } from "./ActorListContext"
import ActorCard from "./ActorCard"
import { Actor } from "@/types/actor-list"

export default function ActorResultsView() {
  const { currentProject, goBack, addActor, updateActor, deleteActor, deleteProject } = useActorList()
  const [searchQuery, setSearchQuery] = useState("")

  if (!currentProject) return null

  const filteredActors = currentProject.actors.filter(
    (actor) =>
      actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.notes.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddActor = () => {
    const newActor: Actor = {
      id: Date.now().toString(),
      name: "New Actor",
      age: 30,
      playingAge: "25-35",
      phone: "+1-555-0000",
      email: "new.actor@email.com",
      headshotUrl: "",
      notes: "",
    }
    addActor(newActor)
  }

  const handleExportJSON = () => {
    const data = JSON.stringify(currentProject.actors, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentProject.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteList = () => {
    if (confirm("Are you sure you want to delete this actor list?")) {
      deleteProject(currentProject.id)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white font-sans">
                {currentProject.name}
              </h1>
              <p className="text-white/50 text-sm font-sans">
                Actor List &bull; Found {currentProject.actors.length} items.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddActor}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="font-sans text-sm">Add Actor</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
            >
              <FileJson className="w-4 h-4" />
              <span className="font-sans text-sm">JSON</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors">
              <Download className="w-4 h-4" />
              <span className="font-sans text-sm">Save PDF</span>
            </button>
            <button
              onClick={handleDeleteList}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-sans text-sm">Delete List</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 font-sans focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Actors Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredActors.map((actor) => (
            <ActorCard
              key={actor.id}
              actor={actor}
              onUpdate={updateActor}
              onDelete={() => deleteActor(actor.id)}
            />
          ))}
        </div>

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
