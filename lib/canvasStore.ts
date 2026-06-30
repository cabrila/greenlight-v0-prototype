import type { CanvasItem, CanvasItemType } from "@/components/canvas/CanvasItemCard"

/**
 * Shared helper for pushing assets onto a project's canvas from anywhere in the
 * app (Props / Costume & Makeup / Locations modals, etc.). The canvas reads its
 * state from `canvas-v2-<projectId>` in localStorage on mount, so writing here
 * before navigating to the canvas makes the new asset appear immediately.
 */

const CASTING_STATE_KEY = "gogreenlight-casting-state"

export interface CanvasAssetInput {
  refId: string
  type: CanvasItemType
  title: string
  subtitle?: string
  image?: string
  images?: string[]
  meta?: string
  tags?: string[]
}

interface CanvasStore {
  items: CanvasItem[]
  zoom: number
  pan: { x: number; y: number }
  viewSize: "full" | "medium" | "small"
  groupNames: Record<string, string>
  savedAt?: number
}

const canvasKey = (projectId: string) => `canvas-v2-${projectId}`

/** Resolve the active project id from the persisted casting state. */
function resolveCurrentProjectId(): string | null {
  try {
    const raw = localStorage.getItem(CASTING_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.currentFocus?.currentProjectId ?? null
  } catch {
    return null
  }
}

function defaultStore(): CanvasStore {
  return { items: [], zoom: 1, pan: { x: 0, y: 0 }, viewSize: "full", groupNames: {} }
}

/**
 * Append one or more assets to the given project's canvas. Assets already on the
 * canvas (matched by type + refId) are skipped to avoid duplicates. Returns the
 * resolved project id (or null if none could be determined).
 */
export function addAssetsToCanvas(
  projectId: string | null | undefined,
  assets: CanvasAssetInput[],
): string | null {
  if (typeof window === "undefined") return null
  const resolvedId = projectId || resolveCurrentProjectId()
  if (!resolvedId) return null

  const storageKey = canvasKey(resolvedId)
  let store = defaultStore()
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) store = { ...store, ...JSON.parse(saved) }
  } catch {
    /* ignore corrupt data and start fresh */
  }

  const items: CanvasItem[] = Array.isArray(store.items) ? store.items : []
  let addedCount = 0

  for (const asset of assets) {
    if (items.some((it) => it.type === asset.type && it.refId === asset.refId)) continue
    const offset = (items.length + addedCount) % 6
    items.push({
      id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${addedCount}`,
      type: asset.type,
      refId: asset.refId,
      x: 140 + offset * 28,
      y: 140 + offset * 28,
      title: asset.title,
      subtitle: asset.subtitle,
      image: asset.image,
      images: asset.images,
      meta: asset.meta,
      tags: asset.tags,
    })
    addedCount++
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...store, items, savedAt: Date.now() }))
  } catch {
    /* ignore quota errors */
  }

  return resolvedId
}

/** Convenience helper for adding a single asset. */
export function addAssetToCanvas(
  projectId: string | null | undefined,
  asset: CanvasAssetInput,
): string | null {
  return addAssetsToCanvas(projectId, [asset])
}
