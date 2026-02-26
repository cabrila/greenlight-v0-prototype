// Jurassic Park data -- imports raw JSON-LD files, transforms to CastingState at runtime
import type {
  CastingState, ScriptBlock, ScriptData, BeatItem,
  CostumeInventoryItem, CostumeLook, CostumeShoppingItem,
  ActorMeasurements, ActorHMUSpecs, ProjectCostumes,
  ProductionDesignSet, ConstructionTask,
} from "@/types/casting"
import type { ScheduleEntry, Scene, ProductionPhase } from "@/types/schedule"

import charactersJson from "./jurassic/data/characters.json"
import scenesJson from "./jurassic/data/scenes.json"
import locationsJson from "./jurassic/data/locations.json"
import propsJson from "./jurassic/data/props.json"
import requirementsJson from "./jurassic/data/requirements.json"
import costumesJson from "./jurassic/data/costumes.json"
import stylingJson from "./jurassic/data/styling.json"

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const extractId = (ref: any): string => {
  if (!ref) return ""
  if (typeof ref === "string") return ref.split("/").pop() || ref
  if (ref["@id"]) return (ref["@id"] as string).split("/").pop() || ref["@id"]
  return ""
}

const graph = (json: any): any[] => {
  if (Array.isArray(json?.["@graph"])) return json["@graph"]
  if (Array.isArray(json)) return json
  return []
}

/* ------------------------------------------------------------------ */
/*  Extract flat arrays from @graph                                    */
/* ------------------------------------------------------------------ */
const charsArr = graph(charactersJson)
const locsArr = graph(locationsJson)
const propsArr = graph(propsJson)
const scenesArr = graph(scenesJson)
const reqsArr = graph(requirementsJson)
const costumesArr = graph(costumesJson)
const stylingArr = graph(stylingJson)



/* ------------------------------------------------------------------ */
/*  Lookup maps by character ID                                        */
/* ------------------------------------------------------------------ */
const reqMap: Record<string, any[]> = {}
for (const r of reqsArr) {
  const chars = r["gg:relatedCharacters"] || []
  for (const ref of (Array.isArray(chars) ? chars : [chars])) {
    const cId = extractId(ref)
    if (!cId) continue
    if (!reqMap[cId]) reqMap[cId] = []
    reqMap[cId].push(r)
  }
}

// Build costume/styling maps keyed by characterAssociation @id
// Also build a secondary map keyed by name-slug for fuzzy matching
// (costumes may use "jb2-alan-grant" while characters use "jb2-grant")
const costumeMap: Record<string, any> = {}
for (const c of costumesArr) {
  const cId = extractId(c["characterAssociation"])
  if (cId) costumeMap[cId] = c
}

const stylingMap: Record<string, any> = {}
for (const s of stylingArr) {
  const cId = extractId(s["characterAssociation"])
  if (cId) stylingMap[cId] = s
}

// Fuzzy lookup: if exact id match fails, try substring match
function findCostume(charId: string): any {
  if (costumeMap[charId]) return costumeMap[charId]
  // charId = "gg:character/jb2-grant", costume key = "gg:character/jb2-alan-grant"
  // Try: find a costume key whose slug contains the character's slug
  const slug = charId.split("/").pop() || ""
  for (const key of Object.keys(costumeMap)) {
    const kSlug = key.split("/").pop() || ""
    if (kSlug.includes(slug) || slug.includes(kSlug)) return costumeMap[key]
  }
  return null
}

function findStyling(charId: string): any {
  if (stylingMap[charId]) return stylingMap[charId]
  const slug = charId.split("/").pop() || ""
  for (const key of Object.keys(stylingMap)) {
    const kSlug = key.split("/").pop() || ""
    if (kSlug.includes(slug) || slug.includes(kSlug)) return stylingMap[key]
  }
  return null
}

