"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { CastingState, CastingAction } from "@/types/casting"
import { clearLocalStorage, saveToLocalStorage, loadFromLocalStorage } from "@/utils/localStorage"

// --- helper ---------------------------------------------
function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : []
}
// ---------------------------------------------------------

const CastingContext = createContext<{
  state: CastingState
  dispatch: React.Dispatch<CastingAction>
} | null>(null)

// Define the complete initial state structure to ensure consistency
function getInitialState(): CastingState {
  return {
    users: [
      {
        id: "1",
        name: "John Doe",
        initials: "JD",
        email: "john@example.com",
        role: "Casting Director",
        bgColor: "#3B82F6",
        color: "#FFFFFF",
      },
      {
        id: "2",
        name: "Jane Smith",
        initials: "JS",
        email: "jane@example.com",
        role: "Producer",
        bgColor: "#10B981",
        color: "#FFFFFF",
      },
      {
        id: "3",
        name: "Mike Johnson",
        initials: "MJ",
        email: "mike@example.com",
        role: "Director",
        bgColor: "#F59E0B",
        color: "#FFFFFF",
      },
    ],
    currentUser: null, // Will be set to first user in provider
    projects: [],
    notifications: [],
    tabDefinitions: [
      { key: "longList", name: "Long List", isCustom: false },
      { key: "audition", name: "Audition", isCustom: false },
      { key: "approval", name: "Approval", isCustom: false },
    ],
    predefinedStatuses: [
      {
        id: "available",
        label: "Available",
        bgColor: "bg-green-200",
        textColor: "text-green-700",
        category: "availability",
      },
      {
        id: "busy",
        label: "Busy",
        bgColor: "bg-yellow-200",
        textColor: "text-yellow-700",
        category: "availability",
      },
      {
        id: "unavailable",
        label: "Unavailable",
        bgColor: "bg-red-200",
        textColor: "text-red-700",
        category: "availability",
      },
      {
        id: "interested",
        label: "Interested",
        bgColor: "bg-blue-200",
        textColor: "text-blue-700",
        category: "interest",
      },
      {
        id: "not-interested",
        label: "Not Interested",
        bgColor: "bg-gray-200",
        textColor: "text-gray-700",
        category: "interest",
      },
      {
        id: "contact-audition",
        label: "Audition Invite Sent",
        bgColor: "bg-purple-200",
        textColor: "text-purple-700",
        category: "contact",
      },
      {
        id: "contact-callback",
        label: "Callback Invite Sent",
        bgColor: "bg-pink-200",
        textColor: "text-pink-700",
        category: "contact",
      },
      {
        id: "contact-rejection",
        label: "Rejection Sent",
        bgColor: "bg-red-200",
        textColor: "text-red-700",
        category: "contact",
      },
      {
        id: "contact-offer",
        label: "Offer Sent",
        bgColor: "bg-green-200",
        textColor: "text-green-700",
        category: "contact",
      },
      {
        id: "contact-general",
        label: "General Contact",
        bgColor: "bg-gray-200",
        textColor: "text-gray-700",
        category: "contact",
      },
    ],
    permissionLevels: [
      { id: "admin", label: "Admin", description: "Full access to all features" },
      { id: "editor", label: "Editor", description: "Can edit actors and vote" },
      { id: "viewer", label: "Viewer", description: "Can view and vote only" },
    ],
    currentFocus: {
      currentProjectId: null,
      characterId: null,
      activeTabKey: "longList",
      cardDisplayMode: "detailed",
      currentSortOption: "alphabetical",
      searchTerm: "",
      searchTags: [],
      savedSearches: [],
      filters: {
        showFilters: false, // Add showFilters property to filters initial state
        status: [],
        ageRange: { min: 0, max: 100 },
        location: [],
      },
      playerView: {
        isOpen: false,
        currentIndex: 0,
        currentHeadshotIndex: 0,
      },
    },
    modals: {},
    cardViewSettings: {
      age: true,
      playingAge: true,
      location: true,
      agent: true,
      imdbUrl: true,
      status: true,
      skills: true,
      notes: true,
      showVotes: true,
      showActionButtons: true,
      mediaAndNotes: true,
      showProgress: true,
      showTags: true,
    },
    sortOptionDefinitions: [
      { key: "alphabetical", label: "Alphabetical (A-Z)" },
      { key: "consensus", label: "Consensus (Most Voted)" },
      { key: "status", label: "Status" },
      { key: "dateAdded", label: "Date Added (Newest)" },
      { key: "age", label: "Age (Youngest)" },
      { key: "custom", label: "Custom Order" },
    ],
    // Global default terminology (fallback)
    terminology: {
      actor: {
        singular: "Actor",
        plural: "Actors",
      },
      character: {
        singular: "Character",
        plural: "Characters",
      },
    },
    // New: Front-end only tab display names
    tabDisplayNames: {},
    scheduleEntries: [],
    scenes: [],
    productionPhases: [
      {
        id: "principal",
        name: "Principal Photography",
        startDate: "2024-03-01",
        color: "text-blue-700",
        bgColor: "bg-blue-500",
      },
      {
        id: "pickups",
        name: "Pickups",
        startDate: "2024-03-12",
        color: "text-orange-700",
        bgColor: "bg-orange-500",
      },
      {
        id: "second-unit",
        name: "Second Unit",
        startDate: "2024-03-20",
        color: "text-lime-700",
        bgColor: "bg-lime-500",
      },
      {
        id: "rehearsals",
        name: "Rehearsals",
        startDate: "2024-03-02",
        color: "text-yellow-700",
        bgColor: "bg-yellow-500",
      },
    ],
    filters: {
      status: [],
      ageRange: { min: 0, max: 100 },
      location: [],
      showFilters: false,
    },
  }
}

