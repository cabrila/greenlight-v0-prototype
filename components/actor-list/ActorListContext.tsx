"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Actor, ActorListProject } from "@/types/actor-list"

interface ActorListContextType {
  projects: ActorListProject[]
  currentProject: ActorListProject | null
  view: "list" | "upload" | "results"
  setView: (view: "list" | "upload" | "results") => void
  createProject: (name: string, actors: Actor[]) => void
  selectProject: (id: string) => void
  updateProject: (id: string, updates: Partial<ActorListProject>) => void
  deleteProject: (id: string) => void
  addActor: (actor: Actor) => void
  updateActor: (actor: Actor) => void
  deleteActor: (id: string) => void
  goBack: () => void
}

const ActorListContext = createContext<ActorListContextType | null>(null)

// Demo data - Male headshot URLs
const maleHeadshots = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
]

// Demo data - Female headshot URLs
const femaleHeadshots = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
]

const initialProjects: ActorListProject[] = [
  {
    id: "1",
    name: "Allan_Grant_Longlist",
    actors: [
      { id: "1", name: "Jason Tyrone", age: 37, playingAge: "30-50", phone: "+1-555-0123", email: "jason.tyrone@email.com", headshotUrl: maleHeadshots[0], notes: "Shoe size: 43, Nakedness preference: None, Red flags: I have never heard anything positive" },
      { id: "2", name: "Eliot Prime", age: 43, playingAge: "30-45", phone: "+1-555-0124", email: "eliot.prime@email.com", headshotUrl: maleHeadshots[1], notes: "Shoe size: 41, Nakedness preference: Partial, Red flags: Hates Noah Twinly" },
      { id: "3", name: "Jens Huego", age: 50, playingAge: "40-60", phone: "+1-555-0125", email: "jens.huego@email.com", headshotUrl: maleHeadshots[2], notes: "Shoe size: 45, Nakedness preference: Full, Red flags: None" },
      { id: "4", name: "Max Mellion", age: 49, playingAge: "35-55", phone: "+1-555-0126", email: "max.mellion@email.com", headshotUrl: maleHeadshots[3], notes: "Experienced stage actor, comfortable with physical roles" },
      { id: "5", name: "John Hubert Adam", age: 33, playingAge: "30-45", phone: "+1-555-0127", email: "john.adam@email.com", headshotUrl: maleHeadshots[4], notes: "Great with comedic timing, available for travel" },
      { id: "6", name: "Mikkel Johnson", age: 58, playingAge: "45-60", phone: "+1-555-0128", email: "mikkel.j@email.com", headshotUrl: maleHeadshots[5], notes: "Distinguished look, perfect for authority figures" },
      { id: "7", name: "Clara Fontaine", age: 34, playingAge: "28-38", phone: "+1-555-0129", email: "clara.f@email.com", headshotUrl: femaleHeadshots[0], notes: "Trained dancer, fluent in French and Spanish" },
      { id: "8", name: "Rebecca Sterling", age: 41, playingAge: "35-45", phone: "+1-555-0130", email: "rebecca.s@email.com", headshotUrl: femaleHeadshots[1], notes: "Strong dramatic range, available immediately" },
      { id: "9", name: "Diana Roswell", age: 29, playingAge: "22-32", phone: "+1-555-0131", email: "diana.r@email.com", headshotUrl: femaleHeadshots[2], notes: "Rising talent, great for ingenue roles" },
      { id: "10", name: "Patricia Vance", age: 52, playingAge: "45-55", phone: "+1-555-0132", email: "patricia.v@email.com", headshotUrl: femaleHeadshots[3], notes: "Emmy nominee, excellent for maternal figures" },
    ],
    createdAt: new Date("2026-04-29"),
    updatedAt: new Date("2026-04-29"),
  },
  {
    id: "2",
    name: "Villain_Casting_Pool",
    actors: [
      { id: "v1", name: "Marcus Blackwood", age: 45, playingAge: "40-55", phone: "+1-555-0201", email: "m.blackwood@talent.com", headshotUrl: maleHeadshots[0], notes: "Intimidating presence, deep voice. Previously played crime bosses." },
      { id: "v2", name: "Victor Crane", age: 52, playingAge: "45-60", phone: "+1-555-0202", email: "victor.crane@actors.net", headshotUrl: maleHeadshots[1], notes: "Classically trained, excellent for sophisticated villains" },
      { id: "v3", name: "Nikolai Petrov", age: 39, playingAge: "35-45", phone: "+1-555-0203", email: "n.petrov@casting.com", headshotUrl: maleHeadshots[2], notes: "Authentic Russian accent, martial arts training" },
      { id: "v4", name: "Helena Voss", age: 38, playingAge: "32-42", phone: "+1-555-0204", email: "helena.v@email.com", headshotUrl: femaleHeadshots[0], notes: "Ice-cold delivery, perfect for corporate antagonists" },
      { id: "v5", name: "Damien Frost", age: 41, playingAge: "35-48", phone: "+1-555-0205", email: "d.frost@talent.com", headshotUrl: maleHeadshots[3], notes: "Chameleon-like versatility, can play sympathetic villains" },
      { id: "v6", name: "Serena Cross", age: 44, playingAge: "38-50", phone: "+1-555-0206", email: "serena.c@actors.net", headshotUrl: femaleHeadshots[1], notes: "Commanding screen presence, stage combat trained" },
      { id: "v7", name: "Roland Thorne", age: 56, playingAge: "50-65", phone: "+1-555-0207", email: "r.thorne@casting.com", headshotUrl: maleHeadshots[4], notes: "Gravelly voice, scarred appearance, method actor" },
      { id: "v8", name: "Ingrid Schafer", age: 35, playingAge: "30-40", phone: "+1-555-0208", email: "ingrid.s@email.com", headshotUrl: femaleHeadshots[2], notes: "German-born, excels at calculating characters" },
      { id: "v9", name: "Xavier Dumont", age: 48, playingAge: "42-55", phone: "+1-555-0209", email: "x.dumont@talent.com", headshotUrl: maleHeadshots[5], notes: "French accent available, suave and dangerous" },
      { id: "v10", name: "Lilith Kane", age: 31, playingAge: "25-35", phone: "+1-555-0210", email: "lilith.k@actors.net", headshotUrl: femaleHeadshots[3], notes: "Perfect for femme fatale roles, stunt training" },
    ],
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
  },
  {
    id: "3",
    name: "Comedy_Ensemble_Options",
    actors: [
      { id: "c1", name: "Tommy Riggs", age: 35, playingAge: "28-40", phone: "+1-555-0301", email: "tommy.r@comedy.com", headshotUrl: maleHeadshots[0], notes: "Improv background at Second City, physical comedy specialist" },
      { id: "c2", name: "Bella Martinez", age: 29, playingAge: "24-32", phone: "+1-555-0302", email: "bella.m@talent.com", headshotUrl: femaleHeadshots[0], notes: "Stand-up comedian, perfect timing, ad-lib queen" },
      { id: "c3", name: "Chester Noonan", age: 42, playingAge: "35-50", phone: "+1-555-0303", email: "chester.n@actors.net", headshotUrl: maleHeadshots[1], notes: "Veteran sitcom actor, deadpan delivery expert" },
      { id: "c4", name: "Ginger Holloway", age: 38, playingAge: "32-42", phone: "+1-555-0304", email: "ginger.h@email.com", headshotUrl: femaleHeadshots[1], notes: "Musical comedy background, great at physical comedy" },
      { id: "c5", name: "Doug Pemberton", age: 51, playingAge: "45-60", phone: "+1-555-0305", email: "doug.p@comedy.com", headshotUrl: maleHeadshots[2], notes: "Character actor extraordinaire, 100+ commercial credits" },
      { id: "c6", name: "Wendy Park", age: 33, playingAge: "25-35", phone: "+1-555-0306", email: "wendy.p@talent.com", headshotUrl: femaleHeadshots[2], notes: "UCB trained, excels at awkward humor" },
      { id: "c7", name: "Bernard 'Bernie' Kowalski", age: 47, playingAge: "40-55", phone: "+1-555-0307", email: "bernie.k@actors.net", headshotUrl: maleHeadshots[3], notes: "Polish-American, perfect for everyman comedic roles" },
      { id: "c8", name: "Maisie Chen", age: 26, playingAge: "20-28", phone: "+1-555-0308", email: "maisie.c@email.com", headshotUrl: femaleHeadshots[3], notes: "TikTok famous, Gen-Z comedy sensibility" },
      { id: "c9", name: "Frank Deluca", age: 55, playingAge: "48-62", phone: "+1-555-0309", email: "frank.d@comedy.com", headshotUrl: maleHeadshots[4], notes: "Brooklyn native, classic New York comedy style" },
      { id: "c10", name: "Priya Sharma", age: 31, playingAge: "26-35", phone: "+1-555-0310", email: "priya.s@talent.com", headshotUrl: femaleHeadshots[4], notes: "British-trained, sharp wit, excellent at banter" },
    ],
    createdAt: new Date("2026-05-05"),
    updatedAt: new Date("2026-05-05"),
  },
  {
    id: "4",
    name: "Period_Drama_Talent",
    actors: [
      { id: "p1", name: "Eleanor Ashford", age: 34, playingAge: "28-38", phone: "+1-555-0401", email: "eleanor.a@period.com", headshotUrl: femaleHeadshots[0], notes: "RADA trained, extensive period film experience, rides horses" },
      { id: "p2", name: "Sebastian Wright", age: 41, playingAge: "35-48", phone: "+1-555-0402", email: "seb.w@talent.com", headshotUrl: maleHeadshots[0], notes: "Shakespearean background, authentic RP accent" },
      { id: "p3", name: "Cordelia Beaumont", age: 28, playingAge: "22-30", phone: "+1-555-0403", email: "cordelia.b@actors.net", headshotUrl: femaleHeadshots[1], notes: "Ballroom dancing trained, plays piano and harp" },
      { id: "p4", name: "Arthur Pemberton", age: 55, playingAge: "48-62", phone: "+1-555-0404", email: "arthur.p@email.com", headshotUrl: maleHeadshots[1], notes: "RSC veteran, commanding presence, period specialist" },
      { id: "p5", name: "Josephine Hart", age: 45, playingAge: "40-52", phone: "+1-555-0405", email: "jo.h@period.com", headshotUrl: femaleHeadshots[2], notes: "West End star, excellent for matriarchal roles" },
      { id: "p6", name: "Theodore Blackwell", age: 38, playingAge: "32-42", phone: "+1-555-0406", email: "theo.b@talent.com", headshotUrl: maleHeadshots[2], notes: "Fencing expert, period combat choreography experience" },
      { id: "p7", name: "Arabella Sinclair", age: 31, playingAge: "25-35", phone: "+1-555-0407", email: "arabella.s@actors.net", headshotUrl: femaleHeadshots[3], notes: "Corset-trained, period movement specialist" },
      { id: "p8", name: "Montgomery Fields", age: 62, playingAge: "55-70", phone: "+1-555-0408", email: "monty.f@email.com", headshotUrl: maleHeadshots[3], notes: "Distinguished look, perfect for aristocratic roles" },
      { id: "p9", name: "Violet Ashworth", age: 36, playingAge: "30-40", phone: "+1-555-0409", email: "violet.a@period.com", headshotUrl: femaleHeadshots[4], notes: "Period singing voice, governess/companion types" },
      { id: "p10", name: "Charles Thornton III", age: 48, playingAge: "42-55", phone: "+1-555-0410", email: "charles.t@talent.com", headshotUrl: maleHeadshots[4], notes: "Old money look, excellent at repressed emotion" },
    ],
    createdAt: new Date("2026-05-10"),
    updatedAt: new Date("2026-05-10"),
  },
  {
    id: "5",
    name: "Action_Stunts_Ready",
    actors: [
      { id: "a1", name: "Jake Rodriguez", age: 32, playingAge: "25-38", phone: "+1-555-0501", email: "jake.r@action.com", headshotUrl: maleHeadshots[0], notes: "Former MMA fighter, does own stunts, weapons certified" },
      { id: "a2", name: "Natasha Volkov", age: 29, playingAge: "24-34", phone: "+1-555-0502", email: "natasha.v@talent.com", headshotUrl: femaleHeadshots[0], notes: "Gymnastics background, wire work expert, multilingual" },
      { id: "a3", name: "Derek Storm", age: 38, playingAge: "32-42", phone: "+1-555-0503", email: "derek.s@actors.net", headshotUrl: maleHeadshots[1], notes: "Ex-military, tactical consultant, motorcycle specialist" },
      { id: "a4", name: "Jade Chen", age: 27, playingAge: "22-30", phone: "+1-555-0504", email: "jade.c@email.com", headshotUrl: femaleHeadshots[1], notes: "Martial arts master, trained in Hong Kong, flexible schedule" },
      { id: "a5", name: "Marcus Kane", age: 35, playingAge: "28-40", phone: "+1-555-0505", email: "marcus.k@action.com", headshotUrl: maleHeadshots[2], notes: "Parkour expert, high fall certified, rock climbing" },
      { id: "a6", name: "Sofia Reyes", age: 31, playingAge: "26-35", phone: "+1-555-0506", email: "sofia.r@talent.com", headshotUrl: femaleHeadshots[2], notes: "Stunt coordinator experience, fire burns trained" },
      { id: "a7", name: "Tyler Blackwood", age: 28, playingAge: "23-32", phone: "+1-555-0507", email: "tyler.b@actors.net", headshotUrl: maleHeadshots[3], notes: "Professional driver, car chase specialist" },
      { id: "a8", name: "Zara Knight", age: 33, playingAge: "28-38", phone: "+1-555-0508", email: "zara.k@email.com", headshotUrl: femaleHeadshots[3], notes: "Sword fighting expert, period and modern combat" },
      { id: "a9", name: "Dominic Cruz", age: 41, playingAge: "35-45", phone: "+1-555-0509", email: "dom.c@action.com", headshotUrl: maleHeadshots[4], notes: "Former stunt coordinator, can choreograph sequences" },
      { id: "a10", name: "Maya Santos", age: 26, playingAge: "21-28", phone: "+1-555-0510", email: "maya.s@talent.com", headshotUrl: femaleHeadshots[4], notes: "Capoeira dancer, acrobatic specialist, fearless" },
    ],
    createdAt: new Date("2026-05-15"),
    updatedAt: new Date("2026-05-15"),
  },
]