/* ------------------------------------------------------------------ */
/*  Characters                                                         */
/* ------------------------------------------------------------------ */
const characters = charsArr.map((c: any) => {
  const id = extractId(c)
  const name: string = c["name"] || id
  const desc: string = c["description"] || ""
  const level: string = c["gg:characterLevel"] || "dayPlayer"
  const scenes = c["gg:scenes"] || []
  const sceneRefs = (Array.isArray(scenes) ? scenes : [scenes]).map(extractId).filter(Boolean)
  const reqs = reqMap[id] || []
  const costume = findCostume(id)
  const styling = findStyling(id)

  let notes = desc
  for (const r of reqs) {
    const rDesc = r["description"] || r["name"] || ""
    if (rDesc) notes += " | " + rDesc
  }
  if (costume) notes += " | Wardrobe: " + (costume["gg:notes"] || costume["name"] || "")
  if (styling) notes += " | Styling: " + (styling["gg:notes"] || styling["name"] || "")

  return {
    id,
    name,
    description: desc,
    characterLevel: level,
    sceneIds: sceneRefs,
    castingNotes: notes,
    firstAppearance: sceneRefs[0] || "",
    actors: { longList: [], shortLists: [], audition: [], approval: [] },
  }
})

/* ------------------------------------------------------------------ */
/*  Build scene-number lookup (sceneId -> sceneNumber/slugline)        */
/* ------------------------------------------------------------------ */
const sceneNumMap: Record<string, { sceneNumber: string; slugline: string }> = {}
for (const s of scenesArr) {
  const sId = extractId(s)
  const sNum: string = String(s["sceneNumber"] ?? "")
  const slug: string = s["slugline"] ?? ""
  sceneNumMap[sId] = { sceneNumber: sNum, slugline: slug }
}

/* ------------------------------------------------------------------ */
/*  Locations  (produce full ProjectLocation objects)                   */
/* ------------------------------------------------------------------ */
const locations: any[] = locsArr.map((l: any, idx: number) => {
  const id = extractId(l)
  const name: string = l["name"] || id
  const desc: string = l["description"] || "Derived from scene sluglines."
  const scenes = l["gg:scenes"] || []
  const sceneRefs: string[] = (Array.isArray(scenes) ? scenes : [scenes]).map(extractId).filter(Boolean)

  // Build LocationSceneTag[] from referenced scenes
  const sceneTags = sceneRefs.map((sId: string) => {
    const info = sceneNumMap[sId]
    return info
      ? { sceneNumber: info.sceneNumber, sceneTitle: info.slugline }
      : { sceneNumber: sId }
  })

  // Use gg:settingCounts to determine locationType
  const settingCounts = l["gg:settingCounts"] || {}
  const intCount = settingCounts["interior"] || 0
  const extCount = settingCounts["exterior"] || 0
  const locationType = intCount > 0 && extCount === 0 ? "studio" : "on-location"

  // Use gg:dominantCues as vibeTags
  const dominantCues: string[] = l["gg:dominantCues"] || []
  const actCoverage: string[] = l["gg:actCoverage"] || []
  const evidence: string[] = l["gg:evidence"] || []
  const sceneCount: number = l["gg:sceneCount"] || sceneRefs.length
  const timeOfDay = l["gg:timeOfDayCounts"] || {}

  // Build notes from evidence + metadata
  const noteParts = [
    desc,
    actCoverage.length > 0 ? "Acts: " + actCoverage.join(", ") : "",
    sceneCount > 0 ? "Scene count: " + sceneCount : "",
    Object.keys(timeOfDay).length > 0 ? "Time of day: " + Object.entries(timeOfDay).map(([k, v]) => k + " (" + v + ")").join(", ") : "",
  ].filter(Boolean).join("\n")

  const code = "LOC-" + String(idx + 1).padStart(3, "0")

  return {
    id,
    code,
    name,
    locationType,
    status: "scouted" as const,
    lat: 0,
    lng: 0,
    address: "",
    vibeTags: dominantCues,
    media: [] as any[],
    notes: noteParts,
    dailyRate: "",
    overtimeRate: "",
    securityDeposit: "",
    sceneTags,
    scheduleBlocks: [] as any[],
    blackoutDates: [] as any[],
    bookedTo: null,
    votes: [] as any[],
    comments: [] as any[],
  }
})

