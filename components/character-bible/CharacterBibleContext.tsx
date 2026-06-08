"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Character, CharacterBible, CharacterBibleView } from "@/types/character-bible"

interface CharacterBibleContextType {
  bibles: CharacterBible[]
  currentBible: CharacterBible | null
  view: CharacterBibleView
  setView: (view: CharacterBibleView) => void
  setCurrentBible: (bible: CharacterBible | null) => void
  addBible: (bible: CharacterBible) => void
  updateBible: (id: string, updates: Partial<CharacterBible>) => void
  deleteBible: (id: string) => void
  addCharacter: (bibleId: string, character: Character) => void
  updateCharacter: (bibleId: string, characterId: string, updates: Partial<Character>) => void
  deleteCharacter: (bibleId: string, characterId: string) => void
}

const CharacterBibleContext = createContext<CharacterBibleContextType | undefined>(undefined)

// Demo data
const demoBibles: CharacterBible[] = [
  {
    id: "1",
    name: "Bluff Final",
    characters: [
      { id: "char-1", name: "Marcus Webb", age: "Late 30s", gender: "Male", ethnicity: "Caucasian", scenes: 24, castingNotes: "A disgraced former prosecutor haunted by a case he lost. Sharp-witted but carries deep guilt. Needs an actor who can convey moral complexity and quiet intensity." },
      { id: "char-2", name: "Elena Vasquez", age: "Early 30s", gender: "Female", ethnicity: "Hispanic", scenes: 18, castingNotes: "A determined investigative journalist who uncovers the central conspiracy. Fearless but vulnerable. Should convey intelligence and tenacity." },
      { id: "char-3", name: "Theodore 'Theo' Blackwood", age: "60s", gender: "Male", ethnicity: "African American", scenes: 12, castingNotes: "Retired judge with secrets. Distinguished and authoritative, but hiding a troubled past. Requires gravitas and subtle menace." },
      { id: "char-4", name: "Samantha Chen", age: "Mid 20s", gender: "Female", ethnicity: "Asian", scenes: 15, castingNotes: "Tech prodigy and hacker who aids the protagonist. Quirky, anxious, brilliant. Should balance humor with genuine fear." },
      { id: "char-5", name: "Detective Frank Morrison", age: "50s", gender: "Male", ethnicity: "Caucasian", scenes: 20, castingNotes: "World-weary homicide detective. Cynical exterior masks a strong moral compass. Needs someone who can play exhaustion and dedication." },
      { id: "char-6", name: "Victoria Sterling", age: "Mid 40s", gender: "Female", ethnicity: "Caucasian", scenes: 14, castingNotes: "Powerful CEO with political ambitions. Elegant and calculating. Must convey charm that masks ruthlessness." },
      { id: "char-7", name: "Carlos Mendez", age: "Late 20s", gender: "Male", ethnicity: "Hispanic", scenes: 11, castingNotes: "Undercover officer in deep with the cartel. Conflicted loyalty. Needs to show constant internal struggle." },
      { id: "char-8", name: "Dr. Amira Hassan", age: "Early 40s", gender: "Female", ethnicity: "Middle Eastern", scenes: 9, castingNotes: "Medical examiner who discovers key evidence. Methodical and composed. Should project clinical detachment with underlying empathy." },
      { id: "char-9", name: "Bobby 'Bulldog' Thompson", age: "Late 40s", gender: "Male", ethnicity: "Caucasian", scenes: 8, castingNotes: "Small-time criminal turned informant. Rough around edges but surprisingly loyal. Physical presence with comedic timing." },
      { id: "char-10", name: "Grace Webb", age: "Late 30s", gender: "Female", ethnicity: "African American", scenes: 7, castingNotes: "Marcus's estranged wife. Strong and independent but still loves him. Must convey hurt and hope simultaneously." },
      { id: "char-11", name: "Senator Richard Hayes", age: "Early 60s", gender: "Male", ethnicity: "Caucasian", scenes: 6, castingNotes: "Corrupt politician at the center of the conspiracy. Charismatic public persona, cold in private. Silver-tongued manipulator." },
      { id: "char-12", name: "Lily Chen", age: "Teen", gender: "Female", ethnicity: "Asian", scenes: 5, castingNotes: "Samantha's younger sister, kidnapped to ensure silence. Brave despite fear. Needs young actress who can convey resilience." },
    ],
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-04-28"),
  },
  {
    id: "2",
    name: "QuantumVeilScript",
    characters: [
      { id: "qv-1", name: "Dr. Nadia Okonkwo", age: "Mid 30s", gender: "Female", ethnicity: "Nigerian", scenes: 28, castingNotes: "Brilliant quantum physicist who accidentally opens a portal to parallel dimensions. Driven by curiosity but learns humility. Lead role requiring range." },
      { id: "qv-2", name: "James Hartley", age: "Late 30s", gender: "Male", ethnicity: "British", scenes: 22, castingNotes: "Government agent assigned to contain the breach. By-the-book initially but questions authority. Dry humor masking genuine concern." },
      { id: "qv-3", name: "Echo", age: "Appears 20s", gender: "Non-binary", ethnicity: "Ambiguous", scenes: 18, castingNotes: "Entity from another dimension. Otherworldly and unsettling but gradually becomes sympathetic. Requires unique physicality." },
      { id: "qv-4", name: "Professor Viktor Reinholt", age: "70s", gender: "Male", ethnicity: "German", scenes: 10, castingNotes: "Nadia's mentor who warned against the experiment. Frail but mentally sharp. Carries weight of similar past mistakes." },
      { id: "qv-5", name: "Agent Sarah Kim", age: "Late 20s", gender: "Female", ethnicity: "Korean American", scenes: 14, castingNotes: "James's partner, more aggressive in approach. Career-focused but develops conscience. Physical role with emotional arc." },
      { id: "qv-6", name: "Michael Okonkwo", age: "Early 40s", gender: "Male", ethnicity: "Nigerian", scenes: 8, castingNotes: "Nadia's older brother, a priest. Provides spiritual perspective to scientific chaos. Calm presence, questioning faith." },
      { id: "qv-7", name: "General Patricia Stone", age: "Late 50s", gender: "Female", ethnicity: "Caucasian", scenes: 9, castingNotes: "Military commander wanting to weaponize the breach. Intimidating and pragmatic. Sees everything as tactical advantage." },
      { id: "qv-8", name: "Dr. Chen Wei", age: "Early 30s", gender: "Male", ethnicity: "Chinese", scenes: 11, castingNotes: "Nadia's lab assistant who becomes exposed to dimensional energy. Transforms throughout film. Physical acting required." },
      { id: "qv-9", name: "Parallel Nadia", age: "Mid 30s", gender: "Female", ethnicity: "Nigerian", scenes: 7, castingNotes: "Alternate version of protagonist from darker timeline. Same actress, different characterization. Calculating and desperate." },
      { id: "qv-10", name: "Director Adams", age: "50s", gender: "Male", ethnicity: "African American", scenes: 6, castingNotes: "Head of secret research division. Bureaucrat caught between science and politics. Ultimately makes moral choice." },
      { id: "qv-11", name: "Young Nadia", age: "12-14", gender: "Female", ethnicity: "Nigerian", scenes: 4, castingNotes: "Flashback sequences showing Nadia's childhood fascination with physics. Wide-eyed wonder, precocious intelligence." },
      { id: "qv-12", name: "The Void Speaker", age: "Ageless", gender: "Ambiguous", ethnicity: "Not applicable", scenes: 5, castingNotes: "Ancient entity that exists between dimensions. Voice role primarily. Deep, resonant, unsettling. Conveys cosmic indifference." },
    ],
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-04-28"),
  },
  {
    id: "3",
    name: "Harbor Lights Drama",
    characters: [
      { id: "hl-1", name: "Captain Thomas 'Tom' Reilly", age: "Late 50s", gender: "Male", ethnicity: "Irish American", scenes: 32, castingNotes: "Veteran harbor pilot facing mandatory retirement. Stubborn, proud, struggling to adapt. The heart of the story." },
      { id: "hl-2", name: "Maya Reilly-Washington", age: "Early 30s", gender: "Female", ethnicity: "Mixed (Irish/African American)", scenes: 26, castingNotes: "Tom's daughter, environmental lawyer fighting port expansion. Torn between family loyalty and principles." },
      { id: "hl-3", name: "Deshawn Washington", age: "Mid 30s", gender: "Male", ethnicity: "African American", scenes: 18, castingNotes: "Maya's husband, port authority administrator. Stuck between wife and employer. Pragmatic peacemaker." },
      { id: "hl-4", name: "Rose Reilly", age: "Late 50s", gender: "Female", ethnicity: "Caucasian", scenes: 15, castingNotes: "Tom's wife of 35 years. Patient but has her limits. Quietly strong, holds family together." },
      { id: "hl-5", name: "Eddie Chen", age: "Early 40s", gender: "Male", ethnicity: "Chinese American", scenes: 14, castingNotes: "Third-generation fisherman whose livelihood is threatened. Tom's closest friend. Comic relief with depth." },
      { id: "hl-6", name: "Victoria Harrington", age: "Mid 40s", gender: "Female", ethnicity: "Caucasian", scenes: 12, castingNotes: "CEO of development company. Not a villain but represents progress's costs. Should be sympathetic despite role." },
      { id: "hl-7", name: "Young Tom", age: "Late 20s", gender: "Male", ethnicity: "Irish American", scenes: 8, castingNotes: "Flashback sequences. Idealistic, newly married, full of dreams. Contrast to present-day weariness." },
      { id: "hl-8", name: "Officer Patricia Molina", age: "Late 30s", gender: "Female", ethnicity: "Hispanic", scenes: 9, castingNotes: "Coast Guard officer, Tom's former student. Represents new generation. Respects Tom but must enforce rules." },
      { id: "hl-9", name: "Jimmy Reilly", age: "Early 20s", gender: "Male", ethnicity: "Irish American", scenes: 11, castingNotes: "Tom's grandson considering leaving for college. Symbol of choices between tradition and future." },
      { id: "hl-10", name: "Angela Chen", age: "Early 40s", gender: "Female", ethnicity: "Chinese American", scenes: 7, castingNotes: "Eddie's wife, owns waterfront restaurant. Practical, supportive, provides community perspective." },
      { id: "hl-11", name: "Mayor Robert Kozinski", age: "Early 60s", gender: "Male", ethnicity: "Polish American", scenes: 6, castingNotes: "Old-school politician trying to balance interests. Owes Tom favors but faces pressure. Conflicted loyalties." },
      { id: "hl-12", name: "Young Rose", age: "Mid 20s", gender: "Female", ethnicity: "Caucasian", scenes: 5, castingNotes: "Flashback sequences. Fiery, artistic, chose Tom over her family's objections. Passion that matured into steadiness." },
      { id: "hl-13", name: "Father O'Brien", age: "70s", gender: "Male", ethnicity: "Irish", scenes: 4, castingNotes: "Parish priest who's known Tom since childhood. Provides spiritual counsel and community history." },
    ],
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
  },
  {
    id: "4",
    name: "Neon Requiem",
    characters: [
      { id: "nr-1", name: "Zara 'Zero' Blackwood", age: "Late 20s", gender: "Female", ethnicity: "Mixed (Black/Asian)", scenes: 35, castingNotes: "Elite hacker turned reluctant revolutionary in dystopian megacity. Cynical survivor with buried idealism. Action lead requiring physicality and emotional range." },
      { id: "nr-2", name: "Marcus Cole", age: "Early 30s", gender: "Male", ethnicity: "African American", scenes: 24, castingNotes: "Underground resistance leader. Charismatic but haunted by past failures. Romantic interest but not defined by it." },
      { id: "nr-3", name: "ARIA", age: "N/A (AI)", gender: "Female presenting", ethnicity: "N/A", scenes: 20, castingNotes: "Artificial intelligence that develops consciousness. Voice starts mechanical, becomes emotional. Journey from tool to person." },
      { id: "nr-4", name: "Director Vanessa Cross", age: "Late 40s", gender: "Female", ethnicity: "Caucasian", scenes: 16, castingNotes: "Head of corporate security. Elegant villain with twisted logic. Believes she's saving humanity. Complex antagonist." },
      { id: "nr-5", name: "Takeshi 'Tak' Yamamoto", age: "Mid 20s", gender: "Male", ethnicity: "Japanese", scenes: 14, castingNotes: "Young tech genius in Zero's crew. Optimistic despite everything. Provides hope and occasionally comic relief." },
      { id: "nr-6", name: "Dr. Helena Marsh", age: "Early 60s", gender: "Female", ethnicity: "Caucasian", scenes: 11, castingNotes: "Creator of ARIA who regrets her invention. Dying from corporate-induced illness. Seeking redemption." },
      { id: "nr-7", name: "Brick", age: "Late 30s", gender: "Male", ethnicity: "Pacific Islander", scenes: 12, castingNotes: "Zero's enforcer and oldest friend. Imposing but gentle. Fiercely protective. Few words but every one matters." },
      { id: "nr-8", name: "Councilor Zhang", age: "Mid 50s", gender: "Male", ethnicity: "Chinese", scenes: 8, castingNotes: "Corporate council member secretly funding resistance. Playing dangerous double game. Calculating but principled." },
      { id: "nr-9", name: "Pixel", age: "Early 20s", gender: "Non-binary", ethnicity: "Hispanic", scenes: 10, castingNotes: "Street artist and resistance propagandist. Uses holographic art as weapons. Exuberant despite dark world." },
      { id: "nr-10", name: "Young Zero", age: "12-14", gender: "Female", ethnicity: "Mixed (Black/Asian)", scenes: 5, castingNotes: "Flashbacks showing Zero's recruitment and training. Vulnerable but already showing spark of defiance." },
      { id: "nr-11", name: "Governor Chen", age: "Early 50s", gender: "Female", ethnicity: "Chinese American", scenes: 7, castingNotes: "Puppet leader of the megacity. Knows she's powerless but tries to help where she can. Tragic figure." },
      { id: "nr-12", name: "Wraith", age: "Indeterminate", gender: "Male", ethnicity: "Unknown (always masked)", scenes: 9, castingNotes: "Corporate assassin pursuing Zero. Silent and relentless. Eventually revealed as sympathetic figure. Physical role." },
      { id: "nr-13", name: "Mama Osei", age: "Late 60s", gender: "Female", ethnicity: "Ghanaian", scenes: 6, castingNotes: "Runs underground safe house and clinic. Moral center of resistance. Grandmother figure to lost generation." },
      { id: "nr-14", name: "Felix", age: "Late 20s", gender: "Male", ethnicity: "Brazilian", scenes: 8, castingNotes: "Smuggler who helps resistance for profit. Comic relief with hidden depths. Eventual sacrifice." },
    ],
    createdAt: new Date("2026-05-10"),
    updatedAt: new Date("2026-05-10"),
  },
  {
    id: "5",
    name: "The Whitmore Estate",
    characters: [
      { id: "we-1", name: "Eleanor Whitmore", age: "80s", gender: "Female", ethnicity: "Caucasian", scenes: 28, castingNotes: "Family matriarch dying and gathering relatives for inheritance announcement. Sharp mind in failing body. Knows all secrets." },
      { id: "we-2", name: "Catherine Whitmore-Hayes", age: "Late 50s", gender: "Female", ethnicity: "Caucasian", scenes: 22, castingNotes: "Eleanor's eldest daughter. Bitter about sacrificing career for family duty. Expects to inherit everything." },
      { id: "we-3", name: "James Whitmore", age: "Mid 50s", gender: "Male", ethnicity: "Caucasian", scenes: 20, castingNotes: "Eleanor's only son. Charming failure who's squandered family money. Desperate and dangerous when cornered." },
      { id: "we-4", name: "Dr. Priya Sharma", age: "Early 40s", gender: "Female", ethnicity: "Indian", scenes: 18, castingNotes: "Eleanor's personal physician and confidante. Knows medical secrets. Possibly more than professional relationship." },
      { id: "we-5", name: "Marcus Hayes", age: "Late 50s", gender: "Male", ethnicity: "Caucasian", scenes: 14, castingNotes: "Catherine's husband. Self-made man looked down upon by Whitmores. Has his own agenda." },
      { id: "we-6", name: "Lily Whitmore", age: "Early 30s", gender: "Female", ethnicity: "Caucasian", scenes: 16, castingNotes: "James's daughter, black sheep who left family. Returns reluctantly. Only honest one. Protagonist perspective." },
      { id: "we-7", name: "Theodore Whitmore III", age: "Mid 30s", gender: "Male", ethnicity: "Caucasian", scenes: 12, castingNotes: "Catherine's son. Entitled, weak, controlled by mother. Begins to question loyalties." },
      { id: "we-8", name: "Sofia Ramirez", age: "Late 40s", gender: "Female", ethnicity: "Hispanic", scenes: 11, castingNotes: "Long-serving housekeeper who sees everything. Loyal to Eleanor but has her own grievances." },
      { id: "we-9", name: "Attorney William Chen", age: "Early 60s", gender: "Male", ethnicity: "Chinese American", scenes: 10, castingNotes: "Family lawyer with troubling knowledge. Caught between legal duty and moral concerns." },
      { id: "we-10", name: "Young Eleanor", age: "20s", gender: "Female", ethnicity: "Caucasian", scenes: 6, castingNotes: "Flashback sequences. Vibrant, ambitious, making choices that haunt her. Contrast to dying matriarch." },
      { id: "we-11", name: "Detective Okafor", age: "Mid 40s", gender: "Female", ethnicity: "Nigerian American", scenes: 8, castingNotes: "Investigates suspicious death at estate. Outsider perspective on wealthy dysfunction. Sharp and unimpressed." },
      { id: "we-12", name: "Robert Whitmore (Ghost)", age: "70s", gender: "Male", ethnicity: "Caucasian", scenes: 4, castingNotes: "Eleanor's late husband appears in memories. Complicated figure. Source of family secrets." },
      { id: "we-13", name: "Emma Hayes", age: "Mid 20s", gender: "Female", ethnicity: "Caucasian", scenes: 9, castingNotes: "Theodore's younger sister. Seemingly shallow but perceptive. Playing her own game." },
      { id: "we-14", name: "Miguel", age: "Late 30s", gender: "Male", ethnicity: "Mexican", scenes: 5, castingNotes: "Groundskeeper with long history at estate. Knows where bodies are buried, perhaps literally." },
      { id: "we-15", name: "Reverend Thomas", age: "Late 60s", gender: "Male", ethnicity: "African American", scenes: 4, castingNotes: "Family's spiritual advisor. Brought in for final rites. Becomes unlikely confessor." },
    ],
    createdAt: new Date("2026-05-15"),
    updatedAt: new Date("2026-05-15"),
  },
]

