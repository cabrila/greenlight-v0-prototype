/**
 * Build script: fetches the 10 jb2 JSON files from blob URLs and generates lib/jurassicAIData.ts
 * Run with: node scripts/build-jurassic-data.js
 */
const { writeFileSync } = require("fs");

const ROOT = "/vercel/share/v0-project";

const BLOB_URLS = {
  project:       "https://blobs.vusercontent.net/blob/project-56uzHDoDPo06pj6X15XWtyx4Md1xFq.json",
  scenes:        "https://blobs.vusercontent.net/blob/scenes-WN5BNK1WWsyVwqRYCtOXf0552n2dsL.json",
  characters:    "https://blobs.vusercontent.net/blob/characters-dZf9e9RX7CO61o96pyTSriW7AazYFI.json",
  locations:     "https://blobs.vusercontent.net/blob/locations-X8pkmwNukw12NZOYbmDOHrGBHKHLb8.json",
  props:         "https://blobs.vusercontent.net/blob/props-UZsbCINaXV7ANe45af8pEN2MJt0dUs.json",
  effects:       "https://blobs.vusercontent.net/blob/effects-9QErdpxrCjWGWjSWKP51EwYNFRWhnd.json",
  specialActions:"https://blobs.vusercontent.net/blob/special_actions-ypeWrpkU6IdrdAB5tJWAl3SRlsY4nN.json",
  requirements:  "https://blobs.vusercontent.net/blob/requirements-yKlhZAdEkcCH5EZgHjxlnYU8MxylBK.json",
  costumes:      "https://blobs.vusercontent.net/blob/costumes-5miSpyHvgQuOE5RlPeiYWodHXxUI3j.json",
  styling:       "https://blobs.vusercontent.net/blob/styling-AygKDRz7YHSBOk5nEpHctQUaMIJHX1.json",
};

async function main() {

console.log("Fetching JSON files...");
const entries = Object.entries(BLOB_URLS);
const results = await Promise.all(entries.map(async ([key, url]) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch " + key + ": " + res.status);
  return [key, await res.json()];
}));
const data = Object.fromEntries(results);
console.log("All " + entries.length + " JSON files fetched.");

const projectJson   = data.project;
const scenesJson    = data.scenes;
const charsJson     = data.characters;
const locsJson      = data.locations;
const propsJson     = data.props;
const effectsJson   = data.effects;
const actionsJson   = data.specialActions;
const reqsJson      = data.requirements;
const costumesJson  = data.costumes;
const stylingJson   = data.styling;

// ── Helpers ────────────────────────────────────────────────────────────────
/** Extract short id from @id like "gg:character/jb2-grant" → "jb2-grant" */
const shortId = (ggId) => (ggId || "").split("/").pop() || ggId;

/** Escape string for TS template literal */
const esc = (s) => (s || "").replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");

const now = Date.now();

// ── Map graph arrays to lookup maps ────────────────────────────────────────
const scenesArr   = scenesJson["@graph"]   || [];
const charsArr    = charsJson["@graph"]    || [];
const locsArr     = locsJson["@graph"]     || [];
const propsArr    = propsJson["@graph"]    || [];
const effectsArr  = effectsJson["@graph"]  || [];
const actionsArr  = actionsJson["@graph"]  || [];
const reqsArr     = reqsJson["@graph"]     || [];
const costumesArr = costumesJson["@graph"] || [];
const stylingArr  = stylingJson["@graph"]  || [];
const projNode    = (projectJson["@graph"] || [])[0] || {};

// Build lookup maps
const sceneById    = Object.fromEntries(scenesArr.map(s => [s["@id"], s]));
const charById     = Object.fromEntries(charsArr.map(c => [c["@id"], c]));
const locById      = Object.fromEntries(locsArr.map(l => [l["@id"], l]));
const propById     = Object.fromEntries(propsArr.map(p => [p["@id"], p]));
const effectById   = Object.fromEntries(effectsArr.map(e => [e["@id"], e]));
const actionById   = Object.fromEntries(actionsArr.map(a => [a["@id"], a]));
const costumeByChar = Object.fromEntries(costumesArr.map(c => [c.characterAssociation?.["@id"], c]));
const stylingByChar = Object.fromEntries(stylingArr.map(s => [s.characterAssociation?.["@id"], s]));

