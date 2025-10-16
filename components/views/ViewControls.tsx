"use client"

import type React from "react"

import { useCasting } from "@/components/casting/CastingContext"
import { Search, Grid3X3, List, LayoutGrid, SortAsc, Filter, Plus, Upload, Bookmark, Calendar } from "lucide-react"
import { useState } from "react"
import { openModal } from "@/components/modals/ModalManager"
import TerminologyContextMenu from "@/components/ui/TerminologyContextMenu"
import SearchTags from "@/components/ui/SearchTags"
import SavedSearchesManager from "@/components/ui/SavedSearchesManager"
import type { SearchTag } from "@/components/ui/SearchTags"
import { useActorGrid } from "@/components/actors/ActorGridContext"

export default function ViewControls() {
  const { state, dispatch } = useCasting()
  const { selectedActorIds } = useActorGrid()
  const { searchTerm, searchTags, savedSearches, cardDisplayMode, currentSortOption } = state.currentFocus

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)

  // Get current terminology
  const getCurrentTerminology = () => {
    const defaultTerminology = {
      actor: {
        singular: "Actor",
        plural: "Actors",
      },
      character: {
        singular: "Character",
        plural: "Characters",
      },
    }

    let projectTerminology = {}
    if (currentProject?.terminology) {
      projectTerminology = currentProject.terminology
    } else if (state.terminology) {
      projectTerminology = state.terminology
    }

    const mergedTerminology = {
      ...defaultTerminology,
      ...projectTerminology,
    }

    if (!mergedTerminology.actor || typeof mergedTerminology.actor !== "object") {
      mergedTerminology.actor = defaultTerminology.actor
    }
    if (!mergedTerminology.character || typeof mergedTerminology.character !== "object") {
      mergedTerminology.character = defaultTerminology.character
    }

    mergedTerminology.actor = {
      singular: mergedTerminology.actor?.singular || defaultTerminology.actor.singular,
      plural: mergedTerminology.actor?.plural || defaultTerminology.actor.plural,
    }
    mergedTerminology.character = {
      singular: mergedTerminology.character?.singular || defaultTerminology.character.singular,
      plural: mergedTerminology.character?.plural || defaultTerminology.character.plural,
    }

    return mergedTerminology
  }

  const terminology = getCurrentTerminology()
  const { activeTabKey } = state.currentFocus
  const isLongListTab = activeTabKey === "longList"

  const [showFilters, setShowFilters] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)

  const handleSearchTagsChange = (tags: SearchTag[]) => {
    dispatch({
      type: "SET_SEARCH_TAGS",
      payload: tags,
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: "SET_SEARCH_TERM",
      payload: e.target.value,
    })
  }

  const handleViewModeChange = (mode: "detailed" | "simple" | "list-view") => {
    dispatch({
      type: "SET_VIEW_MODE",
      payload: mode,
    })
  }

  const handleSortChange = (sortOption: string) => {
    dispatch({
      type: "SET_SORT_OPTION",
      payload: sortOption,
    })
  }

  const handleAddActor = () => {
    if (currentCharacter) {
      openModal("addActor", { characterId: currentCharacter.id })
    }
  }

  const handleUploadActors = () => {
    if (currentCharacter) {
      openModal("uploadActorsMenu", { characterId: currentCharacter.id })
    }
  }

  const handleBookAudition = () => {
    const selectedActors = Array.from(selectedActorIds || new Set())

    dispatch({
      type: "OPEN_MODAL",
      payload: {
        type: "bookAudition",
        data: {
          selectedCharacters: currentCharacter ? [currentCharacter.id] : [],
          preselectedActors: selectedActors,
        },
      },
    })
  }

  const sortOptions = state.sortOptionDefinitions || [
    { key: "alphabetical", label: "Alphabetical" },
    { key: "dateAdded", label: "Date Added" },
    { key: "consensus", label: "Consensus" },
    { key: "status", label: "Status" },
    { key: "age", label: "Age" },
    { key: "custom", label: "Custom Order" },
  ]

  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    type: "actor" | "character"
    form: "singular" | "plural"
    currentValue: string
  } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, type: "actor" | "character", form: "singular" | "plural") => {
    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      form,
      currentValue: terminology[type][form],
    })

    return false
  }

  return (
    <div className="space-y-3">
      {/* Main Controls Container - Responsive Layout */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* Left Section - Action Buttons, View Presets, Sort, and Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* Action Buttons - Only show on Long List tab */}
            {isLongListTab && currentCharacter && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAddActor}
                  onContextMenu={(e) => handleContextMenu(e, "actor", "singular")}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {terminology.actor.singular}</span>
                </button>
                <button
                  onClick={handleUploadActors}
                  onContextMenu={(e) => handleContextMenu(e, "actor", "singular")}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </button>
                <button
                  onClick={handleBookAudition}
                  disabled={!selectedActorIds || selectedActorIds.size === 0}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all duration-200 text-sm whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Audition</span>
                </button>
                <div className="w-px h-6 bg-slate-300 mx-1"></div>
              </div>
            )}

            {/* View Mode Presets */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange("detailed")}
                  className={`p-2 rounded-md transition-colors ${
                    cardDisplayMode === "detailed"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title="Detailed View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange("simple")}
                  className={`p-2 rounded-md transition-colors ${
                    cardDisplayMode === "simple"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title="Simple View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange("list-view")}
                  className={`p-2 rounded-md transition-colors ${
                    cardDisplayMode === "list-view"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="w-px h-6 bg-slate-300 mx-3"></div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Sort:</span>
              <div className="relative">
                <select
                  value={currentSortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors min-w-[120px]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <SortAsc className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                  showFilters
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Right Section - Enhanced Search Field with Saved Searches */}
          <div className="relative flex items-center gap-2 flex-shrink-0 w-full sm:w-auto sm:max-w-[400px]">
            <div className="relative">
              <button
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className={`p-2 rounded-lg border transition-colors ${
                  showSavedSearches || savedSearches.length > 0
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-400"
                }`}
                title="Saved Searches"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              {savedSearches.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {savedSearches.length}
                </span>
              )}
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <SearchTags
                tags={searchTags}
                onTagsChange={handleSearchTagsChange}
                placeholder="Search actors, gender, ethnicity, skills... Press Enter to create tags"
                className="w-full"
                maxTags={8}
                allowDuplicates={false}
              />
            </div>

            {showSavedSearches && (
              <div className="absolute top-full right-0 mt-2 w-96 z-20">
                <SavedSearchesManager onClose={() => setShowSavedSearches(false)} />
              </div>
            )}
          </div>
        </div>

        {/* Search Help Text */}
        {(searchTags.length > 0 || searchTerm) && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              <span className="font-medium">Search includes:</span> Name, Gender, Ethnicity, Language, Height, Body
              Type, Shoe Size, Hair Color, Eye Color, Nakedness Level, Past Productions, Skills & Abilities, Location,
              Agent
              {searchTags.length > 0 && (
                <>
                  <br />
                  <span className="font-medium">Active search tags:</span>{" "}
                  {searchTags.map((tag) => tag.text).join(", ")}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Filters Panel */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card View Settings */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Display Options</h4>
              <div className="space-y-2">
                {Object.entries(state.cardViewSettings).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_CARD_SETTINGS",
                          payload: { field: key, value: e.target.checked },
                        })
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-sm text-slate-600 capitalize">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Status Filters</h4>
              <div className="text-sm text-slate-500 italic">Coming soon...</div>
            </div>

            {/* Age Range */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Age Range</h4>
              <div className="text-sm text-slate-500 italic">Coming soon...</div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Location</h4>
              <div className="text-sm text-slate-500 italic">Coming soon...</div>
            </div>
          </div>
        </div>
      )}
      {/* Terminology Context Menu */}
      {contextMenu && (
        <TerminologyContextMenu
          show={contextMenu.show}
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          form={contextMenu.form}
          currentValue={contextMenu.currentValue}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