// Helper function to get default terminology
function getDefaultTerminology() {
  return {
    actor: {
      singular: "Actor",
      plural: "Actors",
    },
    character: {
      singular: "Character",
      plural: "Characters",
    },
  }
}

// Helper function to get current project's terminology or fallback to global
function getCurrentTerminology(state: CastingState) {
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)

  if (currentProject?.terminology) {
    return currentProject.terminology
  }

  return state.terminology
}

// Helper function to get display name for a tab
function getTabDisplayName(state: CastingState, tabKey: string): string {
  // Check if there's a custom display name
  if (state.tabDisplayNames && state.tabDisplayNames[tabKey]) {
    return state.tabDisplayNames[tabKey]
  }

  // Fall back to the original tab name
  const tab = state.tabDefinitions.find((t) => t.key === tabKey)
  return tab?.name || tabKey
}

// Helper function to ensure state has all required properties
function validateAndCompleteState(state: any): CastingState {
  const initialState = getInitialState()

  return {
    // Ensure all arrays exist and are valid
    users: Array.isArray(state.users) && state.users.length > 0 ? state.users : initialState.users,
    projects: Array.isArray(state.projects)
      ? state.projects.map((project: any) => ({
          ...project,
          // Ensure each project has terminology (either existing or default)
          terminology: project.terminology || getDefaultTerminology(),
          // Ensure each character has proper actors structure
          characters: Array.isArray(project.characters)
            ? project.characters.map((character: any) => ({
                ...character,
                actors: {
                  longList: Array.isArray(character.actors?.longList) ? character.actors.longList : [],
                  audition: Array.isArray(character.actors?.audition) ? character.actors.audition : [],
                  approval: Array.isArray(character.actors?.approval) ? character.actors.approval : [],
                  shortLists: Array.isArray(character.actors?.shortLists) ? character.actors.shortLists : [],
                  // Preserve any custom tabs while ensuring they're arrays
                  ...Object.fromEntries(
                    Object.entries(character.actors || {})
                      .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                      .map(([key, value]) => [key, Array.isArray(value) ? value : []]),
                  ),
                },
              }))
            : [],
        }))
      : initialState.projects,
    notifications: Array.isArray(state.notifications) ? state.notifications : initialState.notifications,
    tabDefinitions:
      Array.isArray(state.tabDefinitions) && state.tabDefinitions.length > 0
        ? state.tabDefinitions
        : initialState.tabDefinitions,
    predefinedStatuses:
      Array.isArray(state.predefinedStatuses) && state.predefinedStatuses.length > 0
        ? state.predefinedStatuses
        : initialState.predefinedStatuses,
    permissionLevels:
      Array.isArray(state.permissionLevels) && state.permissionLevels.length > 0
        ? state.permissionLevels
        : initialState.permissionLevels,

    // Ensure currentUser exists
    currentUser:
      state.currentUser ||
      (Array.isArray(state.users) && state.users.length > 0 ? state.users[0] : initialState.users[0]),

    // Ensure currentFocus has all required properties
    currentFocus: {
      currentProjectId: state.currentFocus?.currentProjectId || null,
      characterId: state.currentFocus?.characterId || null,
      activeTabKey: state.currentFocus?.activeTabKey || "longList",
      cardDisplayMode: state.currentFocus?.cardDisplayMode || "detailed",
      currentSortOption: state.currentFocus?.currentSortOption || "alphabetical",
      searchTerm: state.currentFocus?.searchTerm || "",
      playerView: {
        isOpen: false,
        currentIndex: 0,
        currentHeadshotIndex: 0,
        ...state.currentFocus?.playerView,
      },
      searchTags: state.currentFocus?.searchTags || [],
      savedSearches: state.currentFocus?.savedSearches || [],
      // Ensure filters object exists and has default values
      filters: {
        showFilters: state.currentFocus?.filters?.showFilters || false, // Ensure showFilters property is loaded
        status: state.currentFocus?.filters?.status || [],
        ageRange: state.currentFocus?.filters?.ageRange || { min: 0, max: 100 },
        location: state.currentFocus?.filters?.location || [],
      },
    },

    // Ensure modals object exists
    modals: state.modals || {},

    // Ensure cardViewSettings has all required properties
    cardViewSettings: {
      ...initialState.cardViewSettings,
      ...state.cardViewSettings,
    },

    // Ensure sortOptionDefinitions exists
    sortOptionDefinitions:
      Array.isArray(state.sortOptionDefinitions) && state.sortOptionDefinitions.length > 0
        ? state.sortOptionDefinitions
        : initialState.sortOptionDefinitions,

    // Ensure global terminology exists (fallback)
    terminology: state.terminology || initialState.terminology,

    // Ensure tabDisplayNames exists
    tabDisplayNames: state.tabDisplayNames || {},

    // Ensure scheduleEntries exists
    scheduleEntries: Array.isArray(state.scheduleEntries) ? state.scheduleEntries : [],
    // Ensure scenes exists
    scenes: Array.isArray(state.scenes) ? state.scenes : [],
    // Ensure productionPhases exists
    productionPhases: Array.isArray(state.productionPhases) ? state.productionPhases : initialState.productionPhases,

    // Ensure filters exists
    filters: state.filters || initialState.filters,
  }
}