/* ------------------------------------------------------------------ */
/*  Props  (produce full PropInventoryItem / ProjectProp objects)       */
/* ------------------------------------------------------------------ */
const propScope2Category: Record<string, string> = {
  "character-prop": "Action Props",
  "set-dressing": "Decorations",
  "vehicle": "Sci-Fi",
  "consumable": "Household Items",
}

const propInventory = propsArr.map((p: any, idx: number) => {
  const id = extractId(p)
  const name: string = p["name"] || id
  const evidence: string = typeof p["gg:evidence"] === "string" ? p["gg:evidence"] : ""
  const desc: string = p["description"] || evidence
  const scope: string = p["propScope"] || ""
  const category = propScope2Category[scope] || "Household Items"
  const scenes = p["gg:scenes"] || []
  const sceneRefs: string[] = (Array.isArray(scenes) ? scenes : [scenes]).map(extractId).filter(Boolean)

  return {
    id,
    name,
    model: "",
    category,
    brand: "",
    serialNumber: "PROP-" + String(idx + 1).padStart(4, "0"),
    skuBarcode: "",
    notes: desc,
    imageUrl: "",
    purchaseType: "TBD",
    unitPrice: "",
    quantity: 1,
    bookedTo: null,
    availability: [] as any[],
    status: "available" as const,
    sceneIds: sceneRefs,
    characterId: null as string | null,
    requiresArmorySupervision: false,
  }
})

const projectProps = propInventory.map((p: any) => ({
  ...p,
  votes: [] as any[],
  comments: [] as any[],
}))

/* ------------------------------------------------------------------ */
/*  Costumes  (map narrative wardrobe+styling -> ProjectCostumes)       */
/* ------------------------------------------------------------------ */
const costumeInventory: CostumeInventoryItem[] = []
const costumeLooks: CostumeLook[] = []
const actorSpecs: Record<string, { measurements: ActorMeasurements; hmuSpecs: ActorHMUSpecs }> = {}

characters.forEach((ch: any) => {
  const c = findCostume(ch.id)
  const s = findStyling(ch.id)

  // Build rich notes from wardrobeCues + evidence
  const wardrobeCues: string[] = c?.["gg:wardrobeCues"] || []
  const wardrobeEvidence: string[] = c?.["gg:evidence"] || []
  const wardrobeNotes = [
    c?.["gg:notes"] || "",
    wardrobeCues.length > 0 ? "Cues: " + wardrobeCues.join(", ") : "",
    ...wardrobeEvidence.map((e: string) => "Evidence: " + e),
  ].filter(Boolean).join("\n")

  const stylingCues: string[] = s?.["gg:stylingCues"] || []
  const stylingEvidence: string[] = s?.["gg:evidence"] || []
  const stylingNotes = [
    s?.["gg:notes"] || "",
    stylingCues.length > 0 ? "Cues: " + stylingCues.join(", ") : "",
    ...stylingEvidence.map((e: string) => "Evidence: " + e),
  ].filter(Boolean).join("\n")

  // Create a costume-piece inventory item per character
  const costumeItemId = "inv-costume-" + ch.id
  costumeInventory.push({
    id: costumeItemId,
    name: ch.name + " -- Hero Costume",
    type: "costume-piece",
    status: "in-stock",
    size: "",
    imageUrl: "",
    vibeTags: wardrobeCues,
    notes: wardrobeNotes,
    votes: [],
    comments: [],
  } as any)

  // Create an HMU consumable inventory item per character
  const hmuItemId = "inv-hmu-" + ch.id
  costumeInventory.push({
    id: hmuItemId,
    name: ch.name + " -- HMU Kit",
    type: "hmu-consumable",
    status: "in-stock",
    size: "",
    imageUrl: "",
    vibeTags: stylingCues,
    notes: stylingNotes,
    votes: [],
    comments: [],
  } as any)

  // Create a look linking the character to their costume + HMU items
  costumeLooks.push({
    id: "look-" + ch.id,
    name: ch.name + " -- Main Look",
    characterId: ch.id,
    changeNumber: "Change 1",
    scriptDays: ch.sceneIds.length > 0 ? ["Day 1"] : [],
    sceneNumbers: ch.sceneIds.slice(0, 5),
    itemIds: [costumeItemId, hmuItemId],
    continuityNotes: wardrobeNotes,
    referencePhotos: [],
    matchPhotos: [],
  } as any)

  // actorSpecs keyed by character id
  actorSpecs[ch.id] = {
    measurements: { chest: "", waist: "", inseam: "", hat: "", ring: "", glove: "", shoe: "" },
    hmuSpecs: { skinToneCode: "", hairType: "", hairColor: "", allergies: [], tattoos: [] },
  }
})

