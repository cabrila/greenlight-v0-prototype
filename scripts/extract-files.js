const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const { dirname } = require("path");

// The output was captured by the tool system -- we re-fetch it via the same blob URLs
// and re-run the same transformation, but this time write to /tmp then print paths

async function main() {
  // Re-fetch all JSON sources
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

  const entries = Object.entries(BLOB_URLS);
  const results = await Promise.all(entries.map(async ([key, url]) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch " + key + ": " + res.status);
    return [key, await res.json()];
  }));
  const data = Object.fromEntries(results);

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

  // ── Helpers ──
  const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
  const shortId = (fullId) => (fullId || "").split("/").pop() || fullId;

  // ── Characters ──
  const characters = (charsJson["gg:Character"] || []).map((c) => {
    const id = shortId(c["@id"]);
    const charReqs = (reqsJson["gg:Requirement"] || []).filter((r) =>
      (r["gg:requirementForCharacter"] || []).some((ref) => shortId(ref["@id"]) === id)
    );
    const charActions = (actionsJson["gg:SpecialAction"] || []).filter((a) =>
      (a["gg:specialActionForCharacter"] || []).some((ref) => shortId(ref["@id"]) === id)
    );
    const charCostume = (costumesJson["gg:NarrativeWardrobe"] || []).find((w) =>
      shortId(w["gg:wardrobeForCharacter"]?.["@id"]) === id
    );
    const charStyling = (stylingJson["gg:NarrativeStyling"] || []).find((s) =>
      shortId(s["gg:stylingForCharacter"]?.["@id"]) === id
    );
    const sceneIds = (c["gg:characterInScene"] || []).map((ref) => shortId(ref["@id"]));
    const level = c["gg:characterLevel"] || "dayPlayer";
    const desc = c["gg:characterDescription"] || c["schema:description"] || "";
    const notes = [desc];
    charReqs.forEach((r) => {
      const t = r["gg:requirementType"] || "";
      const d = r["schema:description"] || r["schema:name"] || "";
      if (d) notes.push(t + ": " + d);
    });
    charActions.forEach((a) => {
      const d = a["schema:description"] || a["schema:name"] || "";
      if (d) notes.push("Safety: " + d);
    });
    if (charCostume) notes.push("Wardrobe: " + (charCostume["schema:description"] || ""));
    if (charStyling) notes.push("Styling: " + (charStyling["schema:description"] || ""));
    return {
      id, name: c["schema:name"] || id, description: desc,
      characterLevel: level === "gg:lead" ? "lead" : level === "gg:supporting" ? "supporting" : "dayPlayer",
      sceneIds, castingNotes: notes.join(" | "),
      firstAppearance: sceneIds[0] || null,
      actors: { longList: [], shortLists: [], audition: [], approval: [] },
    };
  });

  // ── Locations ──
  const locations = (locsJson["gg:NarrativeLocation"] || []).map((loc) => {
    const id = shortId(loc["@id"]);
    const sceneRefs = (loc["gg:locationInScene"] || []).map((r) => shortId(r["@id"]));
    const efx = (effectsJson["gg:Effect"] || []).filter((e) =>
      (e["gg:effectInScene"] || []).some((r) => sceneRefs.includes(shortId(r["@id"])))
    );
    return {
      id, name: loc["schema:name"] || id,
      description: loc["schema:description"] || "",
      intExt: loc["gg:locationType"] || "INT",
      address: "",
      sceneTags: sceneRefs,
      notes: efx.map((e) => e["schema:name"] || "").filter(Boolean).join("; "),
    };
  });

  // ── Props ──
  const props = (propsJson["gg:NarrativeObject"] || []).map((p) => {
    const id = shortId(p["@id"]);
    return {
      id, name: p["schema:name"] || id,
      description: p["schema:description"] || "",
      quantity: 1, condition: "new",
      sceneIds: (p["gg:objectInScene"] || []).map((r) => shortId(r["@id"])),
    };
  });

  // ── Costumes ──
  const costumeInventory = (costumesJson["gg:NarrativeWardrobe"] || []).map((w) => {
    const id = shortId(w["@id"]);
    return {
      id, name: w["schema:name"] || id,
      description: w["schema:description"] || "",
      characterId: shortId(w["gg:wardrobeForCharacter"]?.["@id"]) || null,
      sceneIds: (w["gg:wardrobeInScene"] || []).map((r) => shortId(r["@id"])),
      condition: "new", quantity: 1,
    };
  });
  const actorHMU = (stylingJson["gg:NarrativeStyling"] || []).map((s) => {
    const id = shortId(s["@id"]);
    return {
      id, name: s["schema:name"] || id,
      description: s["schema:description"] || "",
      characterId: shortId(s["gg:stylingForCharacter"]?.["@id"]) || null,
      sceneIds: (s["gg:stylingInScene"] || []).map((r) => shortId(r["@id"])),
    };
  });

  // ── Scenes + Script Blocks ──
  const scenesArr = scenesJson["gg:NarrativeScene"] || [];
  const scriptBlocks = [];
  let blkIdx = 0;
  const mkBlk = (type, text, extras) => {
    blkIdx++;
    return Object.assign({ id: "jb2-blk-" + blkIdx, type, text }, extras || {});
  };

  scenesArr.forEach((sc) => {
    const scId = shortId(sc["@id"]);
    const scNum = sc["gg:sceneNumber"] || "";
    const heading = sc["gg:sceneHeading"] || ("SCENE " + scNum);
    const synopsis = sc["schema:description"] || sc["schema:name"] || "";
    scriptBlocks.push(mkBlk("scene-heading", heading, { synopsis, sceneId: scId }));
    const raw = sc["gg:scriptText"] || "";
    if (!raw) return;
    const lines = raw.split("\\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }
      const charMatch = line.match(/^([A-Z][A-Z .'\-]+?)\s*(\(.*\))?$/);
      const isAllCaps = line === line.toUpperCase() && line.length > 1 && !line.startsWith("(");
      if (charMatch && isAllCaps && !line.startsWith("EXT.") && !line.startsWith("INT.") && !line.startsWith("CUT ") && !line.startsWith("FADE ") && !line.startsWith("SMASH ")) {
        const charName = charMatch[1].trim();
        const parenthetical = charMatch[2] || null;
        const charObj = characters.find((ch) => ch.name.toUpperCase() === charName || ch.id === charName.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, ""));
        scriptBlocks.push(mkBlk("character", charName, charObj ? { linkedCharacterId: charObj.id } : undefined));
        if (parenthetical) scriptBlocks.push(mkBlk("parenthetical", parenthetical));
        i++;
        const dLines = [];
        while (i < lines.length) {
          const dl = lines[i].trim();
          if (!dl) { i++; break; }
          if (dl.startsWith("(") && dl.endsWith(")")) { scriptBlocks.push(mkBlk("parenthetical", dl)); i++; continue; }
          const nextCharMatch = dl.match(/^([A-Z][A-Z .'\-]+?)\s*(\(.*\))?$/);
          if (nextCharMatch && dl === dl.toUpperCase() && dl.length > 1 && !dl.startsWith("(")) break;
          dLines.push(dl);
          i++;
        }
        if (dLines.length) scriptBlocks.push(mkBlk("dialogue", dLines.join(" ")));
      } else if (line.startsWith("CUT TO") || line.startsWith("FADE TO") || line.startsWith("SMASH CUT") || line.startsWith("FADE OUT") || line.startsWith("FADE IN")) {
        scriptBlocks.push(mkBlk("transition", line));
        i++;
      } else {
        scriptBlocks.push(mkBlk("action", line));
        i++;
      }
    }
  });

  // ── Beats ──
  const sceneHeadings = scriptBlocks.filter((b) => b.type === "scene-heading");
  const totalHeadings = sceneHeadings.length;
  const act1End = Math.floor(totalHeadings * 0.25);
  const act2End = Math.floor(totalHeadings * 0.75);
  const colors = ["rose", "blue", "amber", "green", "purple", "pink", "sky", "stone", "lime", "orange", "cyan", "red", "indigo", "teal", "yellow", "emerald", "fuchsia"];
  const beatIndices = [];
  const beatStep = Math.max(1, Math.floor(totalHeadings / 17));
  for (let i = 0; i < totalHeadings && beatIndices.length < 17; i += beatStep) beatIndices.push(i);
  const beats = beatIndices.map((idx, i) => {
    const h = sceneHeadings[idx];
    const act = idx < act1End ? "Act 1" : idx < act2End ? "Act 2" : "Act 3";
    return {
      id: "jb2-beat-" + (i + 1), title: (h.synopsis || h.text || "").substring(0, 60),
      description: h.synopsis || h.text || "", color: colors[i % colors.length],
      act, linkedSceneId: h.id, order: i + 1,
    };
  });

  // ── Schedule ──
  const scenesByDay = {};
  scenesArr.forEach((sc) => {
    const day = sc["gg:shootDay"] || sc["gg:scheduledDay"] || null;
    if (!day) return;
    const key = String(day);
    if (!scenesByDay[key]) scenesByDay[key] = [];
    scenesByDay[key].push(sc);
  });
  const dayKeys = Object.keys(scenesByDay).sort((a, b) => Number(a) - Number(b));
  const baseDate = new Date("1992-08-24");
  const scheduleEntries = dayKeys.map((dayKey, idx) => {
    const dayScenes = scenesByDay[dayKey];
    const sceneNums = dayScenes.map((s) => s["gg:sceneNumber"] || "").join(", ");
    const locs = [...new Set(dayScenes.map((s) => {
      const locRefs = s["gg:sceneInLocation"] || [];
      return locRefs.map((r) => {
        const locObj = locations.find((l) => l.id === shortId(r["@id"]));
        return locObj ? locObj.name : shortId(r["@id"]);
      }).join(", ");
    }))].join(" / ");
    const charIds = [...new Set(dayScenes.flatMap((s) =>
      (s["gg:sceneHasCharacter"] || []).map((r) => shortId(r["@id"]))
    ))];
    const d = new Date(baseDate);
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().slice(0, 10);
    const now = Date.now();
    return {
      id: "jb2-sched-" + dayKey, title: "Day " + dayKey + " - Scenes " + sceneNums,
      date: dateStr, phaseId: "jb2-principal", startTime: "06:00", endTime: "20:00",
      location: locs, sceneType: "INT/EXT",
      sceneNotes: "Scenes: " + sceneNums, props: [], actorIds: charIds,
      crewMembers: [], redFlags: [],
      notes: "Shoot day " + dayKey + ". Scenes: " + sceneNums,
      createdAt: now, updatedAt: now,
    };
  });

  // ── Stripboard Scenes ──
  const stripboardScenes = scenesArr.map((sc, idx) => {
    const scId = shortId(sc["@id"]);
    const locRefs = sc["gg:sceneInLocation"] || [];
    const locName = locRefs.length ? (() => {
      const locObj = locations.find((l) => l.id === shortId(locRefs[0]["@id"]));
      return locObj ? locObj.name : shortId(locRefs[0]["@id"]);
    })() : "";
    const charNames = (sc["gg:sceneHasCharacter"] || []).map((r) => {
      const ch = characters.find((c) => c.id === shortId(r["@id"]));
      return ch ? ch.name : shortId(r["@id"]);
    });
    const day = sc["gg:shootDay"] || sc["gg:scheduledDay"] || null;
    const now = Date.now();
    return {
      id: scId, sceneNumber: sc["gg:sceneNumber"] || String(idx + 1),
      pages: sc["gg:pageLength"] || "1", intExt: sc["gg:intExt"] || "INT",
      location: locName, dayNight: sc["gg:dayNight"] || "Day",
      cast: charNames, description: sc["schema:description"] || sc["schema:name"] || "",
      shootDayId: day ? "jb2-sched-" + day : undefined, order: idx + 1,
      createdAt: now, updatedAt: now,
    };
  });

  // ── Project ──
  const pj = projectJson["gg:Project"] || projectJson;
  const pjSingle = Array.isArray(pj) ? pj[0] : pj;
  const projectName = pjSingle?.["schema:name"] || "Jurassic Park - AI Script Breakdown";
  const projectDesc = pjSingle?.["schema:description"] || "";

  // ── Now write individual files ──
  const files = {};

  files["lib/jurassic/jb2Characters.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "export const jb2Characters = " + JSON.stringify(characters, null, 2) + ";\n";

  files["lib/jurassic/jb2Locations.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "export const jb2Locations = " + JSON.stringify(locations, null, 2) + ";\n";

  files["lib/jurassic/jb2Props.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "export const jb2Props = " + JSON.stringify(props, null, 2) + ";\n";

  files["lib/jurassic/jb2Costumes.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "export const jb2Costumes = {\n  inventory: " + JSON.stringify(costumeInventory, null, 2) + ",\n  actorHMU: " + JSON.stringify(actorHMU, null, 2) + ",\n};\n";

  files["lib/jurassic/jb2ScriptBlocks.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "import type { ScriptBlock } from \"@/types/casting\";\n\n" +
    "export const jb2ScriptBlocks: ScriptBlock[] = " + JSON.stringify(scriptBlocks, null, 2) + ";\n";

  files["lib/jurassic/jb2Beats.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "import type { BeatItem } from \"@/types/casting\";\n\n" +
    "export const jb2Beats: BeatItem[] = " + JSON.stringify(beats, null, 2) + ";\n";

  files["lib/jurassic/jb2Schedule.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "import type { ScheduleEntry, ProductionPhase } from \"@/types/schedule\";\n\n" +
    "export const jb2ProductionPhases: ProductionPhase[] = " + JSON.stringify([
      { id: "jb2-principal", name: "Principal Photography", startDate: "1992-08-24", color: "text-blue-700", bgColor: "bg-blue-500" },
      { id: "jb2-second-unit", name: "Second Unit / VFX", startDate: "1992-10-05", color: "text-lime-700", bgColor: "bg-lime-500" },
    ], null, 2) + ";\n\n" +
    "export const jb2ScheduleEntries: ScheduleEntry[] = " + JSON.stringify(scheduleEntries, null, 2) + ";\n";

  files["lib/jurassic/jb2Scenes.ts"] =
    "// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND\n" +
    "import type { Scene } from \"@/types/schedule\";\n\n" +
    "export const jb2StripboardScenes: Scene[] = " + JSON.stringify(stripboardScenes, null, 2) + ";\n";

  // The thin combiner
  const combiner = [
    '// AUTO-GENERATED by scripts/build-jurassic-data.js -- DO NOT EDIT BY HAND',
    'import type { CastingState, ScriptData } from "@/types/casting";',
    'import { jb2Characters } from "./jurassic/jb2Characters";',
    'import { jb2Locations } from "./jurassic/jb2Locations";',
    'import { jb2Props } from "./jurassic/jb2Props";',
    'import { jb2Costumes } from "./jurassic/jb2Costumes";',
    'import { jb2ScriptBlocks } from "./jurassic/jb2ScriptBlocks";',
    'import { jb2Beats } from "./jurassic/jb2Beats";',
    'import { jb2ScheduleEntries, jb2ProductionPhases } from "./jurassic/jb2Schedule";',
    'import { jb2StripboardScenes } from "./jurassic/jb2Scenes";',
    '',
    'const JP_SCRIPT_DATA: ScriptData = {',
    '  blocks: jb2ScriptBlocks,',
    '  locked: false,',
    '  lockedSceneSuffixes: {},',
    '  currentRevision: "white",',
    '  lastModified: Date.now(),',
    '  beats: jb2Beats,',
    '};',
    '',
    'export const jurassicAIData: Partial<CastingState> = {',
    '  projects: [',
    '    {',
    '      id: "jb2-project",',
    '      name: ' + JSON.stringify(projectName) + ',',
    '      description: ' + JSON.stringify(projectDesc) + ',',
    '      status: "active",',
    '      characters: jb2Characters as any,',
    '      props: jb2Props as any,',
    '      locations: jb2Locations as any,',
    '      costumes: jb2Costumes as any,',
    '      script: JP_SCRIPT_DATA as any,',
    '    } as any,',
    '  ],',
    '  currentProjectId: "jb2-project",',
    '  users: [',
    '    { id: "user-cd", name: "Casting Director", role: "casting_director", avatar: "" },',
    '    { id: "user-dir", name: "Director", role: "director", avatar: "" },',
    '    { id: "user-prod", name: "Producer", role: "producer", avatar: "" },',
    '  ],',
    '  currentUser: { id: "user-cd", name: "Casting Director", role: "casting_director", avatar: "" },',
    '  currentFocus: null,',
    '  scheduleEntries: jb2ScheduleEntries as any,',
    '  productionPhases: jb2ProductionPhases as any,',
    '  scenes: jb2StripboardScenes as any,',
    '  activeTab: "characters",',
    '  tabNotifications: {},',
    '};',
    '',
  ].join("\n");

  files["lib/jurassicAIData.ts"] = combiner;

  // Write all files
  for (const [path, content] of Object.entries(files)) {
    const fullPath = "/vercel/share/v0-project/" + path;
    const dir = dirname(fullPath);
    mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    console.log("Wrote: " + fullPath + " (" + content.length + " chars)");
  }

  console.log("Done! " + Object.keys(files).length + " files written.");
}

main().catch((err) => { console.error(err); process.exit(1); });
