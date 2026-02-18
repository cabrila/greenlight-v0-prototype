/**
 * Mock data for the Script and Schedule features.
 *
 * This file provides two top-level exports:
 *   - `MOCK_SCRIPT_DATA`  — a full ScriptData object (10 scenes, ~80 blocks)
 *   - `MOCK_SCHEDULE_DATA` — schedule entries, scenes, and production phases
 *
 * The script follows a fictional short film titled "Last Light" — a
 * noir thriller set across multiple interior and exterior locations.
 * Character names, scene headings, and locations are consistent between
 * both the script and the schedule so cross-referencing works end-to-end.
 *
 * All IDs use a deterministic `mock-` prefix so they can be identified
 * and cleaned up easily.
 */

import type { ScriptBlock, ScriptData, BeatItem } from "@/types/casting"
import type { ScheduleEntry, Scene, ProductionPhase } from "@/types/schedule"

/* ================================================================== */
/*  Shared Constants                                                   */
/* ================================================================== */

/** Deterministic ID helper */
const id = (prefix: string, n: number | string) => `mock-${prefix}-${n}`

/** Character names used across both data sets */
export const CHARACTERS = {
  MILLER:  { id: id("char", 1), name: "DETECTIVE MILLER" },
  VASQUEZ: { id: id("char", 2), name: "VASQUEZ" },
  HARPER:  { id: id("char", 3), name: "HARPER" },
  NOLAN:   { id: id("char", 4), name: "NOLAN" },
  CHEN:    { id: id("char", 5), name: "DR. CHEN" },
  RUSSO:   { id: id("char", 6), name: "RUSSO" },
} as const

/** Locations referenced in both script and schedule */
export const LOCATIONS = {
  PRECINCT:      "POLICE PRECINCT - BULLPEN",
  INTERROGATION: "POLICE PRECINCT - INTERROGATION ROOM",
  ALLEY:         "BACK ALLEY - CHINATOWN",
  APARTMENT:     "HARPER'S APARTMENT - LIVING ROOM",
  ROOFTOP:       "ROOFTOP - DOWNTOWN",
  DINER:         "24-HOUR DINER",
  HOSPITAL:      "ST. MERCY HOSPITAL - CORRIDOR",
  WAREHOUSE:     "ABANDONED WAREHOUSE",
  CAR:           "UNMARKED POLICE CAR",
  PIER:          "PIER 47 - DOCK",
} as const

/* ================================================================== */
/*  Script Mock Data                                                   */
/* ================================================================== */

const b = (
  type: ScriptBlock["type"],
  text: string,
  idx: number,
  extras?: Partial<ScriptBlock>,
): ScriptBlock => ({
  id: id("blk", idx),
  type,
  text,
  ...extras,
})

let i = 0