const jpCostumes: ProjectCostumes = {
  actorSpecs,
  inventory: costumeInventory,
  looks: costumeLooks,
  shoppingList: [] as CostumeShoppingItem[],
}

/* ------------------------------------------------------------------ */
/*  Character name map (for script parsing)                            */
/* ------------------------------------------------------------------ */
const charNameMap: Record<string, string> = {}
for (const c of characters) charNameMap[c.id] = c.name

/* ------------------------------------------------------------------ */
/*  Script blocks from scriptText in scenes                            */
/* ------------------------------------------------------------------ */
let blkIdx = 0
const scriptBlocks: ScriptBlock[] = []

for (const scene of scenesArr as any[]) {
  const sceneNum: string = scene["sceneNumber"] || ""
  const heading: string = scene["slugline"] || ("SCENE " + sceneNum)
  const synopsis: string = scene["synopsis"] || scene["description"] || ""
  const scriptText: string = scene["scriptText"] || ""
  const charRefsRaw = scene["charactersInScene"] || []
  const charRefs: string[] = (Array.isArray(charRefsRaw) ? charRefsRaw : [charRefsRaw]).map(extractId).filter(Boolean)

  blkIdx++
  scriptBlocks.push({
    id: "jb2-blk-" + blkIdx,
    type: "scene-heading",
    text: heading,
    sceneNumber: sceneNum,
    synopsis,
  } as any)

  if (scriptText) {
    const lines = scriptText.split("\n")
    let i = 0
    while (i < lines.length) {
      const line = lines[i].trim()
      if (!line) { i++; continue }

      // Skip the scene heading echo (e.g. "1   EXT. JUNGLE - NIGHT")
      if (i < 3 && /^\d+\s/.test(line)) { i++; continue }

      const upper = line.toUpperCase()
      const isCharLine = charRefs.some((cId) => {
        const cName = (charNameMap[cId] || cId).toUpperCase()
        return upper === cName || upper.startsWith(cName + " (") || upper === cName + " (CONT'D)"
      })

      if (isCharLine) {
        const matchedChar = charRefs.find((cId) => {
          const cName = (charNameMap[cId] || cId).toUpperCase()
          return upper === cName || upper.startsWith(cName + " (") || upper === cName + " (CONT'D)"
        })
        blkIdx++
        scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "character", text: line, linkedCharacterId: matchedChar || undefined })
        i++

        // Parenthetical
        if (i < lines.length) {
          const next = lines[i].trim()
          if (next.startsWith("(") && next.endsWith(")")) {
            blkIdx++
            scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "parenthetical", text: next })
            i++
          }
        }

        // Dialogue lines
        const dLines: string[] = []
        while (i < lines.length) {
          const dl = lines[i].trim()
          if (!dl) break
          const dlUpper = dl.toUpperCase()
          const isNextChar = charRefs.some((cId) => {
            const cName = (charNameMap[cId] || cId).toUpperCase()
            return dlUpper === cName || dlUpper.startsWith(cName + " (") || dlUpper === cName + " (CONT'D)"
          })
          if (isNextChar) break
          dLines.push(dl)
          i++
        }
        if (dLines.length) {
          blkIdx++
          scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "dialogue", text: dLines.join("\n") })
        }
      } else {
        // Action block
        const actionLines = [line]
        i++
        while (i < lines.length) {
          const nl = lines[i].trim()
          if (!nl) { i++; break }
          const nlUpper = nl.toUpperCase()
          const isChar = charRefs.some((cId) => {
            const cName = (charNameMap[cId] || cId).toUpperCase()
            return nlUpper === cName || nlUpper.startsWith(cName + " (") || nlUpper === cName + " (CONT'D)"
          })
          if (isChar) break
          actionLines.push(nl)
          i++
        }
        blkIdx++
        scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "action", text: actionLines.join("\n") })
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Beats (sample across the screenplay for the beat board)            */
/* ------------------------------------------------------------------ */
const beatColors: BeatItem["color"][] = ["blue", "green", "amber", "rose", "purple", "sky", "pink", "stone"]
const scenesWithNums = scenesArr.filter((s: any) => s["sceneNumber"] && parseInt(s["sceneNumber"]) > 0)
const beatStep = Math.max(1, Math.floor(scenesWithNums.length / 17))
const beats: BeatItem[] = []
for (let bi = 0; bi < 17 && bi * beatStep < scenesWithNums.length; bi++) {
  const s = scenesWithNums[bi * beatStep] as any
  const desc: string = s["synopsis"] || s["slugline"] || ""
  const title = desc.substring(0, 40)
  const act = bi < 5 ? "Act 1" : bi < 11 ? "Act 2" : "Act 3"
  const matchBlock = scriptBlocks.find((b) => b.type === "scene-heading" && (b as any).synopsis === (s["synopsis"] || s["description"] || ""))
  beats.push({
    id: "jb2-beat-" + (bi + 1),
    title,
    description: desc,
    color: beatColors[bi % beatColors.length],
    act,
    linkedSceneId: matchBlock?.id || extractId(s),
    order: bi + 1,
  })
}

