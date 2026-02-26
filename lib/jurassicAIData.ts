// Jurassic Park data -- imports raw JSON-LD files, transforms to CastingState at runtime
import type { CastingState, ScriptBlock, ScriptData, BeatItem } from "@/types/casting"
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
  const costume = costumeMap[id]
  const styling = stylingMap[id]

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
/*  Locations                                                          */
/* ------------------------------------------------------------------ */
const locations = locsArr.map((l: any) => {
  const id = extractId(l)
  const name: string = l["name"] || id
  const desc: string = l["description"] || "Derived from scene sluglines."
  const scenes = l["gg:scenes"] || []
  const sceneRefs = (Array.isArray(scenes) ? scenes : [scenes]).map(extractId).filter(Boolean)
  return { id, name, description: desc, sceneIds: sceneRefs, sceneTags: sceneRefs }
})

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
const props = propsArr.map((p: any) => {
  const id = extractId(p)
  const name: string = p["name"] || id
  const desc: string = p["description"] || p["gg:evidence"] || ""
  const scenes = p["gg:scenes"] || []
  const sceneRefs = (Array.isArray(scenes) ? scenes : [scenes]).map(extractId).filter(Boolean)
  return { id, name, description: desc, sceneIds: sceneRefs }
})

/* ------------------------------------------------------------------ */
/*  Costumes                                                           */
/* ------------------------------------------------------------------ */
const costumeInventory = characters.map((ch: any) => {
  const c = costumeMap[ch.id]
  return {
    id: ch.id,
    name: ch.name + " Wardrobe",
    characterId: ch.id,
    wardrobeScope: c?.["wardrobeScope"] || "individual",
    characterLevel: ch.characterLevel,
    notes: c ? (c["gg:notes"] || c["name"] || "") : "",
  }
})

const actorHMU = characters.map((ch: any) => {
  const s = stylingMap[ch.id]
  return {
    id: ch.id,
    name: ch.name + " Styling",
    characterId: ch.id,
    characterLevel: ch.characterLevel,
    notes: s ? (s["gg:notes"] || s["name"] || "") : "",
  }
})

const jpCostumes = { inventory: costumeInventory, looks: [] as any[], actorHMU }

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
    props: [],
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
      props,
      locations,
      costumes: jpCostumes,
      script: jpScriptData,
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