function castingReducer(state: CastingState, action: CastingAction): CastingState {
  let newState = state

  switch (action.type) {
    case "UPDATE_TAB_DEFINITIONS": {
      console.log("🔧 CastingContext: Updating tab definitions:", action.payload)

      newState = {
        ...state,
        tabDefinitions: action.payload,
      }
      break
    }
    // New action for updating tab display names (front-end only)
    case "UPDATE_TAB_DISPLAY_NAME":
      newState = {
        ...state,
        tabDisplayNames: {
          ...state.tabDisplayNames,
          [action.payload.tabKey]: action.payload.displayName,
        },
      }
      break

    // New action for resetting tab display name to original
    case "RESET_TAB_DISPLAY_NAME":
      const updatedDisplayNames = { ...state.tabDisplayNames }
      delete updatedDisplayNames[action.payload.tabKey]
      newState = {
        ...state,
        tabDisplayNames: updatedDisplayNames,
      }
      break

    case "REORDER_TABS": {
      const { draggedTabKey, targetTabKey, insertPosition } = action.payload

      // Don't allow reordering of system tabs
      if (
        draggedTabKey === "longList" ||
        draggedTabKey === "approval" ||
        targetTabKey === "longList" ||
        targetTabKey === "approval"
      ) {
        console.log("🚫 CastingContext: Cannot reorder system tabs")
        return state
      }

      // Create a copy of tab definitions
      const updatedTabDefinitions = [...state.tabDefinitions]

      // Find the indices of the dragged and target tabs
      const draggedIndex = updatedTabDefinitions.findIndex((tab) => tab.key === draggedTabKey)
      const targetIndex = updatedTabDefinitions.findIndex((tab) => tab.key === targetTabKey)

      if (draggedIndex === -1 || targetIndex === -1) {
        console.log("🚫 CastingContext: Tab not found for reordering")
        return state
      }

      // Remove the dragged tab from its current position
      const [draggedTab] = updatedTabDefinitions.splice(draggedIndex, 1)

      // Calculate the new target index after removal
      const newTargetIndex = updatedTabDefinitions.findIndex((tab) => tab.key === targetTabKey)
      if (newTargetIndex === -1) {
        console.log("🚫 CastingContext: Target tab not found after removal")
        return state
      }

      // Insert the dragged tab at the new position
      const insertIndex = insertPosition === "before" ? newTargetIndex : newTargetIndex + 1
      updatedTabDefinitions.splice(insertIndex, 0, draggedTab)

      // Create notification about the reorder
      const reorderNotification = {
        id: `tab-reorder-${Date.now()}-${Math.random()}`,
        type: "system" as const,
        title: "Tab Reordered",
        message: `Tab "${draggedTab.name}" was moved ${insertPosition} "${updatedTabDefinitions.find((t) => t.key === targetTabKey)?.name}"`,
        timestamp: Date.now(),
        read: false,
        priority: "low" as const,
      }

      console.log("✅ CastingContext: Tab reorder completed successfully")

      newState = {
        ...state,
        tabDefinitions: updatedTabDefinitions,
        notifications: [reorderNotification, ...state.notifications],
      }
      break
    }

    // Update terminology for current project
    case "UPDATE_PROJECT_TERMINOLOGY":
      const currentProjectId = state.currentFocus.currentProjectId
      if (!currentProjectId) {
        console.warn("No current project selected for terminology update")
        return state
      }

      newState = {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id === currentProjectId) {
            const updatedTerminology = {
              ...(project.terminology || getDefaultTerminology()),
              [action.payload.type]: {
                ...(project.terminology?.[action.payload.type] || getDefaultTerminology()[action.payload.type]),
                [action.payload.form]: action.payload.value,
              },
            }

            return {
              ...project,
              terminology: updatedTerminology,
              modifiedDate: Date.now(),
            }
          }
          return project
        }),
      }
      break

    // Legacy global terminology update (kept for backward compatibility)
    case "UPDATE_TERMINOLOGY":
      newState = {
        ...state,
        terminology: {
          ...state.terminology,
          [action.payload.type]: {
            ...state.terminology[action.payload.type],
            [action.payload.form]: action.payload.value,
          },
        },
      }
      break

    case "LOAD_FROM_STORAGE":
      // Validate and complete the loaded state
      return validateAndCompleteState(action.payload)

    case "CLEAR_CACHE":
      clearLocalStorage()
      // Return to complete initial state with notification
      const initialState = getInitialState()
      return {
        ...initialState,
        currentUser: initialState.users[0], // Ensure currentUser is set
        notifications: [
          {
            id: `cache-cleared-${Date.now()}`,
            type: "system" as const,
            title: "Cache Cleared",
            message:
              "All cached data has been cleared. Application has been reset to initial state with default users and settings.",
            timestamp: Date.now(),
            read: false,
            priority: "medium" as const,
          },
        ],
      }

    case "LOAD_DEMO_DATA":
      // Validate the demo data before loading
      const validatedDemoData = validateAndCompleteState(action.payload)

      // Create notification about loading demo data
      const demoDataNotification = {
        id: `demo-data-loaded-${Date.now()}`,
        type: "system" as const,
        title: "Demo Data Loaded",
        message: "Application has been reset to demo data. All previous data has been replaced.",
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
      }

      newState = {
        ...validatedDemoData,
        notifications: [demoDataNotification, ...(validatedDemoData.notifications || [])],
      }
      break

    case "SET_CURRENT_USER":
      newState = { ...state, currentUser: action.payload }
      break

    case "UPDATE_USER":
      const { userId, updates } = action.payload

      // Update the user in the users array
      const updatedUsers = state.users.map((user) => (user.id === userId ? { ...user, ...updates } : user))

      // Update current user if it's the one being updated
      const updatedCurrentUser =
        state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser

      // Update all notifications that reference this user
      const updatedNotifications = state.notifications.map((notification) => {
        if (notification.userId === userId && updates.name) {
          // Update notification messages that contain the old user name
          const oldUser = state.users.find((u) => u.id === userId)
          if (oldUser && notification.message.includes(oldUser.name)) {
            return {
              ...notification,
              message: notification.message.replace(oldUser.name, updates.name),
            }
          }
        }
        return notification
      })

      // Update all notes across all projects that were created by this user
      const updatedProjectsWithNotes = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => ({
          ...character,
          actors: {
            ...character.actors,
            longList: character.actors.longList.map((actor) => ({
              ...actor,
              notes: (actor.notes || []).map((note) =>
                note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
              ),
            })),
            audition: character.actors.audition.map((actor) => ({
              ...actor,
              notes: (actor.notes || []).map((note) =>
                note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
              ),
            })),
            approval: character.actors.approval.map((actor) => ({
              ...actor,
              notes: (actor.notes || []).map((note) =>
                note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
              ),
            })),
            shortLists: character.actors.shortLists.map((sl) => ({
              ...sl,
              actors: sl.actors.map((actor) => ({
                ...actor,
                notes: (actor.notes || []).map((note) =>
                  note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
                ),
              })),
            })),
            // Handle custom tabs
            ...Object.fromEntries(
              Object.entries(character.actors)
                .filter(([key]) => !["longList", "audition", "approval", "shortLists"].includes(key))
                .map(([key, actors]) => [
                  key,
                  Array.isArray(actors)
                    ? actors.map((actor) => ({
                        ...actor,
                        notes: (actor.notes || []).map((note) =>
                          note.userId === userId && updates.name ? { ...note, userName: updates.name } : note,
                        ),
                      }))
                    : actors,
                ]),
            ),
          },
        })),
      }))

      // Create notification about the user update
      const updateNotification = {
        id: `user-updated-${Date.now()}-${Math.random()}`,
        type: "system" as const,
        title: "User Profile Updated",
        message: `User profile has been updated${updates.name ? ` - now known as "${updates.name}"` : ""}${updates.email ? ` with email "${updates.email}"` : ""}`,
        timestamp: Date.now(),
        read: false,
        priority: "low" as const,
        userId: userId,
      }

      newState = {
        ...state,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
        notifications: [updateNotification, ...updatedNotifications],
        projects: updatedProjectsWithNotes,
      }
      break

    case "SELECT_PROJECT":
      const project = state.projects.find((p) => p.id === action.payload)
      if (!project) return state
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          currentProjectId: action.payload,
          characterId: project.characters[0]?.id || null,
          activeTabKey: "longList",
          searchTerm: "", // Clear search when switching projects
          playerView: { ...state.currentFocus.playerView, isOpen: false },
        },
      }
      break

    case "SELECT_CHARACTER":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          characterId: action.payload,
          activeTabKey: "longList",
          searchTerm: "", // Clear search when switching characters
          playerView: { ...state.currentFocus.playerView, isOpen: false },
        },
      }
      break

    case "SELECT_TAB":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          activeTabKey: action.payload,
          playerView: { ...state.currentFocus.playerView, isOpen: false },
        },
      }
      break

    case "SET_SEARCH_TERM":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTerm: action.payload,
        },
      }
      break

    case "SET_SEARCH_TAGS":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: action.payload,
        },
      }
      break

    case "ADD_SEARCH_TAG":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: [...state.currentFocus.searchTags, action.payload],
        },
      }
      break

    case "REMOVE_SEARCH_TAG":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: state.currentFocus.searchTags.filter((tag) => tag.id !== action.payload),
        },
      }
      break

    case "CLEAR_SEARCH_TAGS":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          searchTags: [],
        },
      }
      break

    case "SAVE_CURRENT_SEARCH": {
      const { name, isGlobal = false } = action.payload

      console.log("[v0] ===== SAVE_CURRENT_SEARCH START =====")
      console.log("[v0] Action payload:", action.payload)
      console.log("[v0] Current searchTags:", state.currentFocus.searchTags)
      console.log("[v0] Current searchTerm:", state.currentFocus.searchTerm)
      console.log("[v0] Current savedSearches count:", state.currentFocus.savedSearches.length)
      console.log("[v0] Current savedSearches array:", state.currentFocus.savedSearches)

      const newSavedSearch = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        tags: [...state.currentFocus.searchTags],
        searchTerm: state.currentFocus.searchTerm,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isGlobal,
      }

      console.log("[v0] New saved search object:", newSavedSearch)
      console.log("[v0] Tags count in new search:", newSavedSearch.tags.length)

      const updatedSavedSearches = [...state.currentFocus.savedSearches, newSavedSearch]

      console.log("[v0] Updated savedSearches array length:", updatedSavedSearches.length)
      console.log("[v0] Updated savedSearches array:", updatedSavedSearches)

      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          savedSearches: updatedSavedSearches,
        },
      }

      console.log("[v0] newState.currentFocus.savedSearches length:", newState.currentFocus.savedSearches.length)
      console.log("[v0] newState.currentFocus.savedSearches:", newState.currentFocus.savedSearches)
      console.log("[v0] ===== SAVE_CURRENT_SEARCH END =====")
      break
    }

    case "LOAD_SAVED_SEARCH": {
      const savedSearch = state.currentFocus.savedSearches.find((search) => search.id === action.payload)
      if (savedSearch) {
        // Update last used timestamp
        const updatedSavedSearches = state.currentFocus.savedSearches.map((search) =>
          search.id === action.payload ? { ...search, lastUsed: Date.now() } : search,
        )

        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            searchTerm: savedSearch.searchTerm,
            searchTags: [...savedSearch.tags],
            savedSearches: updatedSavedSearches,
          },
        }
      } else {
        newState = state
      }
      break
    }

    case "DELETE_SAVED_SEARCH":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          savedSearches: state.currentFocus.savedSearches.filter((search) => search.id !== action.payload),
        },
      }
      break

    case "UPDATE_SAVED_SEARCH": {
      const { id, updates } = action.payload
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          savedSearches: state.currentFocus.savedSearches.map((search) =>
            search.id === id ? { ...search, ...updates } : search,
          ),
        },
      }
      break
    }

    case "SET_VIEW_MODE":
      if (action.payload === "player") {
        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            cardDisplayMode: action.payload,
            playerView: {
              ...state.currentFocus.playerView,
              isOpen: true,
              currentIndex: 0,
              currentHeadshotIndex: 0,
            },
          },
        }
      } else {
        newState = {
          ...state,
          currentFocus: {
            ...state.currentFocus,
            cardDisplayMode: action.payload,
            playerView: {
              ...state.currentFocus.playerView,
              isOpen: false,
            },
          },
        }
      }
      break

    case "SET_SORT_OPTION":
      console.log("Setting sort option to:", action.payload) // Debug log
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          currentSortOption: action.payload,
        },
      }
      break

    case "OPEN_PLAYER_VIEW":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          cardDisplayMode: "player",
          playerView: {
            ...state.currentFocus.playerView,
            isOpen: true,
            currentIndex: action.payload?.actorIndex || 0,
            currentHeadshotIndex: 0,
          },
        },
      }
      break

    case "CLOSE_PLAYER_VIEW":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          cardDisplayMode: "detailed",
          playerView: {
            ...state.currentFocus.playerView,
            isOpen: false,
          },
        },
      }
      break

    case "NAVIGATE_PLAYER_VIEW":
      const currentList = getCurrentPlayerViewList(state)
      const newIndex = Math.max(
        0,
        Math.min(state.currentFocus.playerView.currentIndex + action.payload, currentList.length - 1),
      )
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          playerView: {
            ...state.currentFocus.playerView,
            currentIndex: newIndex,
            currentHeadshotIndex: 0,
          },
        },
      }
      break

    case "SET_PLAYER_HEADSHOT":
      newState = {
        ...state,
        currentFocus: {
          ...state.currentFocus,
          playerView: {
            ...state.currentFocus.playerView,
            currentHeadshotIndex: action.payload,
          },
        },
      }
      break

    case "CAST_VOTE":
      const { actorId, characterId, vote, userId: votingUserId } = action.payload

      // Find the actor and character names for the notification
      const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
      const currentCharacter = currentProject?.characters.find((c) => c.id === characterId)
      const votingUser = state.users.find((u) => u.id === votingUserId)

      let actorName = "Unknown Actor"
      const characterName = currentCharacter?.name || "Unknown Character"

      // Find actor in all lists
      if (currentCharacter) {
        const allActors = [
          ...currentCharacter.actors.longList,
          ...currentCharacter.actors.audition,
          ...currentCharacter.actors.approval,
          ...currentCharacter.actors.shortLists.flatMap((sl) => sl.actors),
        ]
        const actor = allActors.find((a) => a.id === actorId)
        if (actor) actorName = actor.name
      }

      // Create notification for the vote
      const voteNotification = {
        id: `vote-${Date.now()}-${Math.random()}`,
        type: "vote" as const,
        title: "New Vote Cast",
        message: `${votingUser?.name || "Someone"} voted '${vote.charAt(0).toUpperCase() + vote.slice(1)}' on ${actorName} for ${characterName}`,
        timestamp: Date.now(),
        read: false,
        priority: "medium" as const,
        actorId,
        characterId,
        userId: votingUserId,
      }

      // Initialize notifications array with the vote notification
      const newNotifications = [voteNotification, ...state.notifications]

      // Process the vote and update projects
      const updatedProjects = state.projects.map((project) => ({
        ...project,
        characters: project.characters.map((character) => {
          if (character.id !== characterId) return character

          const updateActorVote = (actor: any) => {
            if (actor.id !== actorId) return actor
            const newVotes = { ...actor.userVotes, [votingUserId]: vote }
            return { ...actor, userVotes: newVotes }
          }

          return {
            ...character,
            actors: {
              ...character.actors,
              longList: character.actors.longList.map(updateActorVote),
              audition: character.actors.audition.map(updateActorVote),
              approval: character.actors.approval.map(updateActorVote),
              shortLists: character.actors.shortLists.map((sl) => ({
                ...sl,
                actors: sl.actors.map(updateActorVote),
              })),
            },
          }
        }),
      }))

      newState = {
        ...state,
        projects: updatedProjects,
        notifications: newNotifications,
      }
      break

    default:
      console.warn("Unhandled action type:", action.type)
      break
  }

  return newState
}

