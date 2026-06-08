"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Location, LocationProject } from "@/types/location-scouting"

type ViewState = "projects" | "upload" | "results"

interface LocationScoutingContextType {
  projects: LocationProject[]
  currentProject: LocationProject | null
  view: ViewState
  setView: (view: ViewState) => void
  setCurrentProject: (project: LocationProject | null) => void
  addProject: (project: LocationProject) => void
  updateProject: (project: LocationProject) => void
  deleteProject: (projectId: string) => void
  addLocation: (projectId: string, location: Location) => void
  updateLocation: (projectId: string, location: Location) => void
  deleteLocation: (projectId: string, locationId: string) => void
}

const LocationScoutingContext = createContext<LocationScoutingContextType | null>(null)

// Demo data
const demoProjects: LocationProject[] = [
  {
    id: "1",
    name: "JURASSIC PARK Script",
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
    locations: [
      { id: "1", name: "JUNGLE - HOLDING PEN", type: "EXT", timeOfDay: "NIGHT", description: "A dense, dark jungle clearing on Isla Nublar featuring a massive, San Quentin-style holding pen with a guard tower and electrified fences. A large crate is shoved into a slot in the pen using a bulldozer while riflemen and workers stand by.", scoutingNotes: "Requires a large clearing suitable for heavy machinery and a high-security industrial fence set. Must accommodate a large crate and searchlights." },
      { id: "2", name: "MOUNTAIN - AMBER MINE", type: "EXT", timeOfDay: "DAY", description: "A rocky, manual mining operation on a hillside in the Dominican Republic. Workers use picks and shovels to scrape the rock, and visitors arrive via a raft pulled across a river.", scoutingNotes: "Requires a steep, rocky landscape and a nearby water source for the raft scene. Look for active or historical manual excavation sites." },
      { id: "3", name: "AMBER MINE - CAVE", type: "EXT", timeOfDay: "DAY", description: "A dark, dripping cave within the amber mine where sunlight streams through the mouth. The interior is cramped and filled with workers examining finds.", scoutingNotes: "A natural cave or limestone mine with a wide enough opening for sunlight to provide strong backlighting for translucent objects." },
      { id: "4", name: "THE DIG - MONTANA BADLANDS", type: "EXT", timeOfDay: "DAY", description: "A vast, arid expanse of crumbling limestone with checkered excavation pits. The site includes a base camp with teepees, a mess tent, and various dig equipment.", scoutingNotes: "Requires a remote, desert-like terrain with existing or buildable excavation areas. Access for crew and equipment trucks essential." },
      { id: "5", name: "DIG OFFICE - TRAILER", type: "INT", timeOfDay: "DAY", description: "A dusty mobile home converted into a laboratory and office. Every surface is covered with bone specimens, ceramic dishes, and labeling tags.", scoutingNotes: "A practical trailer or mobile unit that can be dressed as a working paleontology lab with adequate power for computers and lighting." },
      { id: "6", name: "SAN JOSE - CAFE", type: "EXT", timeOfDay: "DAY", description: "A public outdoor cafe in Costa Rica where patrons sit at small tables. The atmosphere is tropical and casual.", scoutingNotes: "An outdoor cafe with tropical vegetation, preferably with ocean or jungle views. Need space for extras and equipment." },
      { id: "7", name: "HELICOPTER PAD", type: "EXT", timeOfDay: "DAY", description: "A remote helipad on the edge of a cliff overlooking the ocean. Used for arrivals to the island.", scoutingNotes: "Requires elevated location with ocean views. Must be accessible by vehicle for equipment transport." },
      { id: "8", name: "VISITOR CENTER - LOBBY", type: "INT", timeOfDay: "DAY", description: "A grand, museum-like entrance hall with dinosaur skeletons and educational displays. High ceilings with natural light.", scoutingNotes: "Large interior space with high ceilings. Could use existing museum or build set. Needs room for animatronics." },
      { id: "9", name: "CONTROL ROOM", type: "INT", timeOfDay: "NIGHT", description: "High-tech command center with multiple monitors, server banks, and workstations. The nerve center of park operations.", scoutingNotes: "Modern data center or build custom set. Needs practical lighting from monitors. Climate controlled for equipment." },
      { id: "10", name: "T-REX PADDOCK", type: "EXT", timeOfDay: "NIGHT", description: "A massive enclosure surrounded by electric fences. A goat on a chain serves as bait. Rain pours down during the main sequence.", scoutingNotes: "Large outdoor area that can be fenced. Must accommodate rain effects and large vehicle access. Night filming required." },
      { id: "11", name: "RAPTOR KITCHEN", type: "INT", timeOfDay: "DAY", description: "Industrial kitchen with stainless steel surfaces. Used for a tense hide-and-seek sequence with velociraptors.", scoutingNotes: "Commercial kitchen location or build. Needs multiple entry points and hiding spots. Reflective surfaces for tension." },
      { id: "12", name: "MAINTENANCE SHED", type: "INT", timeOfDay: "DAY", description: "A cluttered storage building with electrical equipment and tools. Used during power restoration sequence.", scoutingNotes: "Industrial maintenance building with electrical infrastructure. Must be modifiable for practical effects." },
    ],
  },
  {
    id: "2",
    name: "Urban Noir Thriller",
    createdAt: new Date("2026-05-02"),
    updatedAt: new Date("2026-05-02"),
    locations: [
      { id: "un-1", name: "DOWNTOWN PRECINCT", type: "INT", timeOfDay: "NIGHT", description: "A worn, underfunded police station with fluorescent lighting, cluttered desks, and overflowing case files. The night shift skeleton crew works under harsh lights.", scoutingNotes: "Authentic police station or government building. Needs practical overhead fluorescents. Gritty, lived-in atmosphere." },
      { id: "un-2", name: "SUSPECT APARTMENT", type: "INT", timeOfDay: "DAY", description: "A cramped studio apartment in a rundown building. Peeling wallpaper, secondhand furniture, and evidence of paranoid behavior - newspaper clippings covering windows.", scoutingNotes: "Low-income apartment building. Needs natural light through covered windows. Must allow set dressing modifications." },
      { id: "un-3", name: "BACK ALLEY - CRIME SCENE", type: "EXT", timeOfDay: "NIGHT", description: "A narrow alley between brick buildings, strewn with garbage. Police tape cordons off a dumpster area. Steam rises from grates.", scoutingNotes: "Urban alley with good containment for night shoots. Needs access to steam/smoke effects. Security for overnight filming." },
      { id: "un-4", name: "UNDERGROUND PARKING", type: "INT", timeOfDay: "NIGHT", description: "A multi-level concrete parking structure. Echoing footsteps, flickering lights, and long shadows create menace.", scoutingNotes: "Multi-story parking garage with vehicle access. Must control ambient lighting. Echo-friendly for sound design." },
      { id: "un-5", name: "MEDICAL EXAMINER OFFICE", type: "INT", timeOfDay: "DAY", description: "A sterile autopsy room with stainless steel tables, specimen jars, and harsh overhead lighting. Clinical and cold.", scoutingNotes: "Hospital morgue or medical facility. Needs practical lighting and running water. Ventilation for extended shoots." },
      { id: "un-6", name: "ROOFTOP - CHASE SEQUENCE", type: "EXT", timeOfDay: "NIGHT", description: "A flat commercial rooftop with HVAC units, access doors, and views of the city skyline. Used for a climactic confrontation.", scoutingNotes: "Accessible rooftop with city views. Safety rigging required. Must accommodate stunt work and camera platforms." },
      { id: "un-7", name: "DIVE BAR", type: "INT", timeOfDay: "NIGHT", description: "A dimly lit neighborhood bar with a long wooden counter, neon beer signs, and vinyl booths. Regular haunt of the detective.", scoutingNotes: "Authentic dive bar willing to close for filming. Neon signs must be practical. Needs space for dolly work." },
      { id: "un-8", name: "VICTIM'S HOUSE - SUBURBAN", type: "INT/EXT", timeOfDay: "DAY", description: "A middle-class suburban home with a manicured lawn and family photos inside. The contrast between normalcy and violence.", scoutingNotes: "Suburban residential location. Needs both interior and exterior access. Family-friendly appearance." },
      { id: "un-9", name: "INTERROGATION ROOM", type: "INT", timeOfDay: "VARIOUS", description: "A bare room with a metal table, two chairs, and a one-way mirror. Stark lighting emphasizes tension.", scoutingNotes: "Small room that can be soundproofed. Practical one-way mirror or build set. Controlled lighting environment." },
      { id: "un-10", name: "WAREHOUSE DISTRICT", type: "EXT", timeOfDay: "NIGHT", description: "A desolate industrial area with abandoned warehouses, chain-link fences, and loading docks. Used for illicit meetings.", scoutingNotes: "Industrial zone with minimal foot traffic at night. Multiple warehouse access points. Vehicle staging area." },
      { id: "un-11", name: "HOSPITAL CORRIDOR", type: "INT", timeOfDay: "NIGHT", description: "A quiet hospital hallway after visiting hours. A detective waits outside a victim's room under harsh fluorescent lights.", scoutingNotes: "Hospital willing to allow filming after hours. Authentic medical equipment. Quiet for dialogue scenes." },
      { id: "un-12", name: "BRIDGE - CONFRONTATION", type: "EXT", timeOfDay: "DAWN", description: "A pedestrian bridge over a river at sunrise. Used for final confrontation between detective and suspect.", scoutingNotes: "Scenic bridge with dawn lighting access. Traffic control for early morning. Safety measures for water proximity." },
    ],
  },
  {
    id: "3",
    name: "Period Drama - 1920s",
    createdAt: new Date("2026-05-08"),
    updatedAt: new Date("2026-05-08"),
    locations: [
      { id: "pd-1", name: "GRAND BALLROOM", type: "INT", timeOfDay: "NIGHT", description: "An opulent ballroom with crystal chandeliers, gilded moldings, and a parquet dance floor. The Jazz Age in full swing with dancing couples.", scoutingNotes: "Historic ballroom or hotel with period architecture. Must allow significant extras. Crystal chandeliers essential." },
      { id: "pd-2", name: "SPEAKEASY - BASEMENT", type: "INT", timeOfDay: "NIGHT", description: "A hidden underground bar accessed through a false wall. Brick walls, low ceilings, jazz band in corner, smoke-filled atmosphere.", scoutingNotes: "Basement location with period potential. Needs ventilation for smoke effects. Must accommodate live music." },
      { id: "pd-3", name: "NEWSPAPER OFFICE", type: "INT", timeOfDay: "DAY", description: "A bustling newsroom with rows of desks, typewriters clacking, and editors shouting. Papers and photographs everywhere.", scoutingNotes: "Large open office space. Will need extensive dressing with period typewriters. Noise-friendly location." },
      { id: "pd-4", name: "HARLEM JAZZ CLUB", type: "INT", timeOfDay: "NIGHT", description: "An intimate club where the cultural renaissance unfolds. Small stage, round tables, diverse crowd enjoying revolutionary music.", scoutingNotes: "Small venue with stage. Must capture period Harlem atmosphere. Needs space for band and dancers." },
      { id: "pd-5", name: "MANSION - DRAWING ROOM", type: "INT", timeOfDay: "DAY", description: "A wealthy family's formal sitting room with velvet furniture, oil paintings, and a marble fireplace. Old money elegance.", scoutingNotes: "Historic mansion with authentic period features. Fireplace must be practical. Natural light through tall windows." },
      { id: "pd-6", name: "TRAIN STATION - PLATFORM", type: "EXT", timeOfDay: "DAY", description: "A grand train station with arched ceilings and iron framework. Steam locomotives and porters in period uniforms.", scoutingNotes: "Heritage railway station. Access to period trains essential. Platform wide enough for crowd scenes." },
      { id: "pd-7", name: "TENEMENT - IMMIGRANT QUARTER", type: "INT", timeOfDay: "DAY", description: "A cramped apartment housing an immigrant family. Modest furnishings, laundry hanging, multiple generations in small space.", scoutingNotes: "Historic tenement building. Multiple rooms for different setups. Must convey crowded conditions authentically." },
      { id: "pd-8", name: "BOARDWALK - ATLANTIC CITY", type: "EXT", timeOfDay: "DAY", description: "The famous wooden boardwalk with rolling chairs, cotton candy vendors, and beachgoers in period swimwear.", scoutingNotes: "Beach boardwalk that can be dressed period. Needs crowd control for extras. Weather contingency plans." },
      { id: "pd-9", name: "COURTROOM", type: "INT", timeOfDay: "DAY", description: "A wood-paneled courtroom with judge's bench, jury box, and spectator gallery. High drama of a corruption trial.", scoutingNotes: "Historic courthouse with period details. Must accommodate jury of 12 plus gallery. Good acoustics essential." },
      { id: "pd-10", name: "BOOTLEGGER WAREHOUSE", type: "INT", timeOfDay: "NIGHT", description: "A warehouse stacked with crates of illegal liquor. Armed guards, dim lighting, and the constant threat of raids.", scoutingNotes: "Large warehouse space. Must accommodate vehicle entry. Can control lighting completely." },
      { id: "pd-11", name: "HOSPITAL WARD - CHARITY", type: "INT", timeOfDay: "DAY", description: "A crowded hospital ward with rows of iron beds. Overworked nurses tend to influenza patients.", scoutingNotes: "Period hospital or similar building. Needs rows of period beds. Natural light from tall windows." },
      { id: "pd-12", name: "POLICE CHIEF OFFICE", type: "INT", timeOfDay: "DAY", description: "A corrupt official's ornate office with mahogany desk, trophy mounts, and hidden safe. Power and secrecy.", scoutingNotes: "Executive office with period potential. Wood paneling preferred. Must accommodate hidden compartment prop." },
      { id: "pd-13", name: "CEMETERY - BURIAL", type: "EXT", timeOfDay: "DAY", description: "A rain-soaked funeral in an old cemetery. Gothic monuments and weeping willows frame the mourners.", scoutingNotes: "Historic cemetery with Gothic elements. Rain effects capability. Respectful distance from actual graves." },
    ],
  },
  {
    id: "4",
    name: "Sci-Fi Colony Ship",
    createdAt: new Date("2026-05-12"),
    updatedAt: new Date("2026-05-12"),
    locations: [
      { id: "sf-1", name: "BRIDGE - COMMAND CENTER", type: "INT", timeOfDay: "N/A", description: "The nerve center of the colony ship with wraparound viewscreens, holographic displays, and captain's chair. Sleek and functional.", scoutingNotes: "Build custom set. Requires extensive LED screens and practical displays. Must accommodate crane shots." },
      { id: "sf-2", name: "CRYO BAY", type: "INT", timeOfDay: "N/A", description: "Rows of cryogenic pods containing sleeping colonists. Cold blue lighting, frost on surfaces, monitoring stations.", scoutingNotes: "Build set with practical pod props. Requires fog/cold effects. Must have emergency lighting capability." },
      { id: "sf-3", name: "HYDROPONIC GARDENS", type: "INT", timeOfDay: "N/A", description: "A multi-level growing facility with artificial sunlight, flowing water, and lush vegetation. The ship's food source.", scoutingNotes: "Greenhouse or botanical garden for reference. Build set with real plants. Needs water features." },
      { id: "sf-4", name: "ENGINEERING DECK", type: "INT", timeOfDay: "N/A", description: "The massive engine room with reactor core, maintenance catwalks, and working crews. Industrial and dangerous.", scoutingNotes: "Industrial facility for reference. Build set with practical steam/light effects. Multi-level catwalks needed." },
      { id: "sf-5", name: "MEDICAL BAY", type: "INT", timeOfDay: "N/A", description: "A sterile medical facility with diagnostic beds, surgical robots, and quarantine chambers. High-tech healing.", scoutingNotes: "Build clean set with practical screens. Needs surgical lighting. Quarantine section with glass walls." },
      { id: "sf-6", name: "RECREATION DECK", type: "INT", timeOfDay: "N/A", description: "A communal space with simulated windows showing space, exercise equipment, and gathering areas. Morale maintenance.", scoutingNotes: "Large open space for set build. Needs multiple zones. Large LED panels for simulated windows." },
      { id: "sf-7", name: "CAPTAIN'S QUARTERS", type: "INT", timeOfDay: "N/A", description: "Private living space with desk, personal items, and small window showing the stars. Isolation of command.", scoutingNotes: "Intimate set build. Personal touches required. Starfield effect outside window." },
      { id: "sf-8", name: "AIRLOCK - EXTERIOR", type: "INT", timeOfDay: "N/A", description: "A pressurized chamber with suits, equipment, and ominous exterior hatch. Gateway to vacuum.", scoutingNotes: "Build set with practical door mechanisms. Needs compression sound effects compatibility. Lighting changes for atmosphere." },
      { id: "sf-9", name: "CARGO HOLD", type: "INT", timeOfDay: "N/A", description: "A cavernous storage area with containers, equipment, and maintenance drones. Where secrets are hidden.", scoutingNotes: "Large warehouse space for set build. Needs extensive prop containers. Overhead lighting rigs." },
      { id: "sf-10", name: "OBSERVATION LOUNGE", type: "INT", timeOfDay: "N/A", description: "A peaceful room with floor-to-ceiling windows showing the stars. Used for contemplation and crucial conversations.", scoutingNotes: "Build set with massive LED wall. Comfortable furniture. Must create sense of vastness." },
      { id: "sf-11", name: "MAINTENANCE TUNNEL", type: "INT", timeOfDay: "N/A", description: "Narrow service corridors with exposed conduits, dim lighting, and cramped spaces. Where the ship's secrets live.", scoutingNotes: "Build narrow set sections. Claustrophobic dimensions. Practical sparking effects needed." },
      { id: "sf-12", name: "SHUTTLE BAY", type: "INT", timeOfDay: "N/A", description: "A hangar containing smaller vessels for planetary exploration. High ceilings and industrial equipment.", scoutingNotes: "Largest set build required. Needs actual vehicle props. Must accommodate flight deck action." },
      { id: "sf-13", name: "AI CORE", type: "INT", timeOfDay: "N/A", description: "The ship's artificial intelligence center with server stacks, holographic interface, and eerie ambient presence.", scoutingNotes: "Build with extensive lighting effects. Holographic projection capability. Should feel otherworldly." },
      { id: "sf-14", name: "PLANET SURFACE - FIRST LANDING", type: "EXT", timeOfDay: "DAY", description: "An alien landscape with unfamiliar vegetation, twin suns, and the colony ship visible in orbit above.", scoutingNotes: "Unique outdoor location. Heavy VFX requirements. Needs unusual terrain and vegetation." },
    ],
  },
  {
    id: "5",
    name: "Mountain Survival Film",
    createdAt: new Date("2026-05-18"),
    updatedAt: new Date("2026-05-18"),
    locations: [
      { id: "ms-1", name: "BASE CAMP", type: "EXT", timeOfDay: "DAY", description: "A staging area at 14,000 feet with expedition tents, equipment caches, and stunning mountain views. Hope before the climb.", scoutingNotes: "Actual high-altitude location required. Must be accessible by helicopter. Requires cold-weather filming protocols." },
      { id: "ms-2", name: "SUMMIT APPROACH", type: "EXT", timeOfDay: "DAY", description: "The final push to the peak through a narrow ridge with sheer drops on both sides. Technical climbing in thin air.", scoutingNotes: "Actual mountain location with safety rigging. Requires experienced climbing coordinators. Altitude acclimatization time." },
      { id: "ms-3", name: "CREVASSE - RESCUE SCENE", type: "EXT", timeOfDay: "DAY", description: "A deep glacial crevasse where a climber falls and must be rescued. Blue ice walls and desperate circumstances.", scoutingNotes: "Glacier location with actual crevasse. Requires extensive safety measures. May need ice set build backup." },
      { id: "ms-4", name: "ICE CAVE - SHELTER", type: "EXT", timeOfDay: "DAY", description: "A natural ice cave where survivors take shelter from a storm. Crystalline walls and eerie blue light.", scoutingNotes: "Actual ice cave or build set. Must maintain cold temperature for authenticity. Limited crew access." },
      { id: "ms-5", name: "MOUNTAIN VILLAGE", type: "EXT", timeOfDay: "DAY", description: "A traditional Sherpa village with stone buildings, prayer flags, and views of the peaks. Cultural introduction.", scoutingNotes: "Authentic mountain village. Requires community permission. Respectful of local customs." },
      { id: "ms-6", name: "HELICOPTER - INTERIOR", type: "INT", timeOfDay: "DAY", description: "The cramped interior of a rescue helicopter battling mountain winds. Life and death in a metal shell.", scoutingNotes: "Helicopter mock-up on gimbal. Must simulate turbulence. Needs realistic control panels." },
      { id: "ms-7", name: "HOSPITAL - KATHMANDU", type: "INT", timeOfDay: "DAY", description: "A basic mountain hospital where frostbite victims are treated. The aftermath of the mountain's toll.", scoutingNotes: "Hospital location in Nepal or similar. Period-appropriate medical equipment. Needs recovery ward setup." },
      { id: "ms-8", name: "AVALANCHE PATH", type: "EXT", timeOfDay: "DAY", description: "A steep slope where an avalanche strikes the climbing party. Sudden violence of nature.", scoutingNotes: "Location with controlled avalanche capability. Extensive safety protocols. VFX enhancement likely needed." },
      { id: "ms-9", name: "CLIMBER'S HOME - FLASHBACK", type: "INT", timeOfDay: "DAY", description: "A cozy family home with photos of past climbs. The life waiting below that motivates survival.", scoutingNotes: "Residential location with mountain-themed decor. Must contrast with harsh exterior locations." },
      { id: "ms-10", name: "NORTH FACE - TECHNICAL CLIMB", type: "EXT", timeOfDay: "DAY", description: "A sheer rock and ice face requiring advanced climbing. The most dangerous section of the ascent.", scoutingNotes: "Actual climbing location. Requires stunt coordinators. Safety equipment must be period-hidden." },
      { id: "ms-11", name: "SUMMIT", type: "EXT", timeOfDay: "DAY", description: "The peak of the mountain with 360-degree views. The goal achieved at tremendous cost.", scoutingNotes: "Actual summit or helicopter-accessible peak. Limited time at altitude. Weather-dependent scheduling." },
      { id: "ms-12", name: "MONASTERY", type: "INT", timeOfDay: "DAY", description: "An ancient Buddhist monastery where climbers seek blessing before and after the attempt. Spiritual dimension.", scoutingNotes: "Authentic monastery with permission. Respectful of religious practices. May have limited access times." },
    ],
  },
]

