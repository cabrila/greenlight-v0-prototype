export interface Actor {
  id: string
  name: string
  age?: string
  playingAge?: string
  location?: string
  agent?: string
  gender?: string
  ethnicity?: string
  contactPhone?: string
  contactEmail?: string
  skills?: string[]
  availability?: string[]
  headshots: string[]
  currentCardHeadshotIndex: number
  userVotes: Record<string, "yes" | "no" | "maybe">
  isSoftRejected: boolean
  isGreenlit: boolean
  isCast: boolean
  currentListKey: string
  currentShortlistId?: string
  statuses: ActorStatus[]
  notes?: Note[]
  dateAdded: number
  sortOrder?: number
  consensusAction?: {
    type: "yes" | "no" | "stay"
    targetKey?: string
    targetName?: string
    isGreenlit?: boolean
  }
  // Form submission specific fields
  submissionId?: string
  submissionSource?: "form" | "manual" | "import"
  submissionVideos?: Array<{
    url: string
    embedUrl: string
    platform: string
  }>
  readyForApproval?: boolean
  approvalMoveDate?: number
  lastContactDate?: number
  lastContactType?: string
}

export interface CastingState {
  users: User[]
  currentUser: User | null
  projects: Project[]
  notifications: Notification[]
  tabDefinitions: TabDefinition[]
  predefinedStatuses: Status[]
  permissionLevels: PermissionLevel[]
  currentFocus: CurrentFocus
  modals: { [key: string]: { isOpen: boolean; props: any } }
  cardViewSettings: CardViewSettings
  sortOptionDefinitions: SortOption[]
  terminology: Terminology
  tabDisplayNames: { [tabKey: string]: string } // New: Front-end only display names
}

