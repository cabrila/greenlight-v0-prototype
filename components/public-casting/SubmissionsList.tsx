"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, FileJson, FileSpreadsheet, Download, Filter, X, CheckSquare, Square, UserPlus, Plus } from "lucide-react"
import { usePublicCasting } from "./PublicCastingContext"
import { useActorListSafe } from "../actor-list/ActorListContext"
import SubmissionCard from "./SubmissionCard"
import { CastingSubmission } from "@/types/public-casting"
import { Actor } from "@/types/actor-list"
import { exportSubmissionsAsJSON, exportSubmissionsAsPDF, exportSubmissionsAsExcel } from "@/lib/submission-export"

interface SubmissionsListProps {
  onBack: () => void
  initialFilterForm?: string
}

type SortOption = "newest" | "oldest" | "alphabetical" | "form" | "grade-high" | "grade-low"
type GradeFilter = "all" | "graded" | "ungraded" | "high" | "medium" | "low"

interface AdvancedFilters {
  ageMin: string
  ageMax: string
  gender: string
  location: string
  availability: string
}

export default function SubmissionsList({ onBack, initialFilterForm }: SubmissionsListProps) {
  const { state, markSubmissionsAsRead, updateSubmission, deleteSubmission } = usePublicCasting()
  const actorListContext = useActorListSafe()
  const actorProjects = actorListContext?.projects ?? []
  const createActorProject = actorListContext?.createProject
  const updateActorProject = actorListContext?.updateProject
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filterByForm, setFilterByForm] = useState<string>(initialFilterForm || "all")
  const [filterByGrade, setFilterByGrade] = useState<GradeFilter>("all")
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showAddToActorsModal, setShowAddToActorsModal] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    ageMin: "",
    ageMax: "",
    gender: "",
    location: "",
    availability: "",
  })

  // Get all submissions across all projects
  const allSubmissions = useMemo(() => {
    return state.projects.flatMap((p) => p.submissions)
  }, [state.projects])

  // Get unique form names for filter
  const formNames = useMemo(() => {
    const names = new Set(allSubmissions.map((s) => s.castingCallTitle))
    return Array.from(names)
  }, [allSubmissions])

  // Mark submissions as read when viewing
  useEffect(() => {
    state.projects.forEach((p) => {
      if (p.submissions.some((s) => s.isNew)) {
        markSubmissionsAsRead(p.id)
      }
    })
  }, [state.projects, markSubmissionsAsRead])

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...allSubmissions]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.castingCallTitle.toLowerCase().includes(query)
      )
    }

    // Filter by form
    if (filterByForm !== "all") {
      result = result.filter((s) => s.castingCallTitle === filterByForm)
    }

    // Filter by grade
    if (filterByGrade !== "all") {
      switch (filterByGrade) {
        case "graded":
          result = result.filter((s) => s.grade !== undefined && s.grade > 0)
          break
        case "ungraded":
          result = result.filter((s) => !s.grade || s.grade === 0)
          break
        case "high":
          result = result.filter((s) => s.grade !== undefined && s.grade >= 8)
          break
        case "medium":
          result = result.filter((s) => s.grade !== undefined && s.grade >= 5 && s.grade < 8)
          break
        case "low":
          result = result.filter((s) => s.grade !== undefined && s.grade > 0 && s.grade < 5)
          break
      }
    }

    // Advanced filters - Age range
    if (advancedFilters.ageMin) {
      const minAge = parseInt(advancedFilters.ageMin, 10)
      if (!isNaN(minAge)) {
        result = result.filter((s) => {
          const age = parseInt(s.age || s.data?.age || "0", 10)
          return !isNaN(age) && age >= minAge
        })
      }
    }
    if (advancedFilters.ageMax) {
      const maxAge = parseInt(advancedFilters.ageMax, 10)
      if (!isNaN(maxAge)) {
        result = result.filter((s) => {
          const age = parseInt(s.age || s.data?.age || "999", 10)
          return !isNaN(age) && age <= maxAge
        })
      }
    }

    // Advanced filters - Gender (from data field)
    if (advancedFilters.gender) {
      const genderQuery = advancedFilters.gender.toLowerCase()
      result = result.filter((s) => {
        const gender = (s.data?.gender || s.data?.Gender || "").toLowerCase()
        return gender.includes(genderQuery)
      })
    }

    // Advanced filters - Location (from data field)
    if (advancedFilters.location) {
      const locationQuery = advancedFilters.location.toLowerCase()
      result = result.filter((s) => {
        const location = (s.data?.location || s.data?.Location || s.data?.city || s.data?.City || "").toLowerCase()
        return location.includes(locationQuery)
      })
    }

    // Advanced filters - Availability (from data field)
    if (advancedFilters.availability) {
      const availQuery = advancedFilters.availability.toLowerCase()
      result = result.filter((s) => {
        const availability = (s.data?.availability || s.data?.Availability || "").toLowerCase()
        return availability.includes(availQuery)
      })
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        break
      case "oldest":
        result.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
        break
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "form":
        result.sort((a, b) => a.castingCallTitle.localeCompare(b.castingCallTitle))
        break
      case "grade-high":
        result.sort((a, b) => (b.grade || 0) - (a.grade || 0))
        break
      case "grade-low":
        result.sort((a, b) => (a.grade || 0) - (b.grade || 0))
        break
    }

    return result
  }, [allSubmissions, searchQuery, filterByForm, filterByGrade, sortBy, advancedFilters])

  // Get submissions for export (selected or all filtered)
  const submissionsForExport = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredSubmissions.filter((s) => selectedIds.has(s.id))
    }
    return filteredSubmissions
  }, [filteredSubmissions, selectedIds])

  const handleUpdateSubmission = (submissionId: string, updates: Partial<CastingSubmission>) => {
    updateSubmission(submissionId, updates)
  }

  const handleDeleteSubmission = (submissionId: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      deleteSubmission(submissionId)
      // Remove from selection if selected
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(submissionId)
        return next
      })
    }
  }

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
    setSelectedIds(new Set(filteredSubmissions.map((s) => s.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const hasActiveAdvancedFilters = advancedFilters.ageMin || advancedFilters.ageMax || advancedFilters.gender || advancedFilters.location || advancedFilters.availability

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      ageMin: "",
      ageMax: "",
      gender: "",
      location: "",
      availability: "",
    })
  }

  const handleExportJSON = () => {
    exportSubmissionsAsJSON(submissionsForExport, "casting_submissions")
  }

  const handleExportPDF = () => {
    exportSubmissionsAsPDF(submissionsForExport, "casting_submissions")
  }

  const handleExportExcel = () => {
    exportSubmissionsAsExcel(submissionsForExport, "casting_submissions")
  }

  // Convert submission to actor format
  const submissionToActor = (submission: CastingSubmission): Actor => {
    return {
      id: crypto.randomUUID(),
      name: submission.name,
      age: parseInt(submission.age || submission.data?.age || "0", 10) || 0,
      playingAge: submission.playingAge || submission.data?.playingAge || submission.data?.["Playing Age"] || "",
      phone: submission.phone || submission.data?.phone || submission.data?.Phone || "",
      email: submission.email,
      headshotUrl: submission.headshot || submission.data?.headshot || submission.data?.Headshot || "",
      notes: submission.notes || submission.data?.notes || submission.data?.Notes || "",
    }
  }

  // Get selected submissions
  const selectedSubmissions = useMemo(() => {
    return filteredSubmissions.filter((s) => selectedIds.has(s.id))
  }, [filteredSubmissions, selectedIds])

  // Add selected submissions to existing actor project
  const handleAddToExistingList = (projectId: string) => {
    if (!updateActorProject) return
    const actors = selectedSubmissions.map(submissionToActor)
    const project = actorProjects.find((p) => p.id === projectId)
    if (project) {
      updateActorProject(projectId, {
        actors: [...project.actors, ...actors],
      })
    }
    setShowAddToActorsModal(false)
    clearSelection()
  }

  // Create new actor project with selected submissions
  const handleCreateNewList = () => {
    if (!newListName.trim() || !createActorProject) return
    const actors = selectedSubmissions.map(submissionToActor)
    createActorProject(newListName.trim(), actors)
    setNewListName("")
    setShowAddToActorsModal(false)
    clearSelection()
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "alphabetical", label: "A-Z by Name" },
    { value: "form", label: "By Form" },
    { value: "grade-high", label: "Highest Grade" },
    { value: "grade-low", label: "Lowest Grade" },
  ]

  const gradeOptions: { value: GradeFilter; label: string }[] = [
    { value: "all", label: "All Grades" },
    { value: "graded", label: "Graded Only" },
    { value: "ungraded", label: "Ungraded" },
    { value: "high", label: "High (8-10)" },
    { value: "medium", label: "Medium (5-7)" },
    { value: "low", label: "Low (1-4)" },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a4a2a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="px-6 py-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Casting Calls</span>
          </button>

          {/* Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white font-sans">Submissions</h1>
              <p className="text-white/50 text-sm font-sans">
                {filteredSubmissions.length} total submissions
                {selectedIds.size > 0 && (
                  <span className="text-violet-300"> ({selectedIds.size} selected)</span>
                )}
              </p>
            </div>

            {/* Selection Controls & Export Buttons */}
            <div className="flex items-center gap-2">
              {/* Add to My Actors Button - Only shows when items are selected */}
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowAddToActorsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-300 hover:text-emerald-200 transition-colors text-sm font-sans mr-2"
                  title={`Add ${selectedIds.size} selected to My Actors`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add to Actors</span>
                </button>
              )}

              {/* Selection Controls */}
              {filteredSubmissions.length > 0 && (
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={selectedIds.size === filteredSubmissions.length ? clearSelection : selectAll}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors text-sm font-sans"
                    title={selectedIds.size === filteredSubmissions.length ? "Deselect all" : "Select all"}
                  >
                    {selectedIds.size === filteredSubmissions.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {selectedIds.size === filteredSubmissions.length ? "Deselect" : "Select All"}
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

              {/* Export Buttons */}
              <button
                onClick={handleExportJSON}
                disabled={submissionsForExport.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected as JSON` : "Export as JSON"}
              >
                <FileJson className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">JSON</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={submissionsForExport.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected as Excel` : "Export as Excel"}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={submissionsForExport.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-violet-500 hover:bg-violet-400 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected as PDF` : "Export as PDF"}
              >
                <Download className="w-4 h-4" />
                <span className="font-sans text-sm hidden sm:inline">PDF</span>
              </button>
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
                placeholder="Search by name, email, or form..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans text-sm"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors font-sans min-w-[100px] ${
                showFilterPanel || hasActiveAdvancedFilters
                  ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                  : "bg-[#1a2e23] border-white/10 text-white hover:border-white/20"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {hasActiveAdvancedFilters && (
                <span className="w-2 h-2 bg-violet-400 rounded-full" />
              )}
            </button>

            {/* Form Filter */}
            <select
              value={filterByForm}
              onChange={(e) => setFilterByForm(e.target.value)}
              className="px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[140px]"
            >
              <option value="all">All Forms</option>
              {formNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Grade Filter */}
            <select
              value={filterByGrade}
              onChange={(e) => setFilterByGrade(e.target.value as GradeFilter)}
              className="px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm focus:border-violet-500/50 focus:outline-none font-sans min-w-[130px]"
            >
              {gradeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1a2e23] border border-white/10 rounded-lg text-white text-sm hover:border-white/20 transition-colors font-sans min-w-[150px]"
              >
                <SlidersHorizontal className="w-4 h-4 text-white/60" />
                <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
              </button>

              {showSortDropdown && (
                <div className="absolute top-full mt-1 right-0 w-full bg-[#1a2e23] border border-white/10 rounded-lg overflow-hidden shadow-xl z-20">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm font-sans transition-colors ${
                        sortBy === option.value
                          ? "bg-violet-500/20 text-violet-300"
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
                <h3 className="text-sm font-semibold text-white font-sans">Advanced Filters</h3>
                {hasActiveAdvancedFilters && (
                  <button
                    onClick={clearAdvancedFilters}
                    className="text-xs text-violet-300 hover:text-violet-200 transition-colors font-sans"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Age Range */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Age (Min)</label>
                  <input
                    type="number"
                    value={advancedFilters.ageMin}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, ageMin: e.target.value })}
                    placeholder="18"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Age (Max)</label>
                  <input
                    type="number"
                    value={advancedFilters.ageMax}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, ageMax: e.target.value })}
                    placeholder="65"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                  />
                </div>
                {/* Gender */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Gender</label>
                  <input
                    type="text"
                    value={advancedFilters.gender}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, gender: e.target.value })}
                    placeholder="e.g. Male, Female"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                  />
                </div>
                {/* Location */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Location</label>
                  <input
                    type="text"
                    value={advancedFilters.location}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, location: e.target.value })}
                    placeholder="e.g. Los Angeles"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                  />
                </div>
                {/* Availability */}
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-sans">Availability</label>
                  <input
                    type="text"
                    value={advancedFilters.availability}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, availability: e.target.value })}
                    placeholder="e.g. Weekends"
                    className="w-full px-3 py-2 bg-[#0f1f17] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:border-violet-500/50 focus:outline-none font-sans"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="p-6">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 font-sans">
              {searchQuery || filterByForm !== "all" || filterByGrade !== "all"
                ? "No submissions match your filters"
                : "No submissions yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onUpdate={(updates) => handleUpdateSubmission(submission.id, updates)}
                onDelete={() => handleDeleteSubmission(submission.id)}
                isSelected={selectedIds.has(submission.id)}
                onToggleSelect={() => toggleSelect(submission.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add to My Actors Modal */}
      {showAddToActorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddToActorsModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md bg-[#1a3a25] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white font-sans">Add to My Actors</h2>
              <button
                onClick={() => setShowAddToActorsModal(false)}
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
              {actorProjects.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 font-sans">
                    Existing Lists
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {actorProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleAddToExistingList(project.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 rounded-xl text-left transition-all group"
                      >
                        <div>
                          <p className="text-white font-medium font-sans text-sm">{project.name}</p>
                          <p className="text-white/40 text-xs font-sans">
                            {project.actors.length} actor{project.actors.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-white/30 group-hover:text-emerald-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New List */}
              <div>
                <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 font-sans">
                  Create New List
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-emerald-500/50 focus:outline-none font-sans text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newListName.trim()) {
                        handleCreateNewList()
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateNewList}
                    disabled={!newListName.trim()}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/30 disabled:cursor-not-allowed rounded-xl text-white font-medium text-sm transition-colors font-sans"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