/* ------------------------------------------------------------------ */
/*  Script data                                                        */
/* ------------------------------------------------------------------ */
const NOW = Date.now()

const jpScriptData: ScriptData = {
  blocks: scriptBlocks,
  locked: false,
  lockedSceneSuffixes: {},
  currentRevision: "white",
  lastModified: NOW,
  beats,
}

/* ------------------------------------------------------------------ */
/*  Production phases                                                  */
/* ------------------------------------------------------------------ */
const jpProductionPhases: ProductionPhase[] = [
  { id: "jb2-principal", name: "Principal Photography", startDate: "1992-08-24", color: "text-blue-700", bgColor: "bg-blue-500" },
  { id: "jb2-second-unit", name: "Second Unit / VFX", startDate: "1992-10-05", color: "text-lime-700", bgColor: "bg-lime-500" },
  { id: "jb2-pickups", name: "Pickups", startDate: "1992-11-02", color: "text-orange-700", bgColor: "bg-orange-500" },
]

/* ------------------------------------------------------------------ */
/*  Schedule entries (group scenes into shoot days)                    */
/* ------------------------------------------------------------------ */
const SCENES_PER_DAY = 10
const jpScheduleEntries: ScheduleEntry[] = []

for (let d = 0; d * SCENES_PER_DAY < scenesArr.length; d++) {
  const dayScenes = scenesArr.slice(d * SCENES_PER_DAY, (d + 1) * SCENES_PER_DAY)
  const firstNum = (dayScenes[0] as any)?.["sceneNumber"] || "?"
  const lastNum = (dayScenes[dayScenes.length - 1] as any)?.["sceneNumber"] || "?"
  const allChars = [...new Set(dayScenes.flatMap((s: any) =>
    ((s["charactersInScene"] || []) as any[]).map(extractId).filter(Boolean)
  ))]
  const dateStr = "1992-08-" + String(24 + d).padStart(2, "0")

  jpScheduleEntries.push({
    id: "jb2-sched-" + (d + 1),
    title: "Day " + (d + 1) + " - Scenes " + firstNum + "-" + lastNum,
    date: dateStr,
    phaseId: "jb2-principal",
    startTime: "06:00",
    endTime: "20:00",
    location: dayScenes.map((s: any) => s["slugline"] || "").filter(Boolean).slice(0, 3).join(" / "),
    sceneType: "INT/EXT",
    sceneNotes: dayScenes.map((s: any) => "Sc " + (s["sceneNumber"] || "?") + ": " + (s["synopsis"] || "")).join(". "),
    actorIds: allChars,
    crewMembers: [],
    redFlags: [],
    notes: "Scenes " + firstNum + " through " + lastNum,
    createdAt: NOW,
    updatedAt: NOW,
  })
}

