import { isValidImageUrl } from "@/lib/utils"
import type { ReviewAsset, ReviewContentItem, ReviewVertical } from "@/components/modals/ConfigureReviewModal"
import type { CanvasItem } from "./CanvasItemCard"
import { TYPE_CONFIG } from "./CanvasItemCard"
import type { ItemReactions } from "./canvasCollaborators"

export interface AssetMedia {
  id: string
  url: string
  label: string
}

export interface AssetField {
  id: string
  label: string
  value: string
}

export interface ReviewAssetDetails {
  id: string
  vertical: ReviewVertical
  typeLabel: string
  title: string
  subtitle?: string
  images: AssetMedia[]
  videos: AssetMedia[]
  fields: AssetField[]
  notes?: string
  tags: string[]
  address?: { text: string; lat?: number; lng?: number }
  reactions: ItemReactions
}

const VERTICAL_BY_TYPE: Record<string, ReviewVertical> = {
  actor: "cast",
  prop: "prop",
  costume: "costume",
  location: "location",
}

const humanize = (v?: string | null) => (v ? v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "")

const field = (label: string, value: unknown): AssetField | null => {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return null
  const text = Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)
  return { id: `f-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label, value: text }
}

const compact = (list: (AssetField | null)[]) => list.filter((f): f is AssetField => !!f)

function findActor(project: any, id: string): { actor: any; characterName?: string } | null {
  for (const char of project?.characters || []) {
    for (const [key, list] of Object.entries(char.actors || {})) {
      if (!Array.isArray(list)) continue
      if (key === "shortLists") {
        for (const sl of list as any[]) {
          const hit = (sl?.actors || []).find((a: any) => a?.id === id)
          if (hit) return { actor: hit, characterName: char.name }
        }
      } else {
        const hit = (list as any[]).find((a) => a?.id === id)
        if (hit) return { actor: hit, characterName: char.name }
      }
    }
  }
  return null
}

const toMedia = (urls: string[], prefix: string, labelBase: string): AssetMedia[] =>
  urls.filter((u) => isValidImageUrl(u)).map((url, i) => ({ id: `${prefix}-${i}`, url, label: `${labelBase} ${i + 1}` }))

export function resolveAssetDetails(item: CanvasItem, project: any): ReviewAssetDetails {
  const vertical = VERTICAL_BY_TYPE[item.type] || "generic"
  const fallbackImages = item.images?.length ? item.images : item.image ? [item.image] : []
  const base: ReviewAssetDetails = {
    id: item.id,
    vertical,
    typeLabel: TYPE_CONFIG[item.type]?.label || "Asset",
    title: item.title,
    subtitle: item.subtitle,
    images: toMedia(fallbackImages, "img", "Image"),
    videos: [],
    fields: [],
    tags: item.tags || [],
    reactions: (item as any).reactions || { up: [], down: [] },
  }

  if (item.type === "actor") {
    const found = findActor(project, item.refId)
    const a = found?.actor
    if (a) {
      base.images = toMedia(a.headshots || fallbackImages, "img", "Headshot")
      base.videos = (a.submissionVideos || [])
        .filter((v: any) => v?.url)
        .map((v: any, i: number) => ({ id: `vid-${i}`, url: v.url, label: v.title || `Self-tape ${i + 1}` }))
      base.fields = compact([
        field("Character", found?.characterName || item.subtitle),
        field("Age", a.age),
        field("Playing age", a.playingAge),
        field("Gender", a.gender),
        field("Ethnicity", a.ethnicity),
        field("Based in", a.location),
        field("Agent", a.agent),
        field("Skills", a.skills),
      ])
      const notes = (a.notes || []).map((n: any) => n?.content || n?.text).filter(Boolean)
      if (notes.length) base.notes = notes.join("\n\n")
    } else {
      base.images = toMedia(fallbackImages, "img", "Headshot")
      base.fields = compact([field("Character", item.subtitle), field("Details", item.meta)])
    }
  }

  if (item.type === "prop") {
    const source = (project?.propInventory?.length ? project.propInventory : project?.props) || []
    const p = source.find((x: any) => x.id === item.refId)
    if (p) {
      const character = (project?.characters || []).find((c: any) => c.id === p.characterId)
      base.images = toMedia(p.imageUrl ? [p.imageUrl] : fallbackImages, "img", "Photo")
      base.fields = compact([
        field("Category", p.category),
        field("Status", humanize(p.status)),
        field("Model", p.model),
        field("Brand", p.brand),
        field("Quantity", p.quantity),
        field("Unit price", p.unitPrice),
        field("Purchase type", humanize(p.purchaseType)),
        field("Serial number", p.serialNumber),
        field("Booked to", p.bookedTo),
        field("Assigned character", character?.name),
        field("Scenes", p.sceneIds?.length ? `${p.sceneIds.length} scene${p.sceneIds.length === 1 ? "" : "s"}` : null),
        p.requiresArmorySupervision ? field("Armory supervision", true) : null,
      ])
      if (p.notes) base.notes = p.notes
    } else {
      base.fields = compact([field("Category", item.subtitle), field("Status", humanize(item.meta))])
    }
  }

  if (item.type === "costume") {
    const c = (project?.costumes?.inventory || []).find((x: any) => x.id === item.refId)
    if (c) {
      const looks = (project?.costumes?.looks || []).filter((l: any) => (l.itemIds || []).includes(c.id))
      const lookPhotos = looks.flatMap((l: any) => [...(l.referencePhotos || []), ...(l.matchPhotos || [])])
      base.images = toMedia([c.imageUrl, ...lookPhotos].filter(Boolean), "img", "Photo")
      base.tags = c.vibeTags || []
      base.fields = compact([
        field("Type", humanize(c.type)),
        field("Status", humanize(c.status)),
        field("Brand", c.brand),
        field("Size", c.size),
        field("Vendor", c.vendor),
        field("Purchase price", c.purchasePrice),
        field("Rental return", c.rentReturnDate ? new Date(c.rentReturnDate).toLocaleDateString() : null),
        field("Used in looks", looks.map((l: any) => l.name)),
        field("Continuity", looks.map((l: any) => l.continuityNotes).filter(Boolean)),
      ])
      if (c.notes) base.notes = c.notes
    } else {
      base.fields = compact([field("Type", humanize(item.subtitle)), field("Status", humanize(item.meta))])
    }
  }

  if (item.type === "location") {
    const source = (project?.locationInventory?.length ? project.locationInventory : project?.locations) || []
    const l = source.find((x: any) => x.id === item.refId)
    if (l) {
      const photos = (l.media || []).filter((m: any) => m.type !== "video" && isValidImageUrl(m.url))
      base.images = photos.map((m: any, i: number) => ({ id: `img-${i}`, url: m.url, label: m.caption || `Photo ${i + 1}` }))
      base.videos = (l.media || [])
        .filter((m: any) => m.type === "video" && m.url)
        .map((m: any, i: number) => ({ id: `vid-${i}`, url: m.url, label: m.caption || `Walkthrough ${i + 1}` }))
      base.tags = l.vibeTags || []
      base.address = l.address ? { text: l.address, lat: l.lat, lng: l.lng } : undefined
      const studio = l.locationType === "studio"
      const contact = (l.contacts || [])[0]
      base.fields = compact([
        field("Code", l.code),
        field("Type", humanize(l.locationType)),
        field("Status", humanize(l.status)),
        field("Daily rate", l.dailyRate),
        field("Overtime rate", l.overtimeRate),
        field("Security deposit", l.securityDeposit),
        ...(studio
          ? [
              field(
                "Dimensions",
                l.dimensionsL && l.dimensionsW ? `${l.dimensionsL} × ${l.dimensionsW}${l.dimensionsH ? ` × ${l.dimensionsH}` : ""} ft` : null,
              ),
              field("Grid height", l.gridHeight ? `${l.gridHeight} ft` : null),
              field("Sound rating", l.soundRating),
              field("Amperage", l.amperage),
              field("Floor type", l.floorType),
            ]
          : [
              field("Basecamp parking", l.basecampParking),
              field("Crew parking", l.crewParkingCapacity ? `${l.crewParkingCapacity} vehicles` : null),
              field("Load-in", l.loadInDifficulty),
              field("Noise profile", l.noiseProfile),
              field("Sun path", l.sunPathNotes),
              field("Bathrooms", l.bathroomCount),
            ]),
        field("Contact", contact ? `${contact.name} (${contact.role})` : null),
      ])
      if (l.notes) base.notes = l.notes
    } else {
      base.fields = compact([field("Address", item.subtitle), field("Status", humanize(item.meta))])
      if (item.subtitle) base.address = { text: item.subtitle }
    }
  }

  return base
}

/** Content pieces the reviewer can toggle on/off per asset in the Configure Review modal. */
export function toReviewAsset(d: ReviewAssetDetails): ReviewAsset {
  const content: ReviewContentItem[] = [
    ...d.images.map((m) => ({ id: m.id, label: m.label, kind: "image" as const })),
    ...d.videos.map((m) => ({ id: m.id, label: m.label, kind: "video" as const })),
    ...d.fields.map((f) => ({ id: f.id, label: f.label, kind: "field" as const })),
    ...(d.tags.length ? [{ id: "tags", label: "Vibe tags", kind: "field" as const }] : []),
    ...(d.notes ? [{ id: "notes", label: "Notes", kind: "note" as const }] : []),
    ...(d.address ? [{ id: "map", label: "Address & map", kind: "map" as const }] : []),
  ]
  return {
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    image: d.images[0]?.url,
    typeLabel: d.typeLabel,
    vertical: d.vertical,
    content,
  }
}
