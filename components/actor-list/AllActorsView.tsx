"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, Filter, X, CheckSquare, Square, Plus, AlertTriangle, Phone, Mail, Pencil, Trash2 } from "lucide-react"
import { useActorList } from "./ActorListContext"
import Image from "next/image"

type SortOption = "newest" | "oldest" | "alphabetical" | "age-high" | "age-low"
type GenderFilter = "all" | "Male" | "Female" | "Other" | "Not-specified"

interface AdvancedFilters {
  ageMin: string
  ageMax: string
  gender: GenderFilter
  duplicatesOnly: boolean
}

export default function AllActorsView() {
  const { allActors, projects, goBack, addActorToList, dismissDuplicate, deleteActor } = useActorList()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    ageMin: "",
    ageMax: "",
    gender: "all",
    duplicatesOnly: false,
  })

  // Filter and sort actors
  const filteredActors = useMemo(() => {
    let result = [...allActors]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.email.toLowerCase().includes(query) ||
          a.notes.toLowerCase().includes(query) ||
          a.sourceListNames.some((name) => name.toLowerCase().includes(query))
      )
    }

    // Filter by age range
    if (advancedFilters.ageMin) {
      const minAge = parseInt(advancedFilters.ageMin, 10)
      if (!isNaN(minAge)) {
        result = result.filter((a) => a.age >= minAge)
      }
    }
    if (advancedFilters.ageMax) {
      const maxAge = parseInt(advancedFilters.ageMax, 10)
      if (!isNaN(maxAge)) {
        result = result.filter((a) => a.age <= maxAge)
      }
    }

    // Filter by gender
    if (advancedFilters.gender !== "all") {
      result = result.filter((a) => a.gender === advancedFilters.gender)
    }

    // Filter duplicates only
    if (advancedFilters.duplicatesOnly) {
      result = result.filter((a) => a.isDuplicate)
    }

    // Sort
    switch (sortBy) {
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "newest":
        // Sort by number of lists (more lists = more recent activity)
        result.sort((a, b) => b.sourceListIds.length - a.sourceListIds.length)
        break
      case "oldest":
        result.sort((a, b) => a.sourceListIds.length - b.sourceListIds.length)
        break
      case "age-high":
        result.sort((a, b) => b.age - a.age)
        break
      case "age-low":
        result.sort((a, b) => a.age - b.age)
        break
    }

    return result
  }, [allActors, searchQuery, sortBy, advancedFilters])

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredActors.map((a) => a.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Add selected actors to a list
  const handleAddToList = (projectId: string) => {
    selectedIds.forEach((actorId) => {
      addActorToList(actorId, projectId)
    })
    setShowAddToListModal(false)
    clearSelection()
  }

  const hasActiveAdvancedFilters =
    advancedFilters.ageMin ||
    advancedFilters.ageMax ||
    advancedFilters.gender !== "all" ||
    advancedFilters.duplicatesOnly

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "alphabetical", label: "A-Z by Name" },
    { value: "newest", label: "Most Lists" },
    { value: "oldest", label: "Fewest Lists" },
    { value: "age-high", label: "Oldest Age" },
    { value: "age-low", label: "Youngest Age" },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a4a2a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4">
          {/* Back Button */}
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Actors</span>
          </button>

          {/* Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">All Actors</h1>
              <p className="text-white/50 text-sm font-sans">
                {filteredActors.length} total actors across {projects.length} lists
                {selectedIds.size > 0 && (
                  <span className="text-sky-300"> ({selectedIds.size} selected)</span>
                )}
              </p>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center gap-2">
              {/* Add to List Button - Only shows when items are selected */}
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowAddToListModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg text-sky-300 hover:text-sky-200 transition-colors text-sm font-sans mr-2"
                  title={`Add ${selectedIds.size} selected to a list`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add to List</span>
                </button>
              )}

              {/* Selection Controls */}
              {filteredActors.length > 0 && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={selectedIds.size === filteredActors.length ? clearSelection : selectAll}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors text-sm font-sans"
                    title={selectedIds.size === filteredActors.length ? "Deselect all" : "Select all"}
                  >
                    {selectedIds.size === filteredActors.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {selectedIds.size === filteredActors.length ? "Deselect" : "Select All"}
                    </span>
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={clearSelection}
                      className="flex items-center gap-1 px-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors text-sm"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, notes, or list..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans text-sm"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors font-sans min-w-[100px] ${
                showFilterPanel || hasActiveAdvancedFilters
                  ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                  : "bg-[#1a2e23] border-white/10 text-white hover:border-white/20"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {hasActiveAdvancedFilters && <span className="w-2 h-2 bg-sky-400 rounded-full" />}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[140px]"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a3a25] border border-white/15 rounded-xl shadow-xl z-20 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-sans transition-colors ${
                        sortBy === option.value
                          ? "bg-sky-500/20 text-sky-300"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filter Panel */}
          {showFilterPanel && (
            <div className="mt-4 p-4 bg-[#1a2e23] border border-white/10 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white font-sans">Advanced Filters</h3>
                {hasActiveAdvancedFilters && (
                  <button
                    onClick={() =>
                      setAdvancedFilters({
                        ageMin: "",
                        ageMax: "",
                        gender: "all",
                        duplicatesOnly: false,
                      })
                    }
                    className="text-xs text-sky-400 hover:text-sky-300 font-sans"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Age Range */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Age Min</label>
                  <input
                    type="number"
                    value={advancedFilters.ageMin}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, ageMin: e.target.value })}
                    placeholder="Min age"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Age Max</label>
                  <input
                    type="number"
                    value={advancedFilters.ageMax}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, ageMax: e.target.value })}
                    placeholder="Max age"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-sky-500/50 focus:outline-none font-sans"
                  />
                </div>
                {/* Gender */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Gender</label>
                  <select
                    value={advancedFilters.gender}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, gender: e.target.value as GenderFilter })}
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm focus:border-sky-500/50 focus:outline-none font-sans"
                  >
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Not-specified">Not-specified</option>
                  </select>
                </div>
                {/* Duplicates Only */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Duplicates</label>
                  <button
                    onClick={() =>
                      setAdvancedFilters({ ...advancedFilters, duplicatesOnly: !advancedFilters.duplicatesOnly })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-sans transition-colors ${
                      advancedFilters.duplicatesOnly
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-[#0f1f17] border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    {advancedFilters.duplicatesOnly ? "Showing Duplicates" : "Show Duplicates Only"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actor Cards */}
      <div className="p-6">
        {filteredActors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredActors.map((actor) => (
              <div
                key={actor.id}
                className={`group relative p-5 rounded-xl border bg-[#1a2e23] transition-colors ${
                  selectedIds.has(actor.id) 
                    ? "border-sky-500/50 ring-2 ring-sky-500/20" 
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Action Icons - Upper Right Corner */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  {/* Edit & Delete - Show on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {/* Edit functionality handled by ActorCard if needed */}}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors"
                      title="Edit actor"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteActor(actor.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Delete actor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Duplicate Badge */}
                  {actor.isDuplicate && (
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-300 font-sans">Duplicate</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissDuplicate(actor.name)
                        }}
                        className="ml-1 text-amber-400 hover:text-amber-200"
                        title="Dismiss duplicate flag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Header with Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Selection Checkbox - Before Avatar */}
                  <button
                    onClick={() => toggleSelect(actor.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 mt-1 ${
                      selectedIds.has(actor.id) 
                        ? "bg-sky-500 border-sky-500 text-white" 
                        : "border-white/30 hover:border-sky-400 bg-transparent"
                    }`}
                    title={selectedIds.has(actor.id) ? "Deselect" : "Select"}
                  >
                    {selectedIds.has(actor.id) && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-sky-500/20 flex-shrink-0">
                    {actor.headshotUrl ? (
                      <Image
                        src={actor.headshotUrl}
                        alt={actor.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-400 text-xl font-bold">
                        {actor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name & Age */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold text-white font-sans uppercase tracking-wide truncate pr-20">
                      {actor.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      {actor.age && (
                        <span className="text-white/60">
                          AGE <span className="text-white">{actor.age}</span>
                        </span>
                      )}
                      {actor.gender && (
                        <span className="text-white/60">
                          <span className="text-white">{actor.gender}</span>
                        </span>
                      )}
                      {actor.playingAge && (
                        <span className="text-white/60">
                          PLAYS <span className="text-emerald-400">{actor.playingAge}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* List Tags - Between Name/Age and Contact Details */}
                {actor.sourceListNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4 px-3 py-2 bg-sky-500/10 rounded-lg">
                    {actor.sourceListNames.map((listName, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 rounded text-xs text-sky-300 font-sans truncate max-w-[120px]"
                        title={listName}
                      >
                        {listName}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contact Details */}
                <div className="p-3 bg-[#0f1f17] rounded-lg mb-4">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                    Contact Details
                  </p>
                  <div className="space-y-2">
                    {actor.phone && (
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <Phone className="w-4 h-4 text-white/40" />
                        <span>{actor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Mail className="w-4 h-4 text-white/40" />
                      <span className="truncate">{actor.email}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {actor.notes && (
                  <div className="p-3 bg-[#0f1f17] rounded-lg">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-white/80 font-sans leading-relaxed line-clamp-3">
                      {actor.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/40 font-sans">
              {searchQuery || hasActiveAdvancedFilters
                ? "No actors found matching your filters."
                : "No actors in any list yet."}
            </p>
          </div>
        )}
      </div>

      {/* Add to List Modal */}
      {showAddToListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddToListModal(false)} />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#1a3a25] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white font-sans">Add to List</h2>
              <button
                onClick={() => setShowAddToListModal(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-white/60 text-sm mb-4 font-sans">
                Add {selectedIds.size} selected actor{selectedIds.size !== 1 ? "s" : ""} to a list:
              </p>

              {/* Existing Lists */}
              {projects.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleAddToList(project.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/30 rounded-xl text-left transition-all group"
                    >
                      <div>
                        <p className="text-white font-medium font-sans text-sm">{project.name}</p>
                        <p className="text-white/40 text-xs font-sans">
                          {project.actors.length} actor{project.actors.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-white/30 group-hover:text-sky-400 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm font-sans text-center py-4">
                  No lists available. Create a list first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