/* ------------------------------------------------------------------ */
/*  Stripboard scenes                                                  */
/* ------------------------------------------------------------------ */
const jpScenes: Scene[] = scenesArr.map((s: any, idx: number) => {
  const id = extractId(s)
  const num = s["sceneNumber"] || String(idx + 1)
  const slugline: string = s["slugline"] || ""
  const intExt = slugline.startsWith("INT/EXT") ? "INT/EXT" : slugline.startsWith("INT") ? "INT" : "EXT"
  const locName = slugline
    .replace(/^(INT\.|EXT\.|INT\/EXT\.?)\s*/i, "")
    .replace(/\s*-\s*(DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER).*$/i, "")
    .trim() || "UNKNOWN"
  const dayNight = /NIGHT/i.test(slugline) ? "Night" : "Day"
  const charRefs = ((s["charactersInScene"] || []) as any[]).map((ref: any) => {
    const cId = extractId(ref)
    return charNameMap[cId] || cId
  })
  const shootDay = "jb2-sched-" + (Math.floor(idx / SCENES_PER_DAY) + 1)

  return {
    id,
    sceneNumber: num,
    pages: "1",
    intExt: intExt as Scene["intExt"],
    location: locName,
    dayNight: dayNight as Scene["dayNight"],
    cast: charRefs,
    description: s["synopsis"] || s["description"] || "",
    shootDayId: shootDay,
    order: idx + 1,
    createdAt: NOW,
    updatedAt: NOW,
  }
})

/* ------------------------------------------------------------------ */
/*  Production Design Sets  (one set per location)                     */
/* ------------------------------------------------------------------ */
const STATUS_CYCLE: Array<ProductionDesignSet["status"]> = [
  "concept", "design", "drafting", "approved", "construction", "dressing", "camera-ready",
]

const productionDesignSets: ProductionDesignSet[] = locations.map((loc: any, idx: number) => {
  const locSceneTags: Array<{ sceneNumber: string; sceneTitle?: string }> = loc.sceneTags || []
  const locSceneIds: string[] = locSceneTags.map((st: any) => st.sceneNumber).filter(Boolean)
  const dominantCues: string[] = loc.vibeTags || []
  const evidence: string[] = locsArr[idx]?.["gg:evidence"] || []

  // Build decorations from dominant cues
  const decorations = dominantCues.slice(0, 4).map((cue: string, i: number) => ({
    id: `sd-${loc.id}-${i}`,
    name: cue.charAt(0).toUpperCase() + cue.slice(1) + " set dressing",
    source: (["inventory", "rental", "fabricated", "purchase"] as const)[i % 4],
    quantity: 1 + (i % 3),
  }))

  // Build elements from evidence lines
  const buildElements = evidence.slice(0, 3).map((ev: string, i: number) => ({
    id: `be-${loc.id}-${i}`,
    name: ev.length > 60 ? ev.slice(0, 57) + "..." : ev,
    material: "TBD",
    dimensions: "TBD",
    quantity: 1,
    notes: "From script: " + ev,
  }))

  return {
    id: "pdset-" + loc.id,
    name: loc.name,
    description: loc.notes || "Production design set for " + loc.name,
    status: STATUS_CYCLE[idx % STATUS_CYCLE.length],
    locationId: loc.id,
    sceneIds: locSceneIds,
    buildElements,
    decorations,
    lighting: [],
    moodBoard: [],
    estimatedBudget: "",
    notes: evidence.join("\n"),
    createdAt: NOW,
    updatedAt: NOW,
  } as ProductionDesignSet
})