// Build requirement lookups by character
const reqsByChar = {};
for (const r of reqsArr) {
  for (const rc of (r["gg:relatedCharacters"] || [])) {
    const cid = rc["@id"];
    if (!reqsByChar[cid]) reqsByChar[cid] = [];
    reqsByChar[cid].push(r);
  }
}

// ── Build characters ───────────────────────────────────────────────────────
function buildCharacters() {
  return charsArr.map(c => {
    const cid = shortId(c["@id"]);
    const sceneIds = (c["gg:scenes"] || []).map(s => shortId(s["@id"]));
    const charReqs = reqsByChar[c["@id"]] || [];
    const costume = costumeByChar[c["@id"]];
    const styling = stylingByChar[c["@id"]];
    const castingReq = charReqs.find(r => r["gg:requirementType"] === "casting");
    const safetyReqs = charReqs.filter(r => r["gg:requirementType"] === "safety");
    const schedReqs = charReqs.filter(r => r["gg:requirementType"] === "scheduling");
    
    const castingNotes = [];
    if (c.description) castingNotes.push(c.description);
    if (castingReq) castingNotes.push(`Priority: ${castingReq["gg:priority"]}`);
    if (safetyReqs.length) castingNotes.push(`Safety: ${safetyReqs.map(r => r.name).join("; ")}`);
    if (schedReqs.length) castingNotes.push(`Scheduling: ${schedReqs.map(r => r.name).join("; ")}`);
    if (costume?.["gg:notes"]) castingNotes.push(`Wardrobe: ${costume["gg:notes"]}`);
    if (styling?.["gg:notes"]) castingNotes.push(`Styling: ${styling["gg:notes"]}`);

    return {
      id: cid,
      name: c.name || cid,
      description: c.description || "",
      characterLevel: c["gg:characterLevel"] || "supporting",
      sceneIds,
      castingNotes: castingNotes.join(" | "),
      firstAppearance: shortId(c["gg:firstAppearance"]?.["@id"] || ""),
      actors: { longList: [], shortLists: [], audition: [], approval: [] },
    };
  });
}

// ── Build locations ────────────────────────────────────────────────────────
function buildLocations() {
  return locsArr.map(l => {
    const lid = shortId(l["@id"]);
    const sceneIds = (l["gg:scenes"] || []).map(s => shortId(s["@id"]));
    return {
      id: lid,
      name: l.name || lid,
      description: l.description || "",
      sceneIds,
      sceneTags: sceneIds,
    };
  });
}

// ── Build props ────────────────────────────────────────────────────────────
function buildProps() {
  return propsArr.map(p => {
    const pid = shortId(p["@id"]);
    const sceneIds = (p["gg:scenes"] || []).map(s => shortId(s["@id"]));
    return {
      id: pid,
      name: p.name || pid,
      description: p.description || "",
      sceneIds,
    };
  });
}

// ── Build costumes ─────────────────────────────────────────────────────────
function buildCostumes() {
  const inventory = costumesArr.map(c => ({
    id: shortId(c["@id"]),
    name: c.name || "",
    characterId: shortId(c.characterAssociation?.["@id"] || ""),
    wardrobeScope: c.wardrobeScope || "individual",
    characterLevel: c.characterLevel || "supporting",
    notes: c["gg:notes"] || "",
  }));
  const looks = [];
  const actorHMU = stylingArr.map(s => ({
    id: shortId(s["@id"]),
    name: s.name || "",
    characterId: shortId(s.characterAssociation?.["@id"] || ""),
    characterLevel: s.characterLevel || "supporting",
    notes: s["gg:notes"] || "",
  }));
  return { inventory, looks, actorHMU };
}