function getCurrentPlayerViewList(state: CastingState): any[] {
  const currentProject = state.projects.find((p) => p.id === state.currentFocus.currentProjectId)
  const currentCharacter = currentProject?.characters.find((c) => c.id === state.currentFocus.characterId)
  if (!currentCharacter) return []

  const currentTabKey = state.currentFocus.activeTabKey
  if (!currentTabKey) return []

  return currentCharacter.actors[currentTabKey] || []
}

export function CastingProvider({
  children,
  initialData,
}: {
  children: React.ReactNode
  initialData?: Partial<CastingState>
}) {
  // Initialize state with provided data or load from storage
  const [state, dispatch] = useReducer(castingReducer, getInitialState(), (initial) => {
    if (initialData) {
      return validateAndCompleteState({ ...initial, ...initialData })
    }

    // Try to load from localStorage
    if (typeof window !== "undefined") {
      const stored = loadFromLocalStorage()
      if (stored) {
        return validateAndCompleteState(stored)
      }
    }

    return initial
  })

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage(state)
      }, 500) // Debounce saves

      return () => clearTimeout(timeoutId)
    }
  }, [state])

  return <CastingContext.Provider value={{ state, dispatch }}>{children}</CastingContext.Provider>
}

export function useCasting() {
  const context = useContext(CastingContext)
  if (!context) {
    throw new Error("useCasting must be used within a CastingProvider")
  }
  return context
}

export { CastingContext, castingReducer, getInitialState, getCurrentTerminology, getTabDisplayName }