export function ActorListProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ActorListProject[]>(initialProjects)
  const [currentProject, setCurrentProject] = useState<ActorListProject | null>(null)
  const [view, setView] = useState<"list" | "upload" | "results">("list")

  const createProject = (name: string, actors: Actor[]) => {
    const newProject: ActorListProject = {
      id: Date.now().toString(),
      name,
      actors,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setProjects([...projects, newProject])
    setCurrentProject(newProject)
    setView("results")
  }

  const selectProject = (id: string) => {
    const project = projects.find((p) => p.id === id)
    if (project) {
      setCurrentProject(project)
      setView("results")
    }
  }

  const updateProject = (id: string, updates: Partial<ActorListProject>) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)))
    if (currentProject?.id === id) {
      setCurrentProject({ ...currentProject, ...updates, updatedAt: new Date() })
    }
  }

  const deleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id))
    if (currentProject?.id === id) {
      setCurrentProject(null)
      setView("list")
    }
  }

  const addActor = (actor: Actor) => {
    if (!currentProject) return
    const updatedProject = {
      ...currentProject,
      actors: [...currentProject.actors, actor],
      updatedAt: new Date(),
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
  }

  const updateActor = (actor: Actor) => {
    if (!currentProject) return
    const updatedProject = {
      ...currentProject,
      actors: currentProject.actors.map((a) => (a.id === actor.id ? actor : a)),
      updatedAt: new Date(),
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
  }

  const deleteActor = (id: string) => {
    if (!currentProject) return
    const updatedProject = {
      ...currentProject,
      actors: currentProject.actors.filter((a) => a.id !== id),
      updatedAt: new Date(),
    }
    setCurrentProject(updatedProject)
    setProjects(projects.map((p) => (p.id === currentProject.id ? updatedProject : p)))
  }

  const goBack = () => {
    if (view === "results") {
      setCurrentProject(null)
      setView("list")
    } else if (view === "upload") {
      setView("list")
    }
  }

  return (
    <ActorListContext.Provider
      value={{
        projects,
        currentProject,
        view,
        setView,
        createProject,
        selectProject,
        updateProject,
        deleteProject,
        addActor,
        updateActor,
        deleteActor,
        goBack,
      }}
    >
      {children}
    </ActorListContext.Provider>
  )
}

export function useActorList() {
  const context = useContext(ActorListContext)
  if (!context) {
    throw new Error("useActorList must be used within an ActorListProvider")
  }
  return context
}

// Safe version that doesn't throw - returns null if not within provider
export function useActorListSafe() {
  return useContext(ActorListContext)
}
