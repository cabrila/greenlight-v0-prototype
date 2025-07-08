"use client"

import { useState, useEffect } from "react"
import { useCasting } from "@/components/casting/CastingContext"
import AddActorModal from "./AddActorModal"
import EditActorModal from "./EditActorModal"
import AddCharacterModal from "./AddCharacterModal"
import AddShortlistModal from "./AddShortlistModal"
import ProjectManagerModal from "./ProjectManagerModal"
import CastingBreakdownModal from "./CastingBreakdownModal"
import TeamSuggestionsModal from "./TeamSuggestionsModal"
import UserPermissionsModal from "./UserPermissionsModal"
import NotificationsModal from "./NotificationsModal"
import ManageStatusesModal from "./ManageStatusesModal"
import PlayerViewModal from "./PlayerViewModal"
import MoreActionsModal from "./MoreActionsModal"
import MoveActorModal from "./MoveActorModal"
import MoveActorToCharacterModal from "./MoveActorToCharacterModal"
import MoveMultipleActorsModal from "./MoveMultipleActorsModal"
import ConfirmDeleteModal from "./ConfirmDeleteModal"
import UploadCSVModal from "./UploadCSVModal"
import UploadCharactersModal from "./UploadCharactersModal"
import ClearCacheModal from "./ClearCacheModal"
import NoCharacterWarningModal from "./NoCharacterWarningModal"
import CanvasModal from "../canvas/CanvasModal"
import ContactActorModal from "./ContactActorModal"
import HelpWizardModal from "./HelpWizardModal"
import CharacterDetailsModal from "./CharacterDetailsModal"
import UploadActorsMenuModal from "./UploadActorsMenuModal"
import CreateActorFormModal from "./CreateActorFormModal"
import SplashScreenModal from "./SplashScreenModal"

export interface ModalState {
  type: string | null
  data?: any
}

// Stack to manage multiple modals
let globalModalStack: ModalState[] = []
let globalSetModalStack: ((stack: ModalState[]) => void) | null = null

export function openModal(type: string, data?: any) {
  if (globalSetModalStack) {
    const newModal = { type, data }
    globalSetModalStack([...globalModalStack, newModal])
  }
}

export function closeModal() {
  if (globalSetModalStack && globalModalStack.length > 0) {
    const newStack = [...globalModalStack]
    newStack.pop()
    globalSetModalStack(newStack)
  }
}

export function closeAllModals() {
  if (globalSetModalStack) {
    globalSetModalStack([])
  }
}