const constructionTasks: ConstructionTask[] = productionDesignSets.flatMap((s) => [
  { id: `ct-${s.id}-1`, title: `Build elements for ${s.name}`, phase: "carpentry" as const, priority: "high" as const, completed: false, setId: s.id },
  { id: `ct-${s.id}-2`, title: `Paint & finish ${s.name}`, phase: "paint" as const, priority: "medium" as const, completed: false, setId: s.id },
  { id: `ct-${s.id}-3`, title: `Dress ${s.name}`, phase: "set-dec" as const, priority: "high" as const, completed: false, setId: s.id },
])

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */
const predefinedStatuses = [
  { id: "new", label: "New", color: "#6B7280" },
  { id: "contacted", label: "Contacted", color: "#3B82F6" },
  { id: "confirmed", label: "Confirmed", color: "#10B981" },
  { id: "declined", label: "Declined", color: "#EF4444" },
  { id: "hold", label: "On Hold", color: "#F59E0B" },
]

export const jurassicAIData: Partial<CastingState> = {
  projects: [
    {
      id: "proj_jurassic_ai",
      name: "Jurassic Park",
      description: "Jurassic Park screenplay -- generated from Greenlight JSON-LD scene data.",
      characters,
      createdDate: NOW,
      modifiedDate: NOW,
      props: projectProps,
      propInventory: propInventory,
      propPurchaseRequests: [],
      locations,
      locationInventory: locations,
      costumes: jpCostumes,
      script: jpScriptData,
      productionDesignSets,
      constructionTasks,
    } as any,
  ],
  users: [
    {
      id: "user_demo_casting",
      name: "Alex Rivera",
      email: "alex@gogreenlight.com",
      role: "Casting Director",
      avatar: "",
      permissions: "casting_director",
    },
  ],
  currentUser: {
    id: "user_demo_casting",
    name: "Alex Rivera",
    email: "alex@gogreenlight.com",
    role: "Casting Director",
    avatar: "",
    permissions: "casting_director",
  } as any,
  columnVisibility: {
    headshots: true,
    age: true,
    gender: true,
    location: true,
    agency: true,
    notes: true,
    status: true,
    showVotes: true,
    showActionButtons: true,
  } as any,
  currentFocus: {
    currentProjectId: "proj_jurassic_ai",
    characterId: characters[0]?.id || "",
    activeTabKey: "longList",
    cardDisplayMode: "detailed",
    currentSortOption: "alphabetical",
    searchTerm: "",
    searchTags: [],
    savedSearches: [],
    playerView: { isOpen: false, currentIndex: 0, currentHeadshotIndex: 0 },
  } as any,
  tabDefinitions: [
    { key: "longList", name: "Long List", isCustom: false },
    { key: "shortLists", name: "Shortlist", isCustom: false },
    { key: "audition", name: "Audition", isCustom: false },
    { key: "approval", name: "Approval", isCustom: false },
  ],
  sortOptionDefinitions: [
    { key: "alphabetical", label: "Alphabetical (A-Z)" },
    { key: "consensus", label: "By Consensus" },
    { key: "status", label: "By Status" },
  ],
  predefinedStatuses,
  notifications: [],
  permissionLevels: [
    { id: "admin", label: "Producer", description: "Full access to all features, can manage users and settings." },
    { id: "casting_director", label: "Casting Director", description: "Can manage actors, auditions, and make casting decisions." },
    { id: "producer", label: "Director", description: "Can view all data and approve final casting decisions." },
    { id: "viewer", label: "Viewer", description: "Read-only access to casting data." },
  ],
  modals: {},
  terminology: { actor: { singular: "Actor", plural: "Actors" }, character: { singular: "Character", plural: "Characters" } },
  tabDisplayNames: {},
  scheduleEntries: jpScheduleEntries,
  productionPhases: jpProductionPhases,
  scenes: jpScenes,
  tabNotifications: {},
}
