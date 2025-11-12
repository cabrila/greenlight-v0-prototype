const STORAGE_KEY = "greenlight-casting-state"

export function saveToLocalStorage(state: any): void {
  try {
    // Only save if we're in the browser
    if (typeof window === "undefined") return

    console.log("[v0] ===== saveToLocalStorage START =====")
    console.log("[v0] Incoming state.currentFocus.savedSearches:", state.currentFocus?.savedSearches)
    console.log("[v0] Saved searches count:", state.currentFocus?.savedSearches?.length || 0)

    // Create a clean copy of the state for storage
    const stateToSave = {
      ...state,
      // Don't save temporary UI state
      currentFocus: {
        ...state.currentFocus,
        playerView: {
          ...state.currentFocus.playerView,
          isOpen: false, // Don't persist open player view
        },
      },
      // Don't save modal states
      modals: {},
    }

    console.log("[v0] After creating stateToSave - savedSearches:", stateToSave.currentFocus?.savedSearches)
    console.log("[v0] After creating stateToSave - count:", stateToSave.currentFocus?.savedSearches?.length || 0)

    const serializedState = JSON.stringify(stateToSave)
    localStorage.setItem(STORAGE_KEY, serializedState)

    // Verify the save by reading back
    const verification = localStorage.getItem(STORAGE_KEY)
    if (verification) {
      const parsed = JSON.parse(verification)
      console.log("[v0] Verification - savedSearches in localStorage:", parsed.currentFocus?.savedSearches?.length || 0)
    }

    console.log("[v0] State successfully saved to localStorage")
    console.log("[v0] ===== saveToLocalStorage END =====")
  } catch (error) {
    console.error("[v0] ERROR: Failed to save state to localStorage:", error)
  }
}

export function loadFromLocalStorage(): any | null {
  try {
    // Only load if we're in the browser
    if (typeof window === "undefined") return null

    const serializedState = localStorage.getItem(STORAGE_KEY)
    if (serializedState === null) return null

    const parsedState = JSON.parse(serializedState)

    // Validate that the loaded state has the expected structure
    if (!parsedState || typeof parsedState !== "object") {
      console.warn("Invalid state structure in localStorage")
      return null
    }

    // Ensure required properties exist
    if (!parsedState.projects || !Array.isArray(parsedState.projects)) {
      console.warn("Invalid projects data in localStorage")
      return null
    }

    return parsedState
  } catch (error) {
    console.warn("Failed to load state from localStorage:", error)
    return null
  }
}

export function clearLocalStorage(): void {
  try {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn("Failed to clear localStorage:", error)
  }
}

export function getStorageSize(): string {
  try {
    if (typeof window === "undefined") return "0 KB"

    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return "0 KB"

    const sizeInBytes = new Blob([data]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)

    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${sizeInKB} KB`
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
    }
  } catch (error) {
    console.warn("Failed to calculate storage size:", error)
    return "Unknown"
  }
}

export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false

    const testKey = "__localStorage_test__"
    localStorage.setItem(testKey, "test")
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}