export default function ModalManager() {
  const [modalStack, setModalStack] = useState<ModalState[]>([])
  const { state, dispatch } = useCasting()

  useEffect(() => {
    globalModalStack = modalStack
    globalSetModalStack = setModalStack
  }, [modalStack])

  const handleClose = () => {
    closeModal()
  }

  const handleCloseAll = () => {
    closeAllModals()
  }

  // Check if Player View should be open - this is the key fix
  const isPlayerViewOpen = state.currentFocus.playerView.isOpen

  // Check if any modals are open in the CastingContext
  const hasOpenContextModals = state.modals && Object.values(state.modals).some((modal) => modal.isOpen)

  // Render Player View separately since it's controlled by state, not modal system
  if (isPlayerViewOpen) {
    return <PlayerViewModal onClose={() => dispatch({ type: "CLOSE_PLAYER_VIEW" })} />
  }

  if (modalStack.length === 0 && !hasOpenContextModals) return null

  // Render modals from CastingContext (these take precedence)
  if (hasOpenContextModals && state.modals) {
    if (state.modals.addActor?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddActorModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "addActor" })}
            characterId={state.modals.addActor.props.characterId}
          />
        </div>
      )
    }

    if (state.modals.editActor?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <EditActorModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "editActor" })}
            {...state.modals.editActor.props}
          />
        </div>
      )
    }

    if (state.modals.moveActor?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MoveActorModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "moveActor" })}
            {...state.modals.moveActor.props}
          />
        </div>
      )
    }

    if (state.modals.moveActorToCharacter?.isOpen) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <MoveActorToCharacterModal
            onClose={() => dispatch({ type: "CLOSE_MODAL", payload: "moveActorToCharacter" })}
            {...state.modals.moveActorToCharacter.props}
          />
        </div>
      )
    }
  }

  // Render modal stack
  const renderModalAtIndex = (modal: ModalState, index: number) => {
    const isTopModal = index === modalStack.length - 1
    const zIndex = 50 + index * 10 // Increase z-index for each stacked modal

    const modalContent = (() => {
      switch (modal.type) {
        case "addActor":
          return <AddActorModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "editActor":
          return <EditActorModal onClose={handleClose} {...modal.data} />
        case "addCharacter":
          return <AddCharacterModal onClose={handleClose} />
        case "addShortlist":
          return <AddShortlistModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "projectManager":
          return <ProjectManagerModal onClose={handleClose} />
        case "castingBreakdown":
          return <CastingBreakdownModal onClose={handleClose} />
        case "teamSuggestions":
          return <TeamSuggestionsModal onClose={handleClose} />
        case "userPermissions":
          return <UserPermissionsModal onClose={handleClose} />
        case "notifications":
          return <NotificationsModal onClose={handleClose} />
        case "manageStatuses":
          return <ManageStatusesModal onClose={handleClose} {...modal.data} />
        case "playerView":
          return <PlayerViewModal onClose={handleClose} />
        case "moreActions":
          return <MoreActionsModal onClose={handleClose} {...modal.data} />
        case "moveActor":
          return <MoveActorModal onClose={handleClose} {...modal.data} />
        case "moveActorToCharacter":
          return <MoveActorToCharacterModal onClose={handleClose} {...modal.data} />
        case "moveMultipleActors":
          return <MoveMultipleActorsModal onClose={handleClose} {...modal.data} />
        case "confirmDelete":
          return <ConfirmDeleteModal onClose={handleClose} {...modal.data} />
        case "uploadCSV":
          return <UploadCSVModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "uploadCharacters":
          return <UploadCharactersModal onClose={handleClose} />
        case "clearCache":
          return <ClearCacheModal onClose={handleClose} />
        case "noCharacterWarning":
          return <NoCharacterWarningModal onClose={handleClose} {...modal.data} />
        case "canvas":
          return <CanvasModal onClose={handleClose} />
        case "contactActor":
          return <ContactActorModal onClose={handleClose} {...modal.data} />
        case "helpWizard":
          return <HelpWizardModal onClose={handleClose} />
        case "characterDetails":
          return <CharacterDetailsModal onClose={handleClose} {...modal.data} />
        case "uploadActorsMenu":
          return <UploadActorsMenuModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "createActorForm":
          return <CreateActorFormModal onClose={handleClose} characterId={modal.data?.characterId} />
        case "splashScreen":
          return <SplashScreenModal onClose={handleClose} />
        default:
          return null
      }
    })()

    if (!modalContent) return null

    // For splash screen and canvas modal, don't add the backdrop wrapper since they have their own
    if (modal.type === "splashScreen" || modal.type === "canvas") {
      return <div key={`modal-${index}`}>{modalContent}</div>
    }

    // For other modals, add backdrop only if it's the bottom modal or if the modal below is canvas/splash
    const shouldShowBackdrop = index === 0 || ["canvas", "splashScreen"].includes(modalStack[index - 1]?.type)
    const backdropOpacity = shouldShowBackdrop ? "bg-opacity-50" : "bg-opacity-20"

    return (
      <div
        key={`modal-${index}`}
        className={`fixed inset-0 bg-black ${backdropOpacity} flex items-center justify-center p-4`}
        style={{ zIndex }}
      >
        {modalContent}
      </div>
    )
  }

  return <>{modalStack.map((modal, index) => renderModalAtIndex(modal, index))}</>
}