export type CastingAction =
  | { type: "UPDATE_TAB_DISPLAY_NAME"; payload: { tabKey: string; displayName: string } }
  | { type: "RESET_TAB_DISPLAY_NAME"; payload: { tabKey: string } }
  | {
      type: "REORDER_TABS"
      payload: { draggedTabKey: string; targetTabKey: string; insertPosition: "before" | "after" }
    }
  | { type: "UPDATE_PROJECT_TERMINOLOGY"; payload: { type: string; form: string; value: string } }
  | { type: "UPDATE_TERMINOLOGY"; payload: { type: string; form: string; value: string } }
  | { type: "LOAD_FROM_STORAGE"; payload: any }
  | { type: "CLEAR_CACHE" }
  | { type: "LOAD_DEMO_DATA"; payload: any }
  | { type: "SET_CURRENT_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: { userId: string; updates: Partial<User> } }
  | { type: "SELECT_PROJECT"; payload: string }
  | { type: "SELECT_CHARACTER"; payload: string }
  | { type: "SELECT_TAB"; payload: string }
  | { type: "SET_SEARCH_TERM"; payload: string }
  | { type: "SET_VIEW_MODE"; payload: "detailed" | "compact" | "player" }
  | { type: "SET_SORT_OPTION"; payload: string }
  | { type: "OPEN_PLAYER_VIEW"; payload?: { actorIndex: number } }
  | { type: "CLOSE_PLAYER_VIEW" }
  | { type: "NAVIGATE_PLAYER_VIEW"; payload: number }
  | { type: "SET_PLAYER_HEADSHOT"; payload: number }
  | { type: "CAST_VOTE"; payload: { actorId: string; characterId: string; vote: string; userId: string } }
  | {
      type: "ADD_CONTACT_STATUS"
      payload: { actorIds: string[]; characterId: string; contactType: string; templateName: string; timestamp: number }
    }
  | { type: "ADD_ACTOR"; payload: { actor: Actor; characterId: string } }
  | { type: "ADD_CHARACTER"; payload: { character: Character; projectId: string } }
  | { type: "DELETE_CHARACTER"; payload: string }
  | { type: "UPDATE_ACTOR"; payload: { actorId: string; characterId: string; updates: Partial<Actor> } }
  | {
      type: "MOVE_ACTOR"
      payload: {
        actorId: string
        sourceLocation: any
        destinationType: string
        destinationKey: string
        destinationShortlistId?: string
        characterId: string
        moveReason?: string
      }
    }
  | {
      type: "MOVE_MULTIPLE_ACTORS"
      payload: {
        actorIds: string[]
        sourceLocation: any
        destinationType: string
        destinationKey: string
        destinationShortlistId?: string
        characterId: string
        moveReason?: string
      }
    }
  | {
      type: "REORDER_MULTIPLE_ACTORS"
      payload: {
        characterId: string
        listType: string
        listKey: string
        shortlistId?: string
        actorIds: string[]
        targetActorId: string
        insertPosition: "before" | "after"
      }
    }
  | { type: "UPDATE_CARD_SETTINGS"; payload: { field: string; value: any } }
  | { type: "CREATE_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: Project }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "OPEN_MODAL"; payload: { type: string; props?: any } }
  | { type: "CLOSE_MODAL"; payload: string }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "DELETE_NOTIFICATION"; payload: string }
  | { type: "DELETE_SELECTED_NOTIFICATIONS"; payload: string[] }
  | {
      type: "MOVE_ACTOR_TO_CHARACTER"
      payload: { actorId: string; sourceCharacterId: string; destinationCharacterId: string }
    }
  | { type: "DELETE_ACTOR"; payload: { actorId: string; characterId: string } }
  | { type: "ADD_NOTE"; payload: { actorId: string; characterId: string; note: Note } }
  | { type: "UPDATE_NOTE"; payload: { actorId: string; characterId: string; noteId: string; text: string } }
  | { type: "DELETE_NOTE"; payload: { actorId: string; characterId: string; noteId: string } }
  | {
      type: "REORDER_ACTORS"
      payload: {
        characterId: string
        listType: string
        listKey: string
        shortlistId?: string
        draggedActorId: string
        targetActorId: string
        insertPosition: "before" | "after"
      }
    }
  | { type: "ADD_SHORTLIST"; payload: { characterId: string; group: any } }
  | { type: "DELETE_SHORTLIST"; payload: { characterId: string; groupId: string } }
  | { type: "RENAME_SHORTLIST"; payload: { characterId: string; groupId: string; updates: any } }
  | { type: "ADD_TAB"; payload: { tabKey: string; tabName: string } }
  | { type: "RENAME_TAB"; payload: { oldKey: string; newKey: string; newName: string } }
  | { type: "DELETE_TAB"; payload: string }
  | { type: "CREATE_GROUP"; payload: { characterId: string; group: any } }
  | { type: "UPDATE_GROUP"; payload: { characterId: string; groupId: string; updates: any } }
  | { type: "DELETE_GROUP"; payload: { characterId: string; groupId: string } }
  | { type: "UPDATE_TAB_DEFINITIONS"; payload: TabDefinition[] }

// Rest of the existing types remain unchanged...
export interface User {
  id: string
  name: string
  initials: string
  email: string
  role: string
  bgColor: string
  color: string
}

export interface Project {
  id: string
  name: string
  description?: string
  characters: Character[]
  createdDate: number
  modifiedDate: number
  terminology?: Terminology
}

export interface Character {
  id: string
  name: string
  description?: string
  actors: {
    longList: Actor[]
    audition: Actor[]
    approval: Actor[]
    shortLists: ShortList[]
    [key: string]: Actor[] | ShortList[]
  }
}

export interface ShortList {
  id: string
  name: string
  description?: string
  actors: Actor[]
  color?: string
  createdAt: number
}

export interface SubmissionVideo {
  id: string
  title: string
  url: string
  thumbnail?: string
  duration?: number
  type: "youtube" | "vimeo" | "direct"
}

export interface Note {
  id: string
  userId: string
  userName: string
  timestamp: number
  text: string
}

export interface Status {
  id: string
  name?: string
  label: string
  color?: string
  bgColor: string
  textColor: string
  category: string
  isCustom?: boolean
  timestamp?: number
  templateUsed?: string
}

export interface Notification {
  id: string
  type: "system" | "user" | "vote"
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: "low" | "medium" | "high"
  actorId?: string
  characterId?: string
  userId?: string
  metadata?: any
}

export interface TabDefinition {
  key: string
  name: string
  isCustom: boolean
}

export interface PermissionLevel {
  id: string
  label: string
  description: string
}

export interface CurrentFocus {
  currentProjectId: string | null
  characterId: string | null
  activeTabKey: string
  cardDisplayMode: "detailed" | "compact" | "player"
  currentSortOption: string
  searchTerm: string
  playerView: {
    isOpen: boolean
    currentIndex: number
    currentHeadshotIndex: number
  }
}

export interface CardViewSettings {
  age: boolean
  playingAge: boolean
  location: boolean
  agent: boolean
  imdbUrl: boolean
  status: boolean
  skills: boolean
  notes: boolean
  showVotes: boolean
  showActionButtons: boolean
  mediaAndNotes: boolean
  showProgress: boolean
  showTags: boolean
}

export interface SortOption {
  key: string
  label: string
}

export interface Terminology {
  actor: {
    singular: string
    plural: string
  }
  character: {
    singular: string
    plural: string
  }
}

export interface ActorStatus {
  id: string
  name?: string
  label: string
  color?: string
  bgColor: string
  textColor: string
  category?: string
  isCustom?: boolean
  timestamp?: number
  templateUsed?: string
}

export interface ActorNote {
  id: string
  content: string
  timestamp: number
  userId: string
}
