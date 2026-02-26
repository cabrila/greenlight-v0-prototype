/**
 * Fetches all jb2 JSON files, transforms them, and writes the 9 split files
 * to /tmp so they can be read back and copied to the project.
 */
const { writeFileSync, mkdirSync } = require("fs");

mkdirSync("/tmp/jurassic", { recursive: true });

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

const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");

async function main() {
  console.log("Fetching...");
  const entries = Object.entries(BLOB_URLS);
  const results = await Promise.all(entries.map(async ([key, url]) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed: " + key + " " + res.status);
    return [key, await res.json()];
  }));
  const data = Object.fromEntries(results);
  console.log("Fetched all 10 JSON files.");

  const charsJson = data.characters;
  const locsJson = data.locations;
  const propsJson = data.props;
  const costumesJson = data.costumes;
  const stylingJson = data.styling;
  const scenesJson = data.scenes;
  const reqsJson = data.requirements;
  const effectsJson = data.effects;
  const actionsJson = data.specialActions;
  const projectJson = data.project;

  const NOW = Date.now();
  const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 60);

  // Characters
  const charsArr = Array.isArray(charsJson) ? charsJson : charsJson["gg:characters"] || [];
  const reqsArr = Array.isArray(reqsJson) ? reqsJson : reqsJson["gg:requirements"] || [];
  const costumesArr = Array.isArray(costumesJson) ? costumesJson : costumesJson["gg:wardrobes"] || [];
  const stylingArr = Array.isArray(stylingJson) ? stylingJson : stylingJson["gg:stylings"] || [];
  const effectsArr = Array.isArray(effectsJson) ? effectsJson : effectsJson["gg:effects"] || [];
  const actionsArr = Array.isArray(actionsJson) ? actionsJson : actionsJson["gg:specialActions"] || [];
  const scenesArr = Array.isArray(scenesJson) ? scenesJson : scenesJson["gg:scenes"] || [];
  const locsArr = Array.isArray(locsJson) ? locsJson : locsJson["gg:locations"] || [];
  const propsArr = Array.isArray(propsJson) ? propsJson : propsJson["gg:objects"] || [];

  const extractId = (atId) => {
    if (!atId) return "";
    const parts = atId.split("/");
    return parts[parts.length - 1] || atId;
  };

  // Build requirement map per character
  const reqMap = {};
  for (const r of reqsArr) {
    const charRef = r["gg:characterRef"] || "";
    const cId = extractId(charRef);
    if (!cId) continue;
    if (!reqMap[cId]) reqMap[cId] = [];
    reqMap[cId].push(r);
  }

  // Build costume map
  const costumeMap = {};
  for (const c of costumesArr) {
    const charRef = c["gg:characterRef"] || "";
    const cId = extractId(charRef);
    if (cId) costumeMap[cId] = c;
  }

  // Build styling map
  const stylingMap = {};
  for (const s of stylingArr) {
    const charRef = s["gg:characterRef"] || "";
    const cId = extractId(charRef);
    if (cId) stylingMap[cId] = s;
  }

  // ─── Characters ───
  const characters = charsArr.map((c) => {
    const id = extractId(c["@id"]);
    const name = c["schema:name"] || id;
    const desc = c["schema:description"] || "";
    const level = c["gg:characterLevel"] || "dayPlayer";
    const sceneRefs = (c["gg:sceneRefs"] || []).map(extractId);
    const firstApp = sceneRefs[0] || "";
    const reqs = reqMap[id] || [];
    const costume = costumeMap[id];
    const styling = stylingMap[id];
    let notes = desc;
    for (const r of reqs) {
      const cat = r["gg:requirementCategory"] || "";
      const rDesc = r["schema:description"] || r["schema:name"] || "";
      if (rDesc) notes += " | " + (cat ? cat + ": " : "") + rDesc;
    }
    if (costume) notes += " | Wardrobe: " + (costume["schema:description"] || costume["schema:name"] || "");
    if (styling) notes += " | Styling: " + (styling["schema:description"] || styling["schema:name"] || "");
    return { id, name, description: desc, characterLevel: level, sceneIds: sceneRefs, castingNotes: notes, firstAppearance: firstApp, actors: { longList: [], shortLists: [], audition: [], approval: [] } };
  });

  // ─── Locations ───
  const locations = locsArr.map((l) => {
    const id = extractId(l["@id"]);
    const name = l["schema:name"] || id;
    const desc = l["schema:description"] || "Derived directly from scene sluglines.";
    const sceneRefs = (l["gg:sceneRefs"] || []).map(extractId);
    return { id, name, description: desc, sceneIds: sceneRefs, sceneTags: sceneRefs };
  });

  // ─── Props ───
  const props = propsArr.map((p) => {
    const id = extractId(p["@id"]);
    const name = p["schema:name"] || id;
    const desc = p["schema:description"] || "";
    const sceneRefs = (p["gg:sceneRefs"] || []).map(extractId);
    return { id, name, description: desc, sceneIds: sceneRefs };
  });

  // ─── Costumes ───
  const inventory = characters.map((ch) => {
    const c = costumeMap[ch.id];
    return { id: ch.id, name: ch.name + " Wardrobe", characterId: ch.id, wardrobeScope: "individual", characterLevel: ch.characterLevel, notes: c ? (c["schema:description"] || c["schema:name"] || "") : "" };
  });
  const actorHMU = characters.map((ch) => {
    const s = stylingMap[ch.id];
    return { id: ch.id, name: ch.name + " Styling", characterId: ch.id, characterLevel: ch.characterLevel, notes: s ? (s["schema:description"] || s["schema:name"] || "") : "" };
  });
  const costumes = { inventory, looks: [], actorHMU };

  // ─── Script Blocks ───
  let blkIdx = 0;
  const scriptBlocks = [];

  const charNameMap = {};
  for (const c of characters) charNameMap[c.id] = c.name;

  for (const scene of scenesArr) {
    const sceneId = extractId(scene["@id"]);
    const sceneNum = scene["gg:sceneNumber"] || "";
    const heading = scene["gg:slugline"] || ("SCENE " + sceneNum);
    const synopsis = scene["schema:description"] || "";
    const scriptText = scene["gg:scriptText"] || "";
    const charRefs = (scene["gg:characterRefs"] || []).map(extractId);

    blkIdx++;
    scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "scene-heading", text: heading, synopsis: synopsis });

    if (scriptText) {
      const lines = scriptText.split("\\n");
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) { i++; continue; }
        const upper = line.toUpperCase();
        const isCharLine = charRefs.some((cId) => {
          const cName = (charNameMap[cId] || cId).toUpperCase();
          return upper === cName || upper.startsWith(cName + " (");
        });
        if (isCharLine) {
          const matchedChar = charRefs.find((cId) => {
            const cName = (charNameMap[cId] || cId).toUpperCase();
            return upper === cName || upper.startsWith(cName + " (");
          });
          blkIdx++;
          scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "character", text: line, linkedCharacterId: matchedChar || undefined });
          i++;
          if (i < lines.length) {
            const next = lines[i].trim();
            if (next.startsWith("(") && next.endsWith(")")) {
              blkIdx++;
              scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "parenthetical", text: next });
              i++;
            }
          }
          const dLines = [];
          while (i < lines.length) {
            const dl = lines[i].trim();
            if (!dl) break;
            const dlUpper = dl.toUpperCase();
            const isNext = charRefs.some((cId) => {
              const cName = (charNameMap[cId] || cId).toUpperCase();
              return dlUpper === cName || dlUpper.startsWith(cName + " (");
            });
            if (isNext) break;
            dLines.push(dl);
            i++;
          }
          if (dLines.length) {
            blkIdx++;
            scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "dialogue", text: dLines.join("\\n") });
          }
        } else {
          const actionLines = [line];
          i++;
          while (i < lines.length) {
            const nl = lines[i].trim();
            if (!nl) { i++; break; }
            const nlUpper = nl.toUpperCase();
            const isChar = charRefs.some((cId) => {
              const cName = (charNameMap[cId] || cId).toUpperCase();
              return nlUpper === cName || nlUpper.startsWith(cName + " (");
            });
            if (isChar) break;
            actionLines.push(nl);
            i++;
          }
          blkIdx++;
          scriptBlocks.push({ id: "jb2-blk-" + blkIdx, type: "action", text: actionLines.join("\\n") });
        }
      }
    }
  }

  // ─── Beats ───
  const beatColors = ["blue","green","amber","rose","purple","sky","pink","stone","lime","orange","cyan","fuchsia","teal","indigo","red","yellow","emerald"];
  const scenesWithHeadings = scenesArr.filter((s) => s["gg:sceneNumber"] && parseInt(s["gg:sceneNumber"]) > 0);
  const beatStep = Math.max(1, Math.floor(scenesWithHeadings.length / 17));
  const beats = [];
  for (let bi = 0; bi < 17 && bi * beatStep < scenesWithHeadings.length; bi++) {
    const s = scenesWithHeadings[bi * beatStep];
    const desc = s["schema:description"] || s["gg:slugline"] || "";
    const title = desc.substring(0, 40);
    const act = bi < 5 ? "Act 1" : bi < 11 ? "Act 2" : "Act 3";
    const sId = extractId(s["@id"]);
    const blk = scriptBlocks.find((b) => b.type === "scene-heading" && b.synopsis && b.synopsis === s["schema:description"]);
    beats.push({ id: "jb2-beat-" + (bi + 1), title, description: desc, color: beatColors[bi % beatColors.length], act, linkedSceneId: blk ? blk.id : sId, order: bi + 1 });
  }

  // ─── Schedule ───
  const phases = [
    '{ id: "jb2-principal", name: "Principal Photography", startDate: "1992-08-24", color: "text-blue-700", bgColor: "bg-blue-500" }',
    '{ id: "jb2-second-unit", name: "Second Unit / VFX", startDate: "1992-10-05", color: "text-lime-700", bgColor: "bg-lime-500" }',
    '{ id: "jb2-pickups", name: "Pickups", startDate: "1992-11-02", color: "text-orange-700", bgColor: "bg-orange-500" }',
  ];

  const SCENES_PER_DAY = 10;
  const scheduleEntries = [];
  for (let d = 0; d * SCENES_PER_DAY < scenesArr.length; d++) {
    const dayScenes = scenesArr.slice(d * SCENES_PER_DAY, (d + 1) * SCENES_PER_DAY);
    const firstNum = dayScenes[0]["gg:sceneNumber"] || "?";
    const lastNum = dayScenes[dayScenes.length - 1]["gg:sceneNumber"] || "?";
    const allChars = [...new Set(dayScenes.flatMap((s) => (s["gg:characterRefs"] || []).map(extractId)))];
    const dateStr = "1992-08-" + String(24 + d).padStart(2, "0");
    scheduleEntries.push({
      id: "jb2-sched-" + (d + 1),
      title: "Day " + (d + 1) + " - Scenes " + firstNum + "-" + lastNum,
      date: dateStr,
      phaseId: "jb2-principal",
      startTime: "06:00",
      endTime: "20:00",
      location: dayScenes.map((s) => s["gg:slugline"] || "").filter(Boolean).slice(0, 3).join(" / "),
      sceneType: "INT/EXT",
      sceneNotes: dayScenes.map((s) => "Sc " + (s["gg:sceneNumber"] || "?") + ": " + (s["schema:description"] || "")).join(". "),
      props: [],
      actorIds: allChars,
      crewMembers: [],
      redFlags: [],
      notes: "Scenes " + firstNum + " through " + lastNum,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }

  // ─── Stripboard scenes ───
  const stripboardScenes = scenesArr.map((s, idx) => {
    const id = extractId(s["@id"]);
    const num = s["gg:sceneNumber"] || String(idx + 1);
    const intExt = (s["gg:slugline"] || "").startsWith("INT") ? "INT" : "EXT";
    const locName = (s["gg:slugline"] || "").replace(/^(INT\.|EXT\.|INT\/EXT\.?)\s*/i, "").replace(/\s*-\s*(DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER).*$/i, "").trim() || "UNKNOWN";
    const dayNight = /NIGHT/i.test(s["gg:slugline"] || "") ? "Night" : "Day";
    const charRefs = (s["gg:characterRefs"] || []).map((ref) => { const cId = extractId(ref); return charNameMap[cId] || cId; });
    const shootDay = "jb2-sched-" + (Math.floor(idx / SCENES_PER_DAY) + 1);
    return { id, sceneNumber: num, pages: "1", intExt, location: locName, dayNight, cast: charRefs, description: s["schema:description"] || "", shootDayId: shootDay, order: idx + 1, createdAt: NOW, updatedAt: NOW };
  });

  // ─── Write all files ───
  const files = {};

  // 1. Characters
  files["jb2Characters.ts"] = "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nexport const jb2Characters = " + JSON.stringify(characters, null, 2) + " as any[]\n";

  // 2. Locations
  files["jb2Locations.ts"] = "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nexport const jb2Locations = " + JSON.stringify(locations, null, 2) + " as any[]\n";

  // 3. Props
  files["jb2Props.ts"] = "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nexport const jb2Props = " + JSON.stringify(props, null, 2) + " as any[]\n";

  // 4. Costumes
  files["jb2Costumes.ts"] = "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nexport const jb2Costumes = " + JSON.stringify(costumes, null, 2) + " as any\n";

  // 5. ScriptBlocks
  files["jb2ScriptBlocks.ts"] = '// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nimport type { ScriptBlock } from "@/types/casting"\n\nexport const jb2ScriptBlocks: ScriptBlock[] = ' + JSON.stringify(scriptBlocks, null, 2) + "\n";

  // 6. Beats
  files["jb2Beats.ts"] = '// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nimport type { BeatItem } from "@/types/casting"\n\nexport const jb2Beats: BeatItem[] = ' + JSON.stringify(beats, null, 2) + "\n";

  // 7. Schedule
  let schedContent = '// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nimport type { ScheduleEntry, ProductionPhase } from "@/types/schedule"\n\n';
  schedContent += "export const jb2ProductionPhases: ProductionPhase[] = [\n  " + phases.join(",\n  ") + ",\n]\n\n";
  schedContent += "export const jb2ScheduleEntries: ScheduleEntry[] = " + JSON.stringify(scheduleEntries, null, 2) + " as any[]\n";
  files["jb2Schedule.ts"] = schedContent;

  // 8. Stripboard Scenes
  files["jb2Scenes.ts"] = '// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\nimport type { Scene } from "@/types/schedule"\n\nexport const jb2Scenes: Scene[] = ' + JSON.stringify(stripboardScenes, null, 2) + " as any[]\n";

  // Write each to /tmp/jurassic/
  for (const [fname, content] of Object.entries(files)) {
    writeFileSync("/tmp/jurassic/" + fname, content, "utf-8");
    console.log("Wrote /tmp/jurassic/" + fname + " (" + content.length + " chars)");
  }

  // 9. Main combiner
  const combiner = `// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND
import type { CastingState, ScriptData } from "@/types/casting"
import { jb2Characters } from "./jurassic/jb2Characters"
import { jb2Locations } from "./jurassic/jb2Locations"
import { jb2Props } from "./jurassic/jb2Props"
import { jb2Costumes } from "./jurassic/jb2Costumes"
import { jb2ScriptBlocks } from "./jurassic/jb2ScriptBlocks"
import { jb2Beats } from "./jurassic/jb2Beats"
import { jb2ScheduleEntries, jb2ProductionPhases } from "./jurassic/jb2Schedule"
import { jb2Scenes } from "./jurassic/jb2Scenes"

const JP_SCRIPT_DATA: ScriptData = {
  blocks: jb2ScriptBlocks,
  locked: false,
  lockedSceneSuffixes: {},
  currentRevision: "white",
  lastModified: ${NOW},
  beats: jb2Beats,
}

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
      description: "Jurassic Park screenplay analysis generated strictly from script text using chunking strategy phases.",
      characters: jb2Characters,
      createdDate: ${NOW},
      modifiedDate: ${NOW},
      props: jb2Props,
      locations: jb2Locations,
      costumes: jb2Costumes,
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
    characterId: jb2Characters[0]?.id || "",
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
  scheduleEntries: jb2ScheduleEntries,
  productionPhases: jb2ProductionPhases,
  scenes: jb2Scenes,
  tabNotifications: {},
}
`;
  writeFileSync("/tmp/jurassic/jurassicAIData.ts", combiner, "utf-8");
  console.log("Wrote /tmp/jurassic/jurassicAIData.ts (" + combiner.length + " chars)");

  // Now output a simple mapping for the caller
  console.log("\n__FILELIST__");
  for (const fname of [...Object.keys(files), "jurassicAIData.ts"]) {
    console.log(fname);
  }
  console.log("__ENDFILELIST__");
}

main().catch(err => { console.error(err); process.exit(1); });
