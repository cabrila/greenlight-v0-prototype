"use client"

import type React from "react"
import { useState, useRef, useMemo } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import {
  X,
  Users,
  Upload,
  ImageIcon,
  ChevronRight,
  Plus,
  Filter,
  ChevronDown,
  Check,
  SortAsc,
  User,
  CircleCheckBig,
  BookOpen,
  Home,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import AddCharacterModal from "./AddCharacterModal"
import { openModal } from "./ModalManager" // Import openModal for navigation
import type { Character, Actor } from "@/types/casting"

interface CharactersModalProps {
  onClose: () => void
}

type SortOption = "alphabetical" | "actorCount" | "progress" | "recent"
type FilterOption = "all" | "cast" | "inProgress" | "notStarted"
type GenderFilter = "all" | "male" | "female" | "other"

export default function CharactersModal({ onClose }: CharactersModalProps) {
  const { state, dispatch } = useCasting()
  const [uploadingCharacterId, setUploadingCharacterId] = useState<string | null>(null)
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const [selectedActors, setSelectedActors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [generatingArtCharacterId, setGeneratingArtCharacterId] = useState<string | null>(null)

  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const characters = currentProject?.characters || []

  // Get all actors for a character
  const getAllActors = (character: Character): Actor[] => {
    const actors: Actor[] = []
    if (character.actors) {
      actors.push(...(character.actors.longList || []))
      actors.push(...(character.actors.audition || []))
      actors.push(...(character.actors.approval || []))
      character.actors.shortLists?.forEach((sl) => {
        actors.push(...(sl.actors || []))
      })
    }
    return actors
  }

  // Get casting status for a character
  const getCastingStatus = (character: Character) => {
    const allActors = getAllActors(character)
    const greenlit = allActors.filter((a) => a.isGreenlit).length
    const total = allActors.length
    const hasGreenlit = greenlit > 0

    return {
      greenlit,
      total,
      hasGreenlit,
      progress: total > 0 ? Math.round((greenlit / Math.max(1, total)) * 100) : 0,
      status: hasGreenlit ? "cast" : total > 0 ? "inProgress" : "notStarted",
    }
  }

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (characters.length === 0) return { cast: 0, total: 0, percentage: 0 }
    const cast = characters.filter((c) => getCastingStatus(c).hasGreenlit).length
    return {
      cast,
      total: characters.length,
      percentage: Math.round((cast / characters.length) * 100),
    }
  }, [characters])

  // Filter and sort characters
  const filteredAndSortedCharacters = useMemo(() => {
    let result = [...characters]

    // Apply casting status filter
    if (filterBy !== "all") {
      result = result.filter((c) => getCastingStatus(c).status === filterBy)
    }

    // Apply gender filter (based on character description or name heuristics)
    if (genderFilter !== "all") {
      result = result.filter((c) => {
        const desc = (c.description || "").toLowerCase()
        if (genderFilter === "male") return desc.includes("male") || desc.includes("man") || desc.includes("boy")
        if (genderFilter === "female") return desc.includes("female") || desc.includes("woman") || desc.includes("girl")
        return true
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "alphabetical":
          return a.name.localeCompare(b.name)
        case "actorCount":
          return getAllActors(b).length - getAllActors(a).length
        case "progress":
          return getCastingStatus(b).progress - getCastingStatus(a).progress
        default:
          return 0
      }
    })

    return result
  }, [characters, filterBy, genderFilter, sortBy])

  const handleCharacterClick = (characterId: string) => {
    dispatch({ type: "SELECT_CHARACTER", payload: characterId })
    onClose()
  }

  const handleUploadClick = (e: React.MouseEvent, characterId: string) => {
    e.stopPropagation()
    setUploadingCharacterId(characterId)
    fileInputRef.current?.click()
  }

  const handleGenerateArt = async (e: React.MouseEvent, characterId: string, characterName: string) => {
    e.stopPropagation()
    setGeneratingArtCharacterId(characterId)

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate a placeholder image URL based on character name
    const placeholderUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(`concept art portrait of ${characterName} character cinematic dramatic lighting`)}`

    dispatch({
      type: "UPDATE_CHARACTER_CONCEPT_ART",
      payload: {
        characterId,
        conceptArt: placeholderUrl,
      },
    })

    setGeneratingArtCharacterId(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadingCharacterId) {
      const imageUrl = URL.createObjectURL(file)
      dispatch({
        type: "UPDATE_CHARACTER_CONCEPT_ART",
        payload: {
          characterId: uploadingCharacterId,
          conceptArt: imageUrl,
        },
      })
    }
    setUploadingCharacterId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleActorSelect = (e: React.MouseEvent, characterId: string, actorId: string) => {
    e.stopPropagation()
    setSelectedActors((prev) => ({
      ...prev,
      [characterId]: actorId,
    }))
  }

  const getSelectedActor = (character: Character): Actor | undefined => {
    const selectedId = selectedActors[character.id]
    if (!selectedId) return undefined
    return getAllActors(character).find((a) => a.id === selectedId)
  }

  const handleOpenCharacterBible = () => {
    onClose()
    setTimeout(() => {
      openModal("scriptAnalysis")
    }, 100)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-lg shadow-success-500/25">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Characters</h2>
                  <p className="text-sm text-slate-500">
                    {currentProject?.name || "No project selected"} - {characters.length} character
                    {characters.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleOpenCharacterBible}
                  variant="outline"
                  className="rounded-xl px-4 py-2 flex items-center gap-2 border-info-200 text-info-700 hover:bg-info-50 transition-all duration-200 bg-transparent"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Character Bible</span>
                </Button>
                <Button
                  onClick={() => setShowAddCharacterModal(true)}
                  className="bg-success-500 hover:bg-success-600 text-white rounded-xl px-4 py-2 flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Character</span>
                </Button>
                <button
                  onClick={() => {
                    onClose()
                    setTimeout(() => openModal("splashScreen"), 150)
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 flex items-center gap-1.5"
                  title="Main Menu"
                >
                  <Home className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm font-medium">Main Menu</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {characters.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Casting Progress</span>
                  <span className="text-sm font-semibold text-success-600">
                    {overallProgress.cast} / {overallProgress.total} Cast ({overallProgress.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-success-400 to-success-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${overallProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {characters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
                      <SortAsc className="w-4 h-4" />
                      Sort
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("alphabetical")} className="gap-2">
                      {sortBy === "alphabetical" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={sortBy !== "alphabetical" ? "pl-6" : ""}>Alphabetically</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("actorCount")} className="gap-2">
                      {sortBy === "actorCount" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={sortBy !== "actorCount" ? "pl-6" : ""}>Actor Count</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("progress")} className="gap-2">
                      {sortBy === "progress" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={sortBy !== "progress" ? "pl-6" : ""}>Casting Progress</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Casting Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
                      <Filter className="w-4 h-4" />
                      Status
                      {filterBy !== "all" && (
                        <span className="ml-1 px-1.5 py-0.5 bg-success-100 text-success-700 text-xs rounded-md">
                          {filterBy === "cast" ? "Cast" : filterBy === "inProgress" ? "In Progress" : "Not Started"}
                        </span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Casting Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterBy("all")} className="gap-2">
                      {filterBy === "all" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "all" ? "pl-6" : ""}>All Characters</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("cast")} className="gap-2">
                      {filterBy === "cast" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "cast" ? "pl-6" : ""}>Cast</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("inProgress")} className="gap-2">
                      {filterBy === "inProgress" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "inProgress" ? "pl-6" : ""}>In Progress</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterBy("notStarted")} className="gap-2">
                      {filterBy === "notStarted" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={filterBy !== "notStarted" ? "pl-6" : ""}>Not Started</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Gender Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg gap-2 bg-transparent">
                      <User className="w-4 h-4" />
                      Gender
                      {genderFilter !== "all" && (
                        <span className="ml-1 px-1.5 py-0.5 bg-info-100 text-info-700 text-xs rounded-md capitalize">
                          {genderFilter}
                        </span>
                      )}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuLabel>Gender</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setGenderFilter("all")} className="gap-2">
                      {genderFilter === "all" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "all" ? "pl-6" : ""}>All</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenderFilter("male")} className="gap-2">
                      {genderFilter === "male" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "male" ? "pl-6" : ""}>Male</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenderFilter("female")} className="gap-2">
                      {genderFilter === "female" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "female" ? "pl-6" : ""}>Female</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenderFilter("other")} className="gap-2">
                      {genderFilter === "other" && <Check className="w-4 h-4 text-success-500" />}
                      <span className={genderFilter !== "other" ? "pl-6" : ""}>Other</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Active Filters Count */}
                {(filterBy !== "all" || genderFilter !== "all") && (
                  <button
                    onClick={() => {
                      setFilterBy("all")
                      setGenderFilter("all")
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline ml-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-50/50 to-white">
            {characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Characters Yet</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  Create your first character to start organizing actors for your casting sessions.
                </p>
                <Button
                  onClick={() => setShowAddCharacterModal(true)}
                  className="bg-success-500 hover:bg-success-600 text-white rounded-xl px-6 py-3 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Character</span>
                </Button>
              </div>
            ) : filteredAndSortedCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Filter className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No Matching Characters</h3>
                <p className="text-slate-500 mb-6 max-w-md">
                  No characters match your current filters. Try adjusting your filter settings.
                </p>
                <Button
                  onClick={() => {
                    setFilterBy("all")
                    setGenderFilter("all")
                  }}
                  variant="outline"
                  className="rounded-xl"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredAndSortedCharacters.map((character) => {
                  const allActors = getAllActors(character)
                  const castingStatus = getCastingStatus(character)
                  const isSelected = state.currentFocus.characterId === character.id
                  const selectedActor = getSelectedActor(character)
                  const greenlitActors = allActors.filter((a) => a.isGreenlit)

                  return (
                    <div
                      key={character.id}
                      onClick={() => handleCharacterClick(character.id)}
                      className={`group relative bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        isSelected
                          ? "border-success-500 ring-2 ring-success-500/20 shadow-lg"
                          : "border-slate-200 hover:border-success-300"
                      }`}
                    >
                      {/* Concept Art / Placeholder Image */}
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                        {character.conceptArt ? (
                          <img
                            src={character.conceptArt || "/placeholder.svg"}
                            alt={`${character.name} concept art`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-xs font-medium">No concept art</span>
                          </div>
                        )}

                        {/* Upload Button Overlay */}
                        <button
                          onClick={(e) => handleUploadClick(e, character.id)}
                          className="absolute bottom-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105"
                          title="Upload concept art"
                        >
                          <Upload className="w-4 h-4 text-slate-600" />
                        </button>

                        {/* AI Generate Button Overlay */}
                        <button
                          onClick={(e) => handleGenerateArt(e, character.id, character.name)}
                          disabled={generatingArtCharacterId === character.id}
                          className="absolute bottom-3 right-14 p-2.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-105 disabled:opacity-100 disabled:cursor-wait"
                          title="Generate AI concept art"
                        >
                          {generatingArtCharacterId === character.id ? (
                            <div className="w-4 h-4 border-2 border-success-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-success-600" />
                          )}
                        </button>

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          {isSelected && (
                            <div className="px-2.5 py-1 bg-success-500 text-white text-xs font-semibold rounded-lg shadow-md">
                              Current
                            </div>
                          )}
                          {castingStatus.hasGreenlit && (
                            <div className="px-2.5 py-1 bg-success-100 text-success-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1">
                              <CircleCheckBig className="w-3 h-3" />
                              Cast
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Character Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 text-lg leading-tight truncate">
                            {character.name}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-success-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                        </div>

                        {character.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{character.description}</p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">
                              {allActors.length} actor{allActors.length !== 1 ? "s" : ""}
                            </span>
                            {greenlitActors.length > 0 && (
                              <span className="px-2.5 py-1 bg-success-100 text-success-600 rounded-lg font-medium flex items-center gap-1">
                                <CircleCheckBig className="w-3 h-3" />
                                {greenlitActors.length}
                              </span>
                            )}
                          </div>

                          {/* Actor Selector Dropdown */}
                          {allActors.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="flex items-center gap-1.5 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                  {selectedActor ? (
                                    <>
                                      {selectedActor.headshots?.[0] ? (
                                        <img
                                          src={selectedActor.headshots[0] || "/placeholder.svg"}
                                          alt={selectedActor.name}
                                          className="w-4 h-4 rounded-full object-cover"
                                        />
                                      ) : (
                                        <User className="w-3 h-3" />
                                      )}
                                      <span className="max-w-16 truncate">{selectedActor.name}</span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-3 h-3" />
                                      <span>Select</span>
                                    </>
                                  )}
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-56 max-h-64 overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuLabel>Select Actor</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {greenlitActors.length > 0 && (
                                  <>
                                    <DropdownMenuLabel className="text-xs text-success-600 flex items-center gap-1">
                                      <CircleCheckBig className="w-3 h-3" />
                                      Greenlit
                                    </DropdownMenuLabel>
                                    {greenlitActors.map((actor) => (
                                      <DropdownMenuItem
                                        key={actor.id}
                                        onClick={(e) => handleActorSelect(e, character.id, actor.id)}
                                        className="gap-2"
                                      >
                                        {actor.headshots?.[0] ? (
                                          <img
                                            src={actor.headshots[0] || "/placeholder.svg"}
                                            alt={actor.name}
                                            className="w-6 h-6 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                            <User className="w-3 h-3 text-slate-500" />
                                          </div>
                                        )}
                                        <span className="flex-1 truncate">{actor.name}</span>
                                        {selectedActors[character.id] === actor.id && (
                                          <Check className="w-4 h-4 text-success-500" />
                                        )}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {allActors
                                  .filter((a) => !a.isGreenlit)
                                  .slice(0, 10)
                                  .map((actor) => (
                                    <DropdownMenuItem
                                      key={actor.id}
                                      onClick={(e) => handleActorSelect(e, character.id, actor.id)}
                                      className="gap-2"
                                    >
                                      {actor.headshots?.[0] ? (
                                        <img
                                          src={actor.headshots[0] || "/placeholder.svg"}
                                          alt={actor.name}
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                          <User className="w-3 h-3 text-slate-500" />
                                        </div>
                                      )}
                                      <span className="flex-1 truncate">{actor.name}</span>
                                      {selectedActors[character.id] === actor.id && (
                                        <Check className="w-4 h-4 text-success-500" />
                                      )}
                                    </DropdownMenuItem>
                                  ))}
                                {allActors.filter((a) => !a.isGreenlit).length > 10 && (
                                  <DropdownMenuItem disabled className="text-xs text-slate-400">
                                    +{allActors.filter((a) => !a.isGreenlit).length - 10} more...
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {selectedActor && (
                          <div className="mt-3 p-2 bg-slate-50 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            {selectedActor.headshots?.[0] ? (
                              <img
                                src={selectedActor.headshots[0] || "/placeholder.svg"}
                                alt={selectedActor.name}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{selectedActor.name}</p>
                              <p className="text-xs text-slate-500">
                                {selectedActor.isGreenlit ? (
                                  <span className="text-success-600 flex items-center gap-1">
                                    <CircleCheckBig className="w-3 h-3" /> Greenlit
                                  </span>
                                ) : (
                                  selectedActor.age || "Actor"
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {showAddCharacterModal && <AddCharacterModal onClose={() => setShowAddCharacterModal(false)} />}
    </>
  )
}