// ── Build script blocks from scenes ────────────────────────────────────────
function buildScriptBlocks() {
  const blocks = [];
  let blockIdx = 0;

  // Sort scenes by sequence
  const sorted = [...scenesArr].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  for (const scene of sorted) {
    const sid = shortId(scene["@id"]);
    const sceneNum = scene.sceneNumber || String(scene.sequence || "");

    // Scene heading
    blocks.push({
      id: `jb2-blk-${++blockIdx}`,
      type: "scene-heading",
      text: scene.slugline || "",
      sceneNumber: sceneNum,
      synopsis: scene.synopsis || "",
      linkedLocationId: shortId(scene.locationRef?.["@id"] || ""),
    });

    // Parse scriptText into action/character/dialogue/parenthetical blocks
    const scriptText = scene.scriptText || "";
    if (scriptText) {
      const lines = scriptText.split("\n");
      // Skip the first line (slugline already represented as scene-heading)
      let i = 0;
      // Skip until after the slugline
      while (i < lines.length && !lines[i].match(/^\d+\s+(INT|EXT)\./)) i++;
      if (i < lines.length) i++; // skip the slugline line itself
      
      let currentBlock = { type: "action", lines: [] };
      const flush = () => {
        if (currentBlock.lines.length === 0) return;
        const text = currentBlock.lines.join("\n").trim();
        if (!text) return;
        
        if (currentBlock.type === "character") {
          // Try to find matching character ID
          const charName = text.replace(/\s*\(CONT'D\)\s*/i, "").trim();
          const matchedChar = charsArr.find(c => 
            (c.name || "").toUpperCase() === charName.toUpperCase() ||
            (c.name || "").toUpperCase() === charName.replace(/^(DR\.\s*|MR\.\s*)/i, "").toUpperCase()
          );
          blocks.push({
            id: `jb2-blk-${++blockIdx}`,
            type: "character",
            text: charName,
            linkedCharacterId: matchedChar ? shortId(matchedChar["@id"]) : undefined,
          });
        } else {
          blocks.push({
            id: `jb2-blk-${++blockIdx}`,
            type: currentBlock.type,
            text,
          });
        }
        currentBlock = { type: "action", lines: [] };
      };

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (!trimmed) {
          // Empty line can signal block boundary
          if (currentBlock.lines.length > 0) {
            flush();
          }
          i++;
          continue;
        }

        // Character cue: all caps, indented ~20+ spaces, not starting with EXT/INT
        const charMatch = line.match(/^\s{16,}([A-Z][A-Z\s.'']+(?:\s*\(CONT'D\))?)$/);
        if (charMatch && !trimmed.startsWith("EXT") && !trimmed.startsWith("INT") && !trimmed.startsWith("SUPER")) {
          flush();
          currentBlock = { type: "character", lines: [trimmed] };
          flush();
          i++;
          continue;
        }

        // Parenthetical: indented, in parens
        const parenMatch = trimmed.match(/^\(.*\)$/);
        if (parenMatch && currentBlock.type !== "action") {
          flush();
          blocks.push({
            id: `jb2-blk-${++blockIdx}`,
            type: "parenthetical",
            text: trimmed,
          });
          i++;
          continue;
        }

        // Dialogue: indented ~10-20 spaces (after a character cue)
        const isDialogue = line.match(/^\s{10,}/) && !charMatch;
        if (isDialogue && blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock.type === "character" || lastBlock.type === "parenthetical" || lastBlock.type === "dialogue") {
            if (currentBlock.type !== "dialogue") {
              flush();
              currentBlock = { type: "dialogue", lines: [] };
            }
            currentBlock.lines.push(trimmed);
            i++;
            continue;
          }
        }

        // Transition
        if (trimmed.match(/^(CUT TO:|FADE TO:|SMASH CUT|DISSOLVE TO:)/)) {
          flush();
          blocks.push({
            id: `jb2-blk-${++blockIdx}`,
            type: "transition",
            text: trimmed,
          });
          i++;
          continue;
        }

        // Default: action
        if (currentBlock.type !== "action") {
          flush();
          currentBlock = { type: "action", lines: [] };
        }
        currentBlock.lines.push(trimmed);
        i++;
      }
      flush();
    }
  }
  return blocks;
}

// ── Build beats from act structure ─────────────────────────────────────────
function buildBeats(blocks) {
  const beatColors = ["rose", "blue", "amber", "green", "purple", "pink", "sky", "stone"];
  const beats = [];
  let beatIdx = 0;
  
  // Create a beat for each scene heading
  const sceneHeadings = blocks.filter(b => b.type === "scene-heading");
  
  // Pick key scenes for beats (every ~5th scene to keep it manageable)
  const stride = Math.max(1, Math.floor(sceneHeadings.length / 15));
  for (let i = 0; i < sceneHeadings.length; i += stride) {
    const sh = sceneHeadings[i];
    beats.push({
      id: `jb2-beat-${++beatIdx}`,
      title: sh.synopsis ? sh.synopsis.substring(0, 40) : sh.text.substring(0, 40),
      description: sh.synopsis || sh.text,
      color: beatColors[beatIdx % beatColors.length],
      act: sh.sceneNumber ? (parseInt(sh.sceneNumber) <= 31 ? "Act 1" : parseInt(sh.sceneNumber) <= 97 ? "Act 2" : "Act 3") : "Act 1",
      linkedSceneId: sh.id,
      order: beatIdx,
    });
  }
  return beats;
}

// ── Build schedule entries ─────────────────────────────────────────────────
function buildScheduleEntries() {
  // Group scenes into ~10-scene shoot days
  const sorted = [...scenesArr].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const daysCount = Math.ceil(sorted.length / 10);
  const entries = [];
  
  for (let d = 0; d < daysCount; d++) {
    const dayScenes = sorted.slice(d * 10, (d + 1) * 10);
    const sceneNums = dayScenes.map(s => s.sceneNumber || s.sequence).join(", ");
    const locations = [...new Set(dayScenes.map(s => {
      const loc = locById[s.locationRef?.["@id"]];
      return loc?.name || "TBD";
    }))].join(" / ");
    
    const allChars = new Set();
    for (const sc of dayScenes) {
      for (const c of (sc.charactersInScene || [])) {
        allChars.add(shortId(c["@id"]));
      }
    }

    const allProps = [];
    for (const sc of dayScenes) {
      for (const p of (sc.narrativeObjectsInScene || [])) {
        const prop = propById[p["@id"]];
        if (prop) allProps.push(prop.name);
      }
    }

    const intExt = dayScenes.some(s => s.setting === "interior") && dayScenes.some(s => s.setting === "exterior")
      ? "INT/EXT" : dayScenes.some(s => s.setting === "interior") ? "INT" : "EXT";
    
    const dayNight = dayScenes.some(s => s.timeOfDay === "night") ? "Day-Night" : "Day";

    entries.push({
      id: `jb2-sched-${d + 1}`,
      title: `Day ${d + 1} -- Scenes ${sceneNums} (${intExt} ${dayNight})`,
      date: `1992-08-${String(24 + d).padStart(2, "0")}`,
      phaseId: "jb2-principal",
      startTime: "06:00",
      endTime: "20:00",
      location: locations,
      sceneType: intExt,
      sceneNotes: `Scenes ${sceneNums}.`,
      props: [...new Set(allProps)],
      actorIds: [...allChars],
      crewMembers: [],
      redFlags: [],
      notes: `Shoot day ${d + 1} covering scenes ${sceneNums}.`,
      createdAt: now,
      updatedAt: now,
    });
  }
  return entries;
}

// ── Build stripboard scenes ────────────────────────────────────────────────
function buildStripboardScenes(scheduleEntries) {
  const sorted = [...scenesArr].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const sceneList = [];

  for (let i = 0; i < sorted.length; i++) {
    const sc = sorted[i];
    const dayIdx = Math.floor(i / 10);
    const orderInDay = (i % 10) + 1;
    const schedId = scheduleEntries[dayIdx]?.id || `jb2-sched-${dayIdx + 1}`;
    const loc = locById[sc.locationRef?.["@id"]];
    const chars = (sc.charactersInScene || []).map(c => {
      const ch = charById[c["@id"]];
      return ch?.name?.toUpperCase() || shortId(c["@id"]).toUpperCase();
    });

    sceneList.push({
      id: shortId(sc["@id"]),
      sceneNumber: sc.sceneNumber || String(sc.sequence || ""),
      pages: "1",
      intExt: sc.setting === "interior" ? "INT" : sc.setting === "exterior" ? "EXT" : "INT/EXT",
      location: loc?.name || "TBD",
      dayNight: (sc.timeOfDay || "day").charAt(0).toUpperCase() + (sc.timeOfDay || "day").slice(1),
      cast: chars,
      description: sc.synopsis || sc.slugline || "",
      shootDayId: schedId,
      order: orderInDay,
      createdAt: now,
      updatedAt: now,
    });
  }
  return sceneList;
}

// ── Generate the TypeScript file ───────────────────────────────────────────
const characters = buildCharacters();
const locations = buildLocations();
const props = buildProps();
const costumes = buildCostumes();
const scriptBlocks = buildScriptBlocks();
const beats = buildBeats(scriptBlocks);
const scheduleEntries = buildScheduleEntries();
const stripboardScenes = buildStripboardScenes(scheduleEntries);

const projId = shortId(projNode["@id"] || "jurassic-park-1992-jb2");
const projName = projNode.name || "Jurassic Park (1992)";
const projDesc = projNode.description || "";

// Serialise JS objects to TS-friendly literal strings
const ser = (obj) => JSON.stringify(obj, null, 2);

const tsContent = `// AUTO-GENERATED by scripts/build-jurassic-data.mjs -- DO NOT EDIT BY HAND
// Source: data/jb2/*.json
// Generated: ${new Date().toISOString()}

import type { CastingState, ScriptBlock, ScriptData, BeatItem } from "@/types/casting"
import type { ScheduleEntry, Scene, ProductionPhase } from "@/types/schedule"

/* ── Statuses ─────────────────────────────────────────────────────────── */
const predefinedStatuses = [
  { id: "new", label: "New", color: "#6B7280" },
  { id: "contacted", label: "Contacted", color: "#3B82F6" },
  { id: "confirmed", label: "Confirmed", color: "#10B981" },
  { id: "declined", label: "Declined", color: "#EF4444" },
  { id: "hold", label: "On Hold", color: "#F59E0B" },
]

/* ── Characters ───────────────────────────────────────────────────────── */
const characters = ${ser(characters)} as any[]

/* ── Locations ────────────────────────────────────────────────────────── */
const locations = ${ser(locations)} as any[]

/* ── Props ────────────────────────────────────────────────────────────── */
const props = ${ser(props)} as any[]

/* ── Costumes ─────────────────────────────────────────────────────────── */
const costumes = ${ser(costumes)} as any

/* ── Script Blocks ────────────────────────────────────────────────────── */
const scriptBlocks: ScriptBlock[] = ${ser(scriptBlocks)} as any[]

/* ── Beats ────────────────────────────────────────────────────────────── */
const beats: BeatItem[] = ${ser(beats)} as any[]

/* ── Script Data ──────────────────────────────────────────────────────── */
const JP_SCRIPT_DATA: ScriptData = {
  blocks: scriptBlocks,
  locked: false,
  lockedSceneSuffixes: {},
  currentRevision: "white",
  lastModified: ${now},
  beats,
}

/* ── Production Phases ────────────────────────────────────────────────── */
const jpProductionPhases: ProductionPhase[] = [
  { id: "jb2-principal", name: "Principal Photography", startDate: "1992-08-24", color: "text-blue-700", bgColor: "bg-blue-500" },
  { id: "jb2-second-unit", name: "Second Unit / VFX", startDate: "1992-10-05", color: "text-lime-700", bgColor: "bg-lime-500" },
  { id: "jb2-pickups", name: "Pickups", startDate: "1992-11-02", color: "text-orange-700", bgColor: "bg-orange-500" },
]

/* ── Schedule Entries ─────────────────────────────────────────────────── */
const jpScheduleEntries: ScheduleEntry[] = ${ser(scheduleEntries)} as any[]

/* ── Stripboard Scenes ────────────────────────────────────────────────── */
const jpScenes: Scene[] = ${ser(stripboardScenes)} as any[]

/* ── Full CastingState Export ─────────────────────────────────────────── */
export const jurassicAIData: Partial<CastingState> = {
  projects: [
    {
      id: "proj_jurassic_ai",
      name: ${JSON.stringify(projName)},
      description: ${JSON.stringify(projDesc)},
      characters,
      createdDate: ${now},
      modifiedDate: ${now},
      props,
      locations,
      costumes,
      script: JP_SCRIPT_DATA,
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
    playerView: {
      isOpen: false,
      currentIndex: 0,
      currentHeadshotIndex: 0,
    },
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
`;

// Write to /tmp so it can be read back
writeFileSync("/tmp/jurassicAIData.ts", tsContent, "utf-8");
console.log("Wrote /tmp/jurassicAIData.ts (" + tsContent.length + " chars)");

console.log("Generated lib/jurassicAIData.ts");
console.log("  Characters: " + characters.length);
console.log("  Locations:  " + locations.length);
console.log("  Props:      " + props.length);
console.log("  Costumes:   " + costumes.inventory.length + " inventory, " + costumes.actorHMU.length + " HMU");
console.log("  Scenes:     " + scenesArr.length + " (JSON) -> " + stripboardScenes.length + " (stripboard)");
console.log("  Script:     " + scriptBlocks.length + " blocks, " + beats.length + " beats");
console.log("  Schedule:   " + scheduleEntries.length + " shoot days");
console.log("  Requirements: " + reqsArr.length);

} // end main()

main().catch(err => { console.error(err); process.exit(1); });