export function CharacterBibleProvider({ children }: { children: ReactNode }) {
  const [bibles, setBibles] = useState<CharacterBible[]>(demoBibles)
  const [currentBible, setCurrentBible] = useState<CharacterBible | null>(null)
  const [view, setView] = useState<CharacterBibleView>("list")

  const addBible = (bible: CharacterBible) => {
    setBibles((prev) => [...prev, bible])
  }

  const updateBible = (id: string, updates: Partial<CharacterBible>) => {
    setBibles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b))
    )
    if (currentBible?.id === id) {
      setCurrentBible({ ...currentBible, ...updates, updatedAt: new Date() })
    }
  }

  const deleteBible = (id: string) => {
    setBibles((prev) => prev.filter((b) => b.id !== id))
    if (currentBible?.id === id) {
      setCurrentBible(null)
      setView("list")
    }
  }

  const addCharacter = (bibleId: string, character: Character) => {
    setBibles((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? { ...b, characters: [...b.characters, character], updatedAt: new Date() }
          : b
      )
    )
    if (currentBible?.id === bibleId) {
      setCurrentBible({
        ...currentBible,
        characters: [...currentBible.characters, character],
        updatedAt: new Date(),
      })
    }
  }

  const updateCharacter = (bibleId: string, characterId: string, updates: Partial<Character>) => {
    setBibles((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? {
              ...b,
              characters: b.characters.map((c) =>
                c.id === characterId ? { ...c, ...updates } : c
              ),
              updatedAt: new Date(),
            }
          : b
      )
    )
    if (currentBible?.id === bibleId) {
      setCurrentBible({
        ...currentBible,
        characters: currentBible.characters.map((c) =>
          c.id === characterId ? { ...c, ...updates } : c
        ),
        updatedAt: new Date(),
      })
    }
  }

  const deleteCharacter = (bibleId: string, characterId: string) => {
    setBibles((prev) =>
      prev.map((b) =>
        b.id === bibleId
          ? {
              ...b,
              characters: b.characters.filter((c) => c.id !== characterId),
              updatedAt: new Date(),
            }
          : b
      )
    )
    if (currentBible?.id === bibleId) {
      setCurrentBible({
        ...currentBible,
        characters: currentBible.characters.filter((c) => c.id !== characterId),
        updatedAt: new Date(),
      })
    }
  }

  return (
    <CharacterBibleContext.Provider
      value={{
        bibles,
        currentBible,
        view,
        setView,
        setCurrentBible,
        addBible,
        updateBible,
        deleteBible,
        addCharacter,
        updateCharacter,
        deleteCharacter,
      }}
    >
      {children}
    </CharacterBibleContext.Provider>
  )
}

export function useCharacterBible() {
  const context = useContext(CharacterBibleContext)
  if (!context) {
    throw new Error("useCharacterBible must be used within a CharacterBibleProvider")
  }
  return context
}