const SCRIPT_BLOCKS: ScriptBlock[] = [
  /* ---- Scene 1 ---- */
  b("scene-heading", "INT. POLICE PRECINCT - BULLPEN - NIGHT",                 ++i, { synopsis: "Miller catches the case" }),
  b("action",        "Fluorescent lights hum over rows of battered desks. A phone rings unanswered. DETECTIVE MILLER, 40s, weathered and wired, stares at a crime-scene photo pinned to his board.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("parenthetical", "(into phone)",                                            ++i),
  b("dialogue",      "Yeah, I'll take it. Send me the address.",                ++i),
  b("action",        "He grabs his coat. VASQUEZ, 30s, sharp-eyed and relentless, blocks his path.", ++i),
  b("character",     CHARACTERS.VASQUEZ.name,                                   ++i, { linkedCharacterId: CHARACTERS.VASQUEZ.id }),
  b("dialogue",      "You're not going alone this time.",                       ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "Suit yourself. Just keep up.",                            ++i),

  /* ---- Scene 2 ---- */
  b("scene-heading", "EXT. BACK ALLEY - CHINATOWN - NIGHT",                    ++i, { synopsis: "The crime scene" }),
  b("action",        "Red and blue lights paint wet brick walls. A body lies beneath a fire escape. CSI techs work under pop-up lights.", ++i),
  b("character",     CHARACTERS.VASQUEZ.name,                                   ++i, { linkedCharacterId: CHARACTERS.VASQUEZ.id }),
  b("dialogue",      "No wallet. No phone. Somebody wanted this to be a John Doe.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("parenthetical", "(kneeling by the body)",                                  ++i),
  b("dialogue",      "Look at his hands. Those aren't street hands.",           ++i),
  b("action",        "Miller spots a matchbook from the LAST LIGHT LOUNGE half-wedged under the dumpster.", ++i),

  /* ---- Scene 3 ---- */
  b("scene-heading", "INT. HARPER'S APARTMENT - LIVING ROOM - DAY",            ++i, { synopsis: "Miller questions Harper" }),
  b("action",        "Sparse, tidy. HARPER, early 50s, paces near the window. A half-packed suitcase sits on the couch.", ++i),
  b("character",     CHARACTERS.HARPER.name,                                    ++i, { linkedCharacterId: CHARACTERS.HARPER.id }),
  b("dialogue",      "I already told the other officers. I haven't seen David in weeks.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "Then why is your number the last one he called?",         ++i),
  b("action",        "Harper's jaw tightens. She glances at the suitcase.",      ++i),
  b("character",     CHARACTERS.HARPER.name,                                    ++i, { linkedCharacterId: CHARACTERS.HARPER.id }),
  b("parenthetical", "(measured)",                                              ++i),
  b("dialogue",      "People call people. It doesn't mean what you think it means.", ++i),

  /* ---- Scene 4 ---- */
  b("scene-heading", "INT. POLICE PRECINCT - INTERROGATION ROOM - DAY",        ++i, { synopsis: "Nolan is brought in" }),
  b("action",        "A steel table. One-way glass. NOLAN, 30s, slicked-back hair, sits with the ease of someone who's been here before.", ++i),
  b("character",     CHARACTERS.NOLAN.name,                                     ++i, { linkedCharacterId: CHARACTERS.NOLAN.id }),
  b("dialogue",      "I want my lawyer.",                                       ++i),
  b("character",     CHARACTERS.VASQUEZ.name,                                   ++i, { linkedCharacterId: CHARACTERS.VASQUEZ.id }),
  b("dialogue",      "Funny. Innocent people don't usually lead with that.",    ++i),
  b("character",     CHARACTERS.NOLAN.name,                                     ++i, { linkedCharacterId: CHARACTERS.NOLAN.id }),
  b("parenthetical", "(leaning back)",                                          ++i),
  b("dialogue",      "Smart ones do.",                                          ++i),

  /* ---- Scene 5 ---- */
  b("scene-heading", "INT. ST. MERCY HOSPITAL - CORRIDOR - NIGHT",             ++i, { synopsis: "Dr. Chen's warning" }),
  b("action",        "Quiet. A nurse pushes a cart past. DR. CHEN, 60s, composed but clearly nervous, meets Miller by the vending machines.", ++i),
  b("character",     CHARACTERS.CHEN.name,                                      ++i, { linkedCharacterId: CHARACTERS.CHEN.id }),
  b("parenthetical", "(low)",                                                   ++i),
  b("dialogue",      "If I tell you what I know, I need protection. Real protection.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "What kind of trouble are we talking about?",              ++i),
  b("character",     CHARACTERS.CHEN.name,                                      ++i, { linkedCharacterId: CHARACTERS.CHEN.id }),
  b("dialogue",      "The kind that ends up in alleys with no ID.",             ++i),

  /* ---- Scene 6 ---- */
  b("scene-heading", "INT. 24-HOUR DINER - NIGHT",                             ++i, { synopsis: "Miller and Vasquez regroup" }),
  b("action",        "A booth in the back. Two coffees. A spread of case files between them.", ++i),
  b("character",     CHARACTERS.VASQUEZ.name,                                   ++i, { linkedCharacterId: CHARACTERS.VASQUEZ.id }),
  b("dialogue",      "Nolan's alibi checks out. But Harper's doesn't. Not even close.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "She's hiding something. Question is, for who.",           ++i),
  b("action",        "Miller's phone buzzes. He reads the screen, stands abruptly.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "Chen's at St. Mercy. Says he'll talk, but only to me.",   ++i),
  b("transition",    "CUT TO:",                                                 ++i),

  /* ---- Scene 7 ---- */
  b("scene-heading", "INT. UNMARKED POLICE CAR - NIGHT (MOVING)",              ++i, { synopsis: "Russo follows Miller" }),
  b("action",        "Miller drives through rain-soaked streets. In the rear-view mirror: headlights that have been behind him for six blocks.", ++i),
  b("action",        "He takes a sharp right. The car follows. He reaches for his radio.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("parenthetical", "(into radio)",                                            ++i),
  b("dialogue",      "Dispatch, this is Miller. I've got a tail heading south on Grand. Need a unit to box him in at Fifth.", ++i),
  b("action",        "The trailing car pulls alongside. Through tinted glass: RUSSO, 40s, ex-military build, stone-faced.", ++i),

  /* ---- Scene 8 ---- */
  b("scene-heading", "EXT. ABANDONED WAREHOUSE - NIGHT",                       ++i, { synopsis: "Confrontation with Russo" }),
  b("action",        "Both cars skid to a halt in a gravel lot. Miller steps out, hand on holster. Russo approaches, palms up.", ++i),
  b("character",     CHARACTERS.RUSSO.name,                                     ++i, { linkedCharacterId: CHARACTERS.RUSSO.id }),
  b("dialogue",      "Easy, Detective. I'm not here to fight.",                 ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "Then what are you here for?",                             ++i),
  b("character",     CHARACTERS.RUSSO.name,                                     ++i, { linkedCharacterId: CHARACTERS.RUSSO.id }),
  b("parenthetical", "(handing him a flash drive)",                             ++i),
  b("dialogue",      "Insurance. The kind Nolan doesn't want you to see.",      ++i),

  /* ---- Scene 9 ---- */
  b("scene-heading", "EXT. ROOFTOP - DOWNTOWN - DAWN",                         ++i, { synopsis: "Miller confronts Harper" }),
  b("action",        "The city sprawls below. Wind whips across the rooftop. Harper stands at the ledge, not in danger, but defiant.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "It was you. You set the whole thing up.",                 ++i),
  b("character",     CHARACTERS.HARPER.name,                                    ++i, { linkedCharacterId: CHARACTERS.HARPER.id }),
  b("dialogue",      "David was going to destroy everything. I did what I had to do.", ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("parenthetical", "(quiet)",                                                 ++i),
  b("dialogue",      "That's not your call to make.",                           ++i),
  b("action",        "Harper turns to face him. Sirens rise in the distance.",   ++i),
  b("character",     CHARACTERS.HARPER.name,                                    ++i, { linkedCharacterId: CHARACTERS.HARPER.id }),
  b("parenthetical", "(with finality)",                                         ++i),
  b("dialogue",      "Isn't it?",                                              ++i),

  /* ---- Scene 10 ---- */
  b("scene-heading", "EXT. PIER 47 - DOCK - SUNRISE",                          ++i, { synopsis: "Epilogue" }),
  b("action",        "Golden light spills across the water. Miller sits on a piling, staring at the flash drive in his hand.", ++i),
  b("character",     CHARACTERS.VASQUEZ.name,                                   ++i, { linkedCharacterId: CHARACTERS.VASQUEZ.id }),
  b("parenthetical", "(walking up)",                                            ++i),
  b("dialogue",      "Harper's in custody. DA wants to talk.",                  ++i),
  b("character",     CHARACTERS.MILLER.name,                                    ++i, { linkedCharacterId: CHARACTERS.MILLER.id }),
  b("dialogue",      "Let them wait.",                                          ++i),
  b("action",        "He pockets the flash drive. Stares out at the horizon. The city hums behind him.",   ++i),
  b("transition",    "FADE OUT.",                                               ++i),
]

/** Beat-board items for three-act structure */
const MOCK_BEATS: BeatItem[] = [
  { id: id("beat", 1), title: "The Call",          description: "Miller gets the case; Vasquez insists on tagging along.",   color: "blue",   act: "Act 1", linkedSceneId: id("blk", 1) },
  { id: id("beat", 2), title: "John Doe",          description: "No ID on the body. A matchbook is the only lead.",          color: "green",  act: "Act 1", linkedSceneId: id("blk", 11) },
  { id: id("beat", 3), title: "Harper Interview",  description: "Harper is evasive; her alibi doesn't add up.",              color: "amber",  act: "Act 1", linkedSceneId: id("blk", 19) },
  { id: id("beat", 4), title: "Nolan Interrogated", description: "Nolan lawyers up fast. Vasquez presses.",                  color: "purple", act: "Act 2", linkedSceneId: id("blk", 28) },
  { id: id("beat", 5), title: "Chen's Warning",    description: "Dr. Chen fears for his life; offers info in exchange for protection.", color: "rose", act: "Act 2", linkedSceneId: id("blk", 36) },
  { id: id("beat", 6), title: "Diner Debrief",     description: "Vasquez and Miller compare notes. The trail leads to Harper.", color: "sky",   act: "Act 2", linkedSceneId: id("blk", 44) },
  { id: id("beat", 7), title: "The Tail",          description: "Russo follows Miller. Is he friend or foe?",               color: "stone",  act: "Act 2", linkedSceneId: id("blk", 53) },
  { id: id("beat", 8), title: "Flash Drive",       description: "Russo reveals evidence against Nolan.",                     color: "pink",   act: "Act 3", linkedSceneId: id("blk", 60) },
  { id: id("beat", 9), title: "Rooftop Truth",     description: "Harper confesses. Sirens close in.",                        color: "amber",  act: "Act 3", linkedSceneId: id("blk", 68) },
  { id: id("beat", 10), title: "Last Light",       description: "Miller sits with the evidence. Justice is messy.",          color: "blue",   act: "Act 3", linkedSceneId: id("blk", 80) },
]

export const MOCK_SCRIPT_DATA: ScriptData = {
  blocks: SCRIPT_BLOCKS,
  locked: false,
  lockedSceneSuffixes: {},
  currentRevision: "white",
  lastModified: Date.now(),
  beats: MOCK_BEATS,
}


/* ================================================================== */
/*  Schedule Mock Data                                                 */
/* ================================================================== */

export const MOCK_PRODUCTION_PHASES: ProductionPhase[] = [
  { id: "principal",   name: "Principal Photography", startDate: "2024-03-01", color: "text-blue-700",   bgColor: "bg-blue-500" },
  { id: "pickups",     name: "Pickups",               startDate: "2024-03-12", color: "text-orange-700", bgColor: "bg-orange-500" },
  { id: "second-unit", name: "Second Unit",           startDate: "2024-03-20", color: "text-lime-700",   bgColor: "bg-lime-500" },
  { id: "rehearsals",  name: "Rehearsals",            startDate: "2024-03-02", color: "text-purple-700", bgColor: "bg-purple-500" },
]

const now = Date.now()

export const MOCK_SCHEDULE_ENTRIES: ScheduleEntry[] = [
  /* --- Day 1 --- */
  {
    id: id("sched", 1),
    title: "Day 1 — Precinct Interior",
    date: "2024-03-04",
    phaseId: "principal",
    startTime: "07:00",
    endTime: "19:00",
    location: "Stage 4 — Precinct Set",
    sceneType: "INT",
    sceneNotes: "Dress the bullpen and interrogation room. Police extras x10.",
    props: ["Crime-scene photos", "Case board", "Matchbook", "Nolan's watch"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.VASQUEZ.id, CHARACTERS.NOLAN.id],
    crewMembers: ["Gaffer — Dan K.", "1st AD — Priya S.", "Script Sup — Lena M.", "Key Grip — Hector R."],
    redFlags: [],
    notes: "Scenes 1 and 4. Start with interrogation (Nolan) while bullpen is dressed.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Day 2 --- */
  {
    id: id("sched", 2),
    title: "Day 2 — Chinatown Night Ext",
    date: "2024-03-05",
    phaseId: "principal",
    startTime: "18:00",
    endTime: "05:00",
    location: "Chinatown backlot / practical alley",
    sceneType: "EXT",
    sceneNotes: "Night shoot. Wet-down the alley. CSI tent, pop-up lights.",
    props: ["Body prosthetic", "CSI kit", "Matchbook (hero)", "Police tape"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.VASQUEZ.id],
    crewMembers: ["Gaffer — Dan K.", "1st AD — Priya S.", "SFX — Tommy L.", "Stunt Coord — Ava B."],
    redFlags: [{ id: id("rf", 1), type: "warning", message: "Night shoot — overtime likely past 3 AM", color: "bg-amber-500" }],
    notes: "Scene 2. Need rain towers + wet-down crew from 17:00.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Day 3 --- */
  {
    id: id("sched", 3),
    title: "Day 3 — Harper's Apartment / Hospital",
    date: "2024-03-06",
    phaseId: "principal",
    startTime: "08:00",
    endTime: "20:00",
    location: "Practical apartment — Echo Park / St. Mercy (permit)",
    sceneType: "INT",
    sceneNotes: "AM: Harper apt. PM: Hospital corridor. Company move at lunch.",
    props: ["Half-packed suitcase", "Harper's phone", "Vending machine (practical)"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.HARPER.id, CHARACTERS.CHEN.id],
    crewMembers: ["Gaffer — Dan K.", "1st AD — Priya S.", "Locations — Jay P.", "Transpo — Reggie F."],
    redFlags: [{ id: id("rf", 2), type: "important", message: "Company move — allow 90 min for relocation", color: "bg-red-500" }],
    notes: "Scenes 3 and 5. Hospital permit window closes at 19:30.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Day 4 --- */
  {
    id: id("sched", 4),
    title: "Day 4 — Diner / Car Interior",
    date: "2024-03-07",
    phaseId: "principal",
    startTime: "16:00",
    endTime: "04:00",
    location: "Mel's Diner (practical) / Process trailer",
    sceneType: "INT",
    sceneNotes: "Late call — night-diner atmo. Car interiors on process trailer.",
    props: ["Case files", "Coffee cups (hero)", "Miller's phone", "Police radio"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.VASQUEZ.id],
    crewMembers: ["Gaffer — Dan K.", "1st AD — Priya S.", "Transpo — Reggie F.", "Process Driver — Cal W."],
    redFlags: [],
    notes: "Scenes 6 and 7. Diner first, then car work from 22:00.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Day 5 --- */
  {
    id: id("sched", 5),
    title: "Day 5 — Warehouse Night",
    date: "2024-03-08",
    phaseId: "principal",
    startTime: "18:00",
    endTime: "04:00",
    location: "Vernon industrial warehouse (permit)",
    sceneType: "EXT",
    sceneNotes: "Gravel lot exteriors + partial interior. Cars rigged for skid.",
    props: ["Flash drive (hero)", "Miller's holster/weapon", "Russo's car"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.RUSSO.id],
    crewMembers: ["Gaffer — Dan K.", "Stunt Coord — Ava B.", "1st AD — Priya S.", "Armorer — Frank T."],
    redFlags: [{ id: id("rf", 3), type: "conflict", message: "Russo actor has a hard out at 02:00", color: "bg-red-600", actorId: CHARACTERS.RUSSO.id }],
    notes: "Scene 8. Shoot Russo coverage first due to hard out.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Day 6 --- */
  {
    id: id("sched", 6),
    title: "Day 6 — Rooftop Dawn",
    date: "2024-03-10",
    phaseId: "principal",
    startTime: "04:30",
    endTime: "12:00",
    location: "Downtown rooftop (permit) — Spring St.",
    sceneType: "EXT",
    sceneNotes: "Magic hour at 05:40. Must capture sunrise for scene climax.",
    props: ["(No special props)"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.HARPER.id],
    crewMembers: ["Gaffer — Dan K.", "1st AD — Priya S.", "Safety Sup — Marco V.", "DIT — Nyla J."],
    redFlags: [{ id: id("rf", 4), type: "warning", message: "Sunrise at 05:48 — one take window for golden light", color: "bg-amber-500" }],
    notes: "Scene 9. Pre-light overnight. Talent in the works by 05:00.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Day 7 --- */
  {
    id: id("sched", 7),
    title: "Day 7 — Pier Sunrise / Wrap",
    date: "2024-03-11",
    phaseId: "principal",
    startTime: "04:00",
    endTime: "10:00",
    location: "Pier 47 — San Pedro",
    sceneType: "EXT",
    sceneNotes: "Final scene. Golden hour. Minimal crew. Handheld.",
    props: ["Flash drive (hero)", "Miller's jacket (continuity)"],
    actorIds: [CHARACTERS.MILLER.id, CHARACTERS.VASQUEZ.id],
    crewMembers: ["1st AD — Priya S.", "DIT — Nyla J.", "Gaffer — Dan K."],
    redFlags: [],
    notes: "Scene 10 — epilogue. That's a wrap on principal.",
    createdAt: now,
    updatedAt: now,
  },
  /* --- Pickup Day --- */
  {
    id: id("sched", 8),
    title: "Pickup — Diner Inserts",
    date: "2024-03-13",
    phaseId: "pickups",
    startTime: "10:00",
    endTime: "14:00",
    location: "Mel's Diner (practical)",
    sceneType: "INT",
    sceneNotes: "Insert shots: case file close-ups, coffee pour, Miller's phone.",
    props: ["Case files", "Coffee cups (hero)", "Miller's phone"],
    actorIds: [],
    crewMembers: ["1st AD — Priya S.", "Gaffer — Dan K."],
    redFlags: [],
    notes: "No talent needed — hands double available.",
    createdAt: now,
    updatedAt: now,
  },
]

/** Stripboard scenes — one per script scene, tied to shoot days */
export const MOCK_SCENES: Scene[] = [
  { id: id("scene", 1),  sceneNumber: "1",  pages: "1 2/8", intExt: "INT",     location: LOCATIONS.PRECINCT,      dayNight: "Night", cast: [CHARACTERS.MILLER.name, CHARACTERS.VASQUEZ.name],                    description: "Miller catches the case",        shootDayId: id("sched", 1), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 2),  sceneNumber: "2",  pages: "1 4/8", intExt: "EXT",     location: LOCATIONS.ALLEY,         dayNight: "Night", cast: [CHARACTERS.MILLER.name, CHARACTERS.VASQUEZ.name],                    description: "The crime scene",                shootDayId: id("sched", 2), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 3),  sceneNumber: "3",  pages: "1 2/8", intExt: "INT",     location: LOCATIONS.APARTMENT,     dayNight: "Day",   cast: [CHARACTERS.MILLER.name, CHARACTERS.HARPER.name],                     description: "Miller questions Harper",        shootDayId: id("sched", 3), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 4),  sceneNumber: "4",  pages: "7/8",   intExt: "INT",     location: LOCATIONS.INTERROGATION, dayNight: "Day",   cast: [CHARACTERS.VASQUEZ.name, CHARACTERS.NOLAN.name],                     description: "Nolan is brought in",            shootDayId: id("sched", 1), order: 2, createdAt: now, updatedAt: now },
  { id: id("scene", 5),  sceneNumber: "5",  pages: "6/8",   intExt: "INT",     location: LOCATIONS.HOSPITAL,      dayNight: "Night", cast: [CHARACTERS.MILLER.name, CHARACTERS.CHEN.name],                       description: "Dr. Chen's warning",             shootDayId: id("sched", 3), order: 2, createdAt: now, updatedAt: now },
  { id: id("scene", 6),  sceneNumber: "6",  pages: "1 1/8", intExt: "INT",     location: LOCATIONS.DINER,         dayNight: "Night", cast: [CHARACTERS.MILLER.name, CHARACTERS.VASQUEZ.name],                    description: "Miller and Vasquez regroup",     shootDayId: id("sched", 4), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 7),  sceneNumber: "7",  pages: "5/8",   intExt: "INT",     location: LOCATIONS.CAR,           dayNight: "Night", cast: [CHARACTERS.MILLER.name],                                             description: "Russo follows Miller",           shootDayId: id("sched", 4), order: 2, createdAt: now, updatedAt: now },
  { id: id("scene", 8),  sceneNumber: "8",  pages: "1",     intExt: "EXT",     location: LOCATIONS.WAREHOUSE,     dayNight: "Night", cast: [CHARACTERS.MILLER.name, CHARACTERS.RUSSO.name],                      description: "Confrontation with Russo",       shootDayId: id("sched", 5), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 9),  sceneNumber: "9",  pages: "1 4/8", intExt: "EXT",     location: LOCATIONS.ROOFTOP,       dayNight: "Day",   cast: [CHARACTERS.MILLER.name, CHARACTERS.HARPER.name],                     description: "Miller confronts Harper",        shootDayId: id("sched", 6), order: 1, createdAt: now, updatedAt: now },
  { id: id("scene", 10), sceneNumber: "10", pages: "6/8",   intExt: "EXT",     location: LOCATIONS.PIER,          dayNight: "Day",   cast: [CHARACTERS.MILLER.name, CHARACTERS.VASQUEZ.name],                    description: "Epilogue",                       shootDayId: id("sched", 7), order: 1, createdAt: now, updatedAt: now },
]

/* ================================================================== */
/*  Convenience bundle                                                 */
/* ================================================================== */

export const MOCK_SCHEDULE_DATA = {
  entries: MOCK_SCHEDULE_ENTRIES,
  scenes: MOCK_SCENES,
  phases: MOCK_PRODUCTION_PHASES,
} as const