export function LocationScoutingProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<LocationProject[]>(demoProjects)
  const [currentProject, setCurrentProject] = useState<LocationProject | null>(null)
  const [view, setView] = useState<ViewState>("projects")

  const addProject = (project: LocationProject) => {
    setProjects((prev) => [...prev, project])
  }

  const updateProject = (project: LocationProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p))
    )
    if (currentProject?.id === project.id) {
      setCurrentProject(project)
    }
  }

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      setView("projects")
    }
  }

  const addLocation = (projectId: string, location: Location) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, locations: [...p.locations, location], updatedAt: new Date() }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: [...currentProject.locations, location],
        updatedAt: new Date(),
      })
    }
  }

  const updateLocation = (projectId: string, location: Location) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              locations: p.locations.map((l) =>
                l.id === location.id ? location : l
              ),
              updatedAt: new Date(),
            }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: currentProject.locations.map((l) =>
          l.id === location.id ? location : l
        ),
        updatedAt: new Date(),
      })
    }
  }

  const deleteLocation = (projectId: string, locationId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              locations: p.locations.filter((l) => l.id !== locationId),
              updatedAt: new Date(),
            }
          : p
      )
    )
    if (currentProject?.id === projectId) {
      setCurrentProject({
        ...currentProject,
        locations: currentProject.locations.filter((l) => l.id !== locationId),
        updatedAt: new Date(),
      })
    }
  }

  return (
    <LocationScoutingContext.Provider
      value={{
        projects,
        currentProject,
        view,
        setView,
        setCurrentProject,
        addProject,
        updateProject,
        deleteProject,
        addLocation,
        updateLocation,
        deleteLocation,
      }}
    >
      {children}
    </LocationScoutingContext.Provider>
  )
}

export function useLocationScouting() {
  const context = useContext(LocationScoutingContext)
  if (!context) {
    throw new Error("useLocationScouting must be used within a LocationScoutingProvider")
  }
  return context
}
