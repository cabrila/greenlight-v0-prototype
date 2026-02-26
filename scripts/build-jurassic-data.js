/**
 * Build script: fetches the 10 jb2 JSON files from blob URLs and generates
 * multiple smaller TS files under lib/jurassic/ plus a thin re-export index.
 * Run with: node scripts/build-jurassic-data.js
 *
 * Output files:
 *   lib/jurassic/jb2Characters.ts
 *   lib/jurassic/jb2Locations.ts
 *   lib/jurassic/jb2Props.ts
 *   lib/jurassic/jb2Costumes.ts
 *   lib/jurassic/jb2ScriptBlocks.ts
 *   lib/jurassic/jb2Beats.ts
 *   lib/jurassic/jb2Schedule.ts
 *   lib/jurassic/jb2Scenes.ts
 *   lib/jurassicAIData.ts   (thin import + combine)
 */

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
const shortId = (ggId) => (ggId || "").split("/").pop() || ggId;
const now = Date.now();
const ser = (obj) => JSON.stringify(obj, null, 2);

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

const sceneById    = Object.fromEntries(scenesArr.map(s => [s["@id"], s]));
const charById     = Object.fromEntries(charsArr.map(c => [c["@id"], c]));
const locById      = Object.fromEntries(locsArr.map(l => [l["@id"], l]));
const propById     = Object.fromEntries(propsArr.map(p => [p["@id"], p]));
const costumeByChar = Object.fromEntries(costumesArr.map(c => [c.characterAssociation?.["@id"], c]));
const stylingByChar = Object.fromEntries(stylingArr.map(s => [s.characterAssociation?.["@id"], s]));

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
    if (castingReq) castingNotes.push("Priority: " + castingReq["gg:priority"]);
    if (safetyReqs.length) castingNotes.push("Safety: " + safetyReqs.map(r => r.name).join("; "));
    if (schedReqs.length) castingNotes.push("Scheduling: " + schedReqs.map(r => r.name).join("; "));
    if (costume?.["gg:notes"]) castingNotes.push("Wardrobe: " + costume["gg:notes"]);
    if (styling?.["gg:notes"]) castingNotes.push("Styling: " + styling["gg:notes"]);

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
  const sorted = [...scenesArr].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  for (const scene of sorted) {
    const sid = shortId(scene["@id"]);
    const sceneNum = scene.sceneNumber || String(scene.sequence || "");

    blocks.push({
      id: "jb2-blk-" + (++blockIdx),
      type: "scene-heading",
      text: scene.slugline || "",
      sceneNumber: sceneNum,
      synopsis: scene.synopsis || "",
      linkedLocationId: shortId(scene.locationRef?.["@id"] || ""),
    });

    const scriptText = scene.scriptText || "";
    if (scriptText) {
      const lines = scriptText.split("\n");
      let i = 0;
      while (i < lines.length && !lines[i].match(/^\d+\s+(INT|EXT)\./)) i++;
      if (i < lines.length) i++;
      
      let currentBlock = { type: "action", lines: [] };
      const flush = () => {
        if (currentBlock.lines.length === 0) return;
        const text = currentBlock.lines.join("\n").trim();
        if (!text) return;
        
        if (currentBlock.type === "character") {
          const charName = text.replace(/\s*\(CONT'D\)\s*/i, "").trim();
          const matchedChar = charsArr.find(c => 
            (c.name || "").toUpperCase() === charName.toUpperCase() ||
            (c.name || "").toUpperCase() === charName.replace(/^(DR\.\s*|MR\.\s*)/i, "").toUpperCase()
          );
          blocks.push({
            id: "jb2-blk-" + (++blockIdx),
            type: "character",
            text: charName,
            linkedCharacterId: matchedChar ? shortId(matchedChar["@id"]) : undefined,
          });
        } else {
          blocks.push({
            id: "jb2-blk-" + (++blockIdx),
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
          if (currentBlock.lines.length > 0) flush();
          i++;
          continue;
        }

        const charMatch = line.match(/^\s{16,}([A-Z][A-Z\s.'']+(?:\s*\(CONT'D\))?)$/);
        if (charMatch && !trimmed.startsWith("EXT") && !trimmed.startsWith("INT") && !trimmed.startsWith("SUPER")) {
          flush();
          currentBlock = { type: "character", lines: [trimmed] };
          flush();
          i++;
          continue;
        }

        const parenMatch = trimmed.match(/^\(.*\)$/);
        if (parenMatch && currentBlock.type !== "action") {
          flush();
          blocks.push({
            id: "jb2-blk-" + (++blockIdx),
            type: "parenthetical",
            text: trimmed,
          });
          i++;
          continue;
        }

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

        if (trimmed.match(/^(CUT TO:|FADE TO:|SMASH CUT|DISSOLVE TO:)/)) {
          flush();
          blocks.push({
            id: "jb2-blk-" + (++blockIdx),
            type: "transition",
            text: trimmed,
          });
          i++;
          continue;
        }

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

// ── Build beats ───────────────────────────────────────────────────────────
function buildBeats(blocks) {
  const beatColors = ["rose", "blue", "amber", "green", "purple", "pink", "sky", "stone"];
  const beats = [];
  let beatIdx = 0;
  const sceneHeadings = blocks.filter(b => b.type === "scene-heading");
  const stride = Math.max(1, Math.floor(sceneHeadings.length / 15));
  for (let i = 0; i < sceneHeadings.length; i += stride) {
    const sh = sceneHeadings[i];
    beats.push({
      id: "jb2-beat-" + (++beatIdx),
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
  const sorted = [...scenesArr].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const daysCount = Math.ceil(sorted.length / 10);
  const entries = [];
  
  for (let d = 0; d < daysCount; d++) {
    const dayScenes = sorted.slice(d * 10, (d + 1) * 10);
    const sceneNums = dayScenes.map(s => s.sceneNumber || s.sequence).join(", ");
    const locs = [...new Set(dayScenes.map(s => {
      const loc = locById[s.locationRef?.["@id"]];
      return loc?.name || "TBD";
    }))].join(" / ");
    
    const allChars = new Set();
    for (const sc of dayScenes) {
      for (const c of (sc.charactersInScene || [])) allChars.add(shortId(c["@id"]));
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
      id: "jb2-sched-" + (d + 1),
      title: "Day " + (d + 1) + " -- Scenes " + sceneNums + " (" + intExt + " " + dayNight + ")",
      date: "1992-08-" + String(24 + d).padStart(2, "0"),
      phaseId: "jb2-principal",
      startTime: "06:00",
      endTime: "20:00",
      location: locs,
      sceneType: intExt,
      sceneNotes: "Scenes " + sceneNums + ".",
      props: [...new Set(allProps)],
      actorIds: [...allChars],
      crewMembers: [],
      redFlags: [],
      notes: "Shoot day " + (d + 1) + " covering scenes " + sceneNums + ".",
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
    const schedId = scheduleEntries[dayIdx]?.id || "jb2-sched-" + (dayIdx + 1);
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

// ══════════════════════════════════════════════════════════════════════════
// Generate all data
// ══════════════════════════════════════════════════════════════════════════
const characters = buildCharacters();
const locations = buildLocations();
const props = buildProps();
const costumes = buildCostumes();
const scriptBlocks = buildScriptBlocks();
const beats = buildBeats(scriptBlocks);
const scheduleEntries = buildScheduleEntries();
const stripboardScenes = buildStripboardScenes(scheduleEntries);

const projName = projNode.name || "Jurassic Park (1992)";
const projDesc = projNode.description || "";

// ══════════════════════════════════════════════════════════════════════════
// Output: multiple files delimited by __FILE:path__ markers
// ══════════════════════════════════════════════════════════════════════════
const HEADER = "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n";

const files = {};

// 1. Characters
files["lib/jurassic/jb2Characters.ts"] = HEADER +
  "export const jb2Characters = " + ser(characters) + " as any[]\n";

// 2. Locations
files["lib/jurassic/jb2Locations.ts"] = HEADER +
  "export const jb2Locations = " + ser(locations) + " as any[]\n";

// 3. Props
files["lib/jurassic/jb2Props.ts"] = HEADER +
  "export const jb2Props = " + ser(props) + " as any[]\n";

// 4. Costumes
files["lib/jurassic/jb2Costumes.ts"] = HEADER +
  "export const jb2Costumes = " + ser(costumes) + " as any\n";

// 5. Script blocks (the largest file)
files["lib/jurassic/jb2ScriptBlocks.ts"] = HEADER +
  'import type { ScriptBlock } from "@/types/casting"\n\n' +
  "export const jb2ScriptBlocks: ScriptBlock[] = " + ser(scriptBlocks) + " as any[]\n";

// 6. Beats
files["lib/jurassic/jb2Beats.ts"] = HEADER +
  'import type { BeatItem } from "@/types/casting"\n\n' +
  "export const jb2Beats: BeatItem[] = " + ser(beats) + " as any[]\n";

// 7. Schedule entries
files["lib/jurassic/jb2Schedule.ts"] = HEADER +
  'import type { ScheduleEntry, ProductionPhase } from "@/types/schedule"\n\n' +
  "export const jb2ProductionPhases: ProductionPhase[] = [\n" +
  '  { id: "jb2-principal", name: "Principal Photography", startDate: "1992-08-24", color: "text-blue-700", bgColor: "bg-blue-500" },\n' +
  '  { id: "jb2-second-unit", name: "Second Unit / VFX", startDate: "1992-10-05", color: "text-lime-700", bgColor: "bg-lime-500" },\n' +
  '  { id: "jb2-pickups", name: "Pickups", startDate: "1992-11-02", color: "text-orange-700", bgColor: "bg-orange-500" },\n' +
  "]\n\n" +
  "export const jb2ScheduleEntries: ScheduleEntry[] = " + ser(scheduleEntries) + " as any[]\n";

// 8. Stripboard scenes
files["lib/jurassic/jb2Scenes.ts"] = HEADER +
  'import type { Scene } from "@/types/schedule"\n\n' +
  "export const jb2Scenes: Scene[] = " + ser(stripboardScenes) + " as any[]\n";

// 9. Thin index that imports everything and exports CastingState
files["lib/jurassicAIData.ts"] = HEADER +
'import type { CastingState, ScriptData } from "@/types/casting"\n' +
'import { jb2Characters } from "./jurassic/jb2Characters"\n' +
'import { jb2Locations } from "./jurassic/jb2Locations"\n' +
'import { jb2Props } from "./jurassic/jb2Props"\n' +
'import { jb2Costumes } from "./jurassic/jb2Costumes"\n' +
'import { jb2ScriptBlocks } from "./jurassic/jb2ScriptBlocks"\n' +
'import { jb2Beats } from "./jurassic/jb2Beats"\n' +
'import { jb2ScheduleEntries, jb2ProductionPhases } from "./jurassic/jb2Schedule"\n' +
'import { jb2Scenes } from "./jurassic/jb2Scenes"\n' +
'\n' +
'const JP_SCRIPT_DATA: ScriptData = {\n' +
'  blocks: jb2ScriptBlocks,\n' +
'  locked: false,\n' +
'  lockedSceneSuffixes: {},\n' +
'  currentRevision: "white",\n' +
'  lastModified: ' + now + ',\n' +
'  beats: jb2Beats,\n' +
'}\n' +
'\n' +
'const predefinedStatuses = [\n' +
'  { id: "new", label: "New", color: "#6B7280" },\n' +
'  { id: "contacted", label: "Contacted", color: "#3B82F6" },\n' +
'  { id: "confirmed", label: "Confirmed", color: "#10B981" },\n' +
'  { id: "declined", label: "Declined", color: "#EF4444" },\n' +
'  { id: "hold", label: "On Hold", color: "#F59E0B" },\n' +
']\n' +
'\n' +
'export const jurassicAIData: Partial<CastingState> = {\n' +
'  projects: [\n' +
'    {\n' +
'      id: "proj_jurassic_ai",\n' +
'      name: ' + JSON.stringify(projName) + ',\n' +
'      description: ' + JSON.stringify(projDesc) + ',\n' +
'      characters: jb2Characters,\n' +
'      createdDate: ' + now + ',\n' +
'      modifiedDate: ' + now + ',\n' +
'      props: jb2Props,\n' +
'      locations: jb2Locations,\n' +
'      costumes: jb2Costumes,\n' +
'      script: JP_SCRIPT_DATA,\n' +
'    } as any,\n' +
'  ],\n' +
'  users: [\n' +
'    {\n' +
'      id: "user_demo_casting",\n' +
'      name: "Alex Rivera",\n' +
'      email: "alex@gogreenlight.com",\n' +
'      role: "Casting Director",\n' +
'      avatar: "",\n' +
'      permissions: "casting_director",\n' +
'    },\n' +
'  ],\n' +
'  currentUser: {\n' +
'    id: "user_demo_casting",\n' +
'    name: "Alex Rivera",\n' +
'    email: "alex@gogreenlight.com",\n' +
'    role: "Casting Director",\n' +
'    avatar: "",\n' +
'    permissions: "casting_director",\n' +
'  } as any,\n' +
'  columnVisibility: {\n' +
'    headshots: true,\n' +
'    age: true,\n' +
'    gender: true,\n' +
'    location: true,\n' +
'    agency: true,\n' +
'    notes: true,\n' +
'    status: true,\n' +
'    showVotes: true,\n' +
'    showActionButtons: true,\n' +
'  } as any,\n' +
'  currentFocus: {\n' +
'    currentProjectId: "proj_jurassic_ai",\n' +
'    characterId: jb2Characters[0]?.id || "",\n' +
'    activeTabKey: "longList",\n' +
'    cardDisplayMode: "detailed",\n' +
'    currentSortOption: "alphabetical",\n' +
'    searchTerm: "",\n' +
'    searchTags: [],\n' +
'    savedSearches: [],\n' +
'    playerView: {\n' +
'      isOpen: false,\n' +
'      currentIndex: 0,\n' +
'      currentHeadshotIndex: 0,\n' +
'    },\n' +
'  } as any,\n' +
'  tabDefinitions: [\n' +
'    { key: "longList", name: "Long List", isCustom: false },\n' +
'    { key: "shortLists", name: "Shortlist", isCustom: false },\n' +
'    { key: "audition", name: "Audition", isCustom: false },\n' +
'    { key: "approval", name: "Approval", isCustom: false },\n' +
'  ],\n' +
'  sortOptionDefinitions: [\n' +
'    { key: "alphabetical", label: "Alphabetical (A-Z)" },\n' +
'    { key: "consensus", label: "By Consensus" },\n' +
'    { key: "status", label: "By Status" },\n' +
'  ],\n' +
'  predefinedStatuses,\n' +
'  notifications: [],\n' +
'  permissionLevels: [\n' +
'    { id: "admin", label: "Producer", description: "Full access to all features, can manage users and settings." },\n' +
'    { id: "casting_director", label: "Casting Director", description: "Can manage actors, auditions, and make casting decisions." },\n' +
'    { id: "producer", label: "Director", description: "Can view all data and approve final casting decisions." },\n' +
'    { id: "viewer", label: "Viewer", description: "Read-only access to casting data." },\n' +
'  ],\n' +
'  modals: {},\n' +
'  terminology: { actor: { singular: "Actor", plural: "Actors" }, character: { singular: "Character", plural: "Characters" } },\n' +
'  tabDisplayNames: {},\n' +
'  scheduleEntries: jb2ScheduleEntries,\n' +
'  productionPhases: jb2ProductionPhases,\n' +
'  scenes: jb2Scenes,\n' +
'  tabNotifications: {},\n' +
'}\n';

// Output all files delimited by markers
for (const [path, content] of Object.entries(files)) {
  console.log("__FILE:" + path + "__");
  console.log(content);
  console.log("__ENDFILE__");
}

console.log("STATS:");
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
