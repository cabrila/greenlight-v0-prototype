"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"
import { CastingCall, CastingCallField, CastingSubmission, PublicCastingProject, CastingGroup } from "@/types/public-casting"

interface PublicCastingState {
  projects: PublicCastingProject[]
  currentProject: PublicCastingProject | null
  currentCastingCall: CastingCall | null
  newSubmissionsCount: number
  castingGroups: CastingGroup[]
}

interface PublicCastingContextType {
  state: PublicCastingState
  createProject: (name: string) => PublicCastingProject
  selectProject: (id: string) => void
  updateProject: (id: string, updates: Partial<PublicCastingProject>) => void
  deleteProject: (id: string) => void
  createCastingCall: (projectId: string, title: string, description: string, projectName: string, fields: CastingCallField[], headerImageUrl?: string, talentPoolConsentEnabled?: boolean, talentPoolConsentText?: string) => CastingCall
  updateCastingCall: (projectId: string, castingCallId: string, updates: Partial<CastingCall>) => void
  deleteCastingCall: (projectId: string, castingCallId: string) => void
  selectCastingCall: (id: string) => void
  addSubmission: (castingCallId: string, data: Record<string, string | string[]>) => void
  updateSubmission: (submissionId: string, updates: Partial<CastingSubmission>) => void
  deleteSubmission: (submissionId: string) => void
  markSubmissionsAsRead: (projectId: string) => void
  getSubmissionsForProject: (projectId: string) => CastingSubmission[]
  getTotalSubmissions: () => number
  getNewSubmissionsCount: () => number
  createCastingGroup: (name: string, projectIds: string[], imageUrl?: string) => CastingGroup
  updateCastingGroup: (id: string, updates: Partial<CastingGroup>) => void
  deleteCastingGroup: (id: string) => void
  toggleCastingGroupExpanded: (id: string) => void
}

const PublicCastingContext = createContext<PublicCastingContextType | null>(null)

// Demo data
const createDemoData = (): PublicCastingProject[] => {
  // Reusable headshot URLs
  const maleHeadshots = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
  ]
  const femaleHeadshots = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face",
  ]

  // Standard form fields
  const standardFields: CastingCallField[] = [
    { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
    { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
    { id: "f3", label: "Phone", type: "phone", required: true, placeholder: "+1-555-0000" },
    { id: "f4", label: "Age", type: "number", required: true, placeholder: "Your age" },
    { id: "f5", label: "Gender", type: "gender", required: false, placeholder: "Select your gender" },
    { id: "f6", label: "Playing Age Range", type: "text", required: false, placeholder: "e.g., 25-35" },
    { id: "f7", label: "Headshot", type: "image", required: false, placeholder: "Upload your headshot" },
    { id: "f8", label: "Additional Notes", type: "textarea", required: false, placeholder: "Tell us about yourself..." },
  ]

  const minimalFields: CastingCallField[] = [
    { id: "f1", label: "Full Name", type: "text", required: true, placeholder: "Enter your full name" },
    { id: "f2", label: "Email", type: "email", required: true, placeholder: "your@email.com" },
    { id: "f3", label: "Phone", type: "phone", required: false, placeholder: "+1-555-0000" },
    { id: "f4", label: "Experience", type: "textarea", required: true, placeholder: "Describe your relevant experience" },
  ]

  // Project 1: Midnight Echo - Active casting with submissions
  const midnightEchoSubmissions: CastingSubmission[] = [
    { id: "sub-1-1", castingCallId: "cc-1", castingCallTitle: "Lead Role - Sarah", data: {}, submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), isNew: true, name: "Emma Thompson", email: "emma.t@email.com", phone: "+1-555-1001", age: "28", gender: "Female", playingAge: "25-32", headshot: femaleHeadshots[0], notes: "Experienced in drama and action. Available immediately." },
    { id: "sub-1-2", castingCallId: "cc-1", castingCallTitle: "Lead Role - Sarah", data: {}, submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), isNew: true, name: "Olivia Chen", email: "olivia.c@email.com", phone: "+1-555-1002", age: "31", gender: "Female", playingAge: "26-34", headshot: femaleHeadshots[1], notes: "SAG-AFTRA member, trained at Juilliard." },
    { id: "sub-1-3", castingCallId: "cc-1", castingCallTitle: "Lead Role - Sarah", data: {}, submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), isNew: false, name: "Sofia Martinez", email: "sofia.m@email.com", phone: "+1-555-1003", age: "27", gender: "Female", playingAge: "22-30", headshot: femaleHeadshots[2], notes: "Bilingual Spanish/English, stunt training." },
    { id: "sub-1-4", castingCallId: "cc-1", castingCallTitle: "Lead Role - Sarah", data: {}, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), isNew: false, name: "Rachel Kim", email: "rachel.k@email.com", phone: "+1-555-1004", age: "29", gender: "Female", playingAge: "24-32", headshot: femaleHeadshots[3], notes: "Theater background, available for callbacks anytime." },
    { id: "sub-1-5", castingCallId: "cc-1", castingCallTitle: "Lead Role - Sarah", data: {}, submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), isNew: false, name: "Amanda Foster", email: "amanda.f@email.com", phone: "+1-555-1005", age: "33", gender: "Female", playingAge: "28-36", headshot: femaleHeadshots[4], notes: "Previous lead roles in indie films." },
    { id: "sub-1-6", castingCallId: "cc-2", castingCallTitle: "Supporting - Detective Barnes", data: {}, submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), isNew: true, name: "Michael Chen", email: "michael.c@email.com", phone: "+1-555-1006", age: "42", gender: "Male", playingAge: "38-48", headshot: maleHeadshots[0], notes: "10 years theater experience, authoritative presence." },
    { id: "sub-1-7", castingCallId: "cc-2", castingCallTitle: "Supporting - Detective Barnes", data: {}, submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), isNew: false, name: "James Wilson", email: "james.w@email.com", phone: "+1-555-1007", age: "45", gender: "Male", playingAge: "40-50", headshot: maleHeadshots[1], notes: "Former police consultant, authentic delivery." },
    { id: "sub-1-8", castingCallId: "cc-2", castingCallTitle: "Supporting - Detective Barnes", data: {}, submittedAt: new Date(Date.now() - 36 * 60 * 60 * 1000), isNew: false, name: "Robert Davis", email: "robert.d@email.com", phone: "+1-555-1008", age: "39", gender: "Male", playingAge: "35-45", headshot: maleHeadshots[2], notes: "Character actor, multiple TV credits." },
    { id: "sub-1-9", castingCallId: "cc-2", castingCallTitle: "Supporting - Detective Barnes", data: {}, submittedAt: new Date(Date.now() - 60 * 60 * 60 * 1000), isNew: false, name: "William Brown", email: "william.b@email.com", phone: "+1-555-1009", age: "48", gender: "Male", playingAge: "42-52", headshot: maleHeadshots[3], notes: "Deep voice, imposing physical presence." },
    { id: "sub-1-10", castingCallId: "cc-2", castingCallTitle: "Supporting - Detective Barnes", data: {}, submittedAt: new Date(Date.now() - 84 * 60 * 60 * 1000), isNew: false, name: "Daniel Moore", email: "daniel.m@email.com", phone: "+1-555-1010", age: "44", gender: "Male", playingAge: "38-48", headshot: maleHeadshots[4], notes: "Action experience, does own stunts." },
  ]

  // Project 2: The Whitmore Estate - Completed casting
  const whitmoreSubmissions: CastingSubmission[] = [
    { id: "sub-2-1", castingCallId: "cc-3", castingCallTitle: "Eleanor Whitmore", data: {}, submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), isNew: false, name: "Helen Mirren-type", email: "casting@agent.com", phone: "+1-555-2001", age: "78", gender: "Female", playingAge: "75-85", headshot: femaleHeadshots[0], notes: "Legendary presence, Oscar-caliber performance expected." },
    { id: "sub-2-2", castingCallId: "cc-3", castingCallTitle: "Eleanor Whitmore", data: {}, submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), isNew: false, name: "Margaret Stone", email: "m.stone@email.com", phone: "+1-555-2002", age: "82", gender: "Female", playingAge: "78-88", headshot: femaleHeadshots[1], notes: "Stage legend, powerful emotional range." },
    { id: "sub-2-3", castingCallId: "cc-3", castingCallTitle: "Eleanor Whitmore", data: {}, submittedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), isNew: false, name: "Virginia West", email: "v.west@email.com", phone: "+1-555-2003", age: "79", gender: "Female", playingAge: "75-85", headshot: femaleHeadshots[2], notes: "British theater trained, impeccable diction." },
    { id: "sub-2-4", castingCallId: "cc-3", castingCallTitle: "Eleanor Whitmore", data: {}, submittedAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), isNew: false, name: "Dorothy Palmer", email: "d.palmer@email.com", phone: "+1-555-2004", age: "76", gender: "Female", playingAge: "72-82", headshot: femaleHeadshots[3], notes: "Emmy winner, matriarchal roles specialty." },
    { id: "sub-2-5", castingCallId: "cc-3", castingCallTitle: "Eleanor Whitmore", data: {}, submittedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), isNew: false, name: "Beatrice Crown", email: "b.crown@email.com", phone: "+1-555-2005", age: "80", gender: "Female", playingAge: "76-86", headshot: femaleHeadshots[4], notes: "Classical training, commanding screen presence." },
    { id: "sub-2-6", castingCallId: "cc-4", castingCallTitle: "James Whitmore", data: {}, submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), isNew: false, name: "Patrick Stewart-type", email: "casting2@agent.com", phone: "+1-555-2006", age: "55", gender: "Male", playingAge: "50-60", headshot: maleHeadshots[0], notes: "Charming failure persona, desperate undertones." },
    { id: "sub-2-7", castingCallId: "cc-4", castingCallTitle: "James Whitmore", data: {}, submittedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), isNew: false, name: "Richard Graves", email: "r.graves@email.com", phone: "+1-555-2007", age: "52", gender: "Male", playingAge: "48-58", headshot: maleHeadshots[1], notes: "Perfect blend of charm and desperation." },
    { id: "sub-2-8", castingCallId: "cc-4", castingCallTitle: "James Whitmore", data: {}, submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), isNew: false, name: "Geoffrey Holt", email: "g.holt@email.com", phone: "+1-555-2008", age: "58", gender: "Male", playingAge: "52-62", headshot: maleHeadshots[2], notes: "Old money look, hidden menace capability." },
    { id: "sub-2-9", castingCallId: "cc-4", castingCallTitle: "James Whitmore", data: {}, submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), isNew: false, name: "Anthony Blake", email: "a.blake@email.com", phone: "+1-555-2009", age: "54", gender: "Male", playingAge: "48-58", headshot: maleHeadshots[3], notes: "Shakespearean training, moral complexity." },
    { id: "sub-2-10", castingCallId: "cc-4", castingCallTitle: "James Whitmore", data: {}, submittedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), isNew: false, name: "Charles Hampton", email: "c.hampton@email.com", phone: "+1-555-2010", age: "56", gender: "Male", playingAge: "50-60", headshot: maleHeadshots[4], notes: "Broadway veteran, great at entitled characters." },
  ]

  // Project 3: Neon Requiem - Active cyberpunk casting
  const neonSubmissions: CastingSubmission[] = [
    { id: "sub-3-1", castingCallId: "cc-5", castingCallTitle: "Zero - Lead Hacker", data: {}, submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), isNew: true, name: "Zendaya-type", email: "agent@talent.com", phone: "+1-555-3001", age: "27", gender: "Female", playingAge: "24-30", headshot: femaleHeadshots[0], notes: "Action-ready, cyberpunk aesthetic natural fit." },
    { id: "sub-3-2", castingCallId: "cc-5", castingCallTitle: "Zero - Lead Hacker", data: {}, submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), isNew: true, name: "Maya Rodriguez", email: "maya.r@email.com", phone: "+1-555-3002", age: "26", gender: "Female", playingAge: "22-28", headshot: femaleHeadshots[1], notes: "Parkour trained, tech-savvy, edgy look." },
    { id: "sub-3-3", castingCallId: "cc-5", castingCallTitle: "Zero - Lead Hacker", data: {}, submittedAt: new Date(Date.now() - 30 * 60 * 60 * 1000), isNew: false, name: "Keiko Tanaka", email: "keiko.t@email.com", phone: "+1-555-3003", age: "28", gender: "Female", playingAge: "24-32", headshot: femaleHeadshots[2], notes: "Martial arts background, bilingual Japanese." },
    { id: "sub-3-4", castingCallId: "cc-5", castingCallTitle: "Zero - Lead Hacker", data: {}, submittedAt: new Date(Date.now() - 42 * 60 * 60 * 1000), isNew: false, name: "Aaliyah Washington", email: "aaliyah.w@email.com", phone: "+1-555-3004", age: "25", gender: "Female", playingAge: "22-28", headshot: femaleHeadshots[3], notes: "Rising star, great at rebellious characters." },
    { id: "sub-3-5", castingCallId: "cc-5", castingCallTitle: "Zero - Lead Hacker", data: {}, submittedAt: new Date(Date.now() - 54 * 60 * 60 * 1000), isNew: false, name: "River Chen", email: "river.c@email.com", phone: "+1-555-3005", age: "29", gender: "Other", playingAge: "25-32", headshot: femaleHeadshots[4], notes: "Stunt training, cyberpunk film experience." },
    { id: "sub-3-6", castingCallId: "cc-6", castingCallTitle: "Marcus Cole - Resistance Leader", data: {}, submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), isNew: true, name: "Michael B. Jordan-type", email: "mbj.agent@email.com", phone: "+1-555-3006", age: "33", gender: "Male", playingAge: "28-38", headshot: maleHeadshots[0], notes: "Charismatic leader energy, action star caliber." },
    { id: "sub-3-7", castingCallId: "cc-6", castingCallTitle: "Marcus Cole - Resistance Leader", data: {}, submittedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), isNew: false, name: "Derek Washington", email: "derek.w@email.com", phone: "+1-555-3007", age: "31", gender: "Male", playingAge: "27-35", headshot: maleHeadshots[1], notes: "Military bearing, commanding voice." },
    { id: "sub-3-8", castingCallId: "cc-6", castingCallTitle: "Marcus Cole - Resistance Leader", data: {}, submittedAt: new Date(Date.now() - 32 * 60 * 60 * 1000), isNew: false, name: "Isaiah Grant", email: "isaiah.g@email.com", phone: "+1-555-3008", age: "35", gender: "Male", playingAge: "30-40", headshot: maleHeadshots[2], notes: "Stage presence, revolutionary character specialist." },
    { id: "sub-3-9", castingCallId: "cc-6", castingCallTitle: "Marcus Cole - Resistance Leader", data: {}, submittedAt: new Date(Date.now() - 44 * 60 * 60 * 1000), isNew: false, name: "Marcus Thompson", email: "marcus.t@email.com", phone: "+1-555-3009", age: "32", gender: "Male", playingAge: "28-36", headshot: maleHeadshots[3], notes: "Action hero physique, emotional depth." },
    { id: "sub-3-10", castingCallId: "cc-6", castingCallTitle: "Marcus Cole - Resistance Leader", data: {}, submittedAt: new Date(Date.now() - 56 * 60 * 60 * 1000), isNew: false, name: "Jordan Ellis", email: "jordan.e@email.com", phone: "+1-555-3010", age: "34", gender: "Male", playingAge: "29-38", headshot: maleHeadshots[4], notes: "Trained at Yale Drama, versatile performer." },
  ]

  // Project 4: Harbor Lights - Completed family drama casting
  const harborSubmissions: CastingSubmission[] = [
    { id: "sub-4-1", castingCallId: "cc-7", castingCallTitle: "Captain Tom Reilly", data: {}, submittedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), isNew: false, name: "Tom Hanks-type", email: "top.talent@agent.com", phone: "+1-555-4001", age: "58", gender: "Male", playingAge: "55-65", headshot: maleHeadshots[0], notes: "Everyman quality, weathered dignity." },
    { id: "sub-4-2", castingCallId: "cc-7", castingCallTitle: "Captain Tom Reilly", data: {}, submittedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), isNew: false, name: "Frank Morrison", email: "frank.m@email.com", phone: "+1-555-4002", age: "56", gender: "Male", playingAge: "52-62", headshot: maleHeadshots[1], notes: "Working class authenticity, stubborn charm." },
    { id: "sub-4-3", castingCallId: "cc-7", castingCallTitle: "Captain Tom Reilly", data: {}, submittedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), isNew: false, name: "Patrick O'Brien", email: "p.obrien@email.com", phone: "+1-555-4003", age: "59", gender: "Male", playingAge: "55-65", headshot: maleHeadshots[2], notes: "Irish heritage, sailor experience." },
    { id: "sub-4-4", castingCallId: "cc-7", castingCallTitle: "Captain Tom Reilly", data: {}, submittedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), isNew: false, name: "William Brennan", email: "w.brennan@email.com", phone: "+1-555-4004", age: "57", gender: "Male", playingAge: "53-63", headshot: maleHeadshots[3], notes: "Stage veteran, blue-collar roles specialty." },
    { id: "sub-4-5", castingCallId: "cc-7", castingCallTitle: "Captain Tom Reilly", data: {}, submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), isNew: false, name: "Thomas Kelly", email: "t.kelly@email.com", phone: "+1-555-4005", age: "60", gender: "Male", playingAge: "56-66", headshot: maleHeadshots[4], notes: "Actual maritime background, natural leader." },
    { id: "sub-4-6", castingCallId: "cc-8", castingCallTitle: "Maya Reilly-Washington", data: {}, submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), isNew: false, name: "Kerry Washington-type", email: "kw.agent@email.com", phone: "+1-555-4006", age: "32", gender: "Female", playingAge: "28-36", headshot: femaleHeadshots[0], notes: "Passionate advocate type, family loyalty conflict." },
    { id: "sub-4-7", castingCallId: "cc-8", castingCallTitle: "Maya Reilly-Washington", data: {}, submittedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), isNew: false, name: "Jasmine Carter", email: "jasmine.c@email.com", phone: "+1-555-4007", age: "30", gender: "Female", playingAge: "26-34", headshot: femaleHeadshots[1], notes: "Lawyer believability, emotional range." },
    { id: "sub-4-8", castingCallId: "cc-8", castingCallTitle: "Maya Reilly-Washington", data: {}, submittedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), isNew: false, name: "Nicole Taylor", email: "nicole.t@email.com", phone: "+1-555-4008", age: "33", gender: "Female", playingAge: "29-37", headshot: femaleHeadshots[2], notes: "Professional presence, daughter energy." },
    { id: "sub-4-9", castingCallId: "cc-8", castingCallTitle: "Maya Reilly-Washington", data: {}, submittedAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), isNew: false, name: "Brianna James", email: "brianna.j@email.com", phone: "+1-555-4009", age: "31", gender: "Female", playingAge: "27-35", headshot: femaleHeadshots[3], notes: "Great chemistry potential, strong will." },
    { id: "sub-4-10", castingCallId: "cc-8", castingCallTitle: "Maya Reilly-Washington", data: {}, submittedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000), isNew: false, name: "Morgan Lewis", email: "morgan.l@email.com", phone: "+1-555-4010", age: "34", gender: "Female", playingAge: "30-38", headshot: femaleHeadshots[4], notes: "Environmental activist believability." },
  ]

  // Project 5: Period Drama 1920s - Active casting
  const periodSubmissions: CastingSubmission[] = [
    { id: "sub-5-1", castingCallId: "cc-9", castingCallTitle: "Jazz Singer - Dolores", data: {}, submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), isNew: true, name: "Viola Davis-type", email: "vd.agent@email.com", phone: "+1-555-5001", age: "38", gender: "Female", playingAge: "32-42", headshot: femaleHeadshots[0], notes: "Powerful vocals, Harlem Renaissance essence." },
    { id: "sub-5-2", castingCallId: "cc-9", castingCallTitle: "Jazz Singer - Dolores", data: {}, submittedAt: new Date(Date.now() - 16 * 60 * 60 * 1000), isNew: true, name: "Jasmine Brooks", email: "jasmine.b@email.com", phone: "+1-555-5002", age: "35", gender: "Female", playingAge: "30-40", headshot: femaleHeadshots[1], notes: "Broadway singer, period movement trained." },
    { id: "sub-5-3", castingCallId: "cc-9", castingCallTitle: "Jazz Singer - Dolores", data: {}, submittedAt: new Date(Date.now() - 28 * 60 * 60 * 1000), isNew: false, name: "Diana Ross-type", email: "dr.casting@email.com", phone: "+1-555-5003", age: "36", gender: "Female", playingAge: "30-40", headshot: femaleHeadshots[2], notes: "Stunning period look, sultry voice." },
    { id: "sub-5-4", castingCallId: "cc-9", castingCallTitle: "Jazz Singer - Dolores", data: {}, submittedAt: new Date(Date.now() - 40 * 60 * 60 * 1000), isNew: false, name: "Cynthia Williams", email: "cynthia.w@email.com", phone: "+1-555-5004", age: "34", gender: "Female", playingAge: "28-38", headshot: femaleHeadshots[3], notes: "Classically trained singer, acting chops." },
    { id: "sub-5-5", castingCallId: "cc-9", castingCallTitle: "Jazz Singer - Dolores", data: {}, submittedAt: new Date(Date.now() - 52 * 60 * 60 * 1000), isNew: false, name: "Lorraine Harper", email: "lorraine.h@email.com", phone: "+1-555-5005", age: "37", gender: "Female", playingAge: "32-42", headshot: femaleHeadshots[4], notes: "Jazz album released, authentic performer." },
    { id: "sub-5-6", castingCallId: "cc-10", castingCallTitle: "Bootlegger - Vincent", data: {}, submittedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), isNew: true, name: "Oscar Isaac-type", email: "oi.agent@email.com", phone: "+1-555-5006", age: "41", gender: "Male", playingAge: "35-45", headshot: maleHeadshots[0], notes: "Dangerous charm, immigrant story arc." },
    { id: "sub-5-7", castingCallId: "cc-10", castingCallTitle: "Bootlegger - Vincent", data: {}, submittedAt: new Date(Date.now() - 22 * 60 * 60 * 1000), isNew: false, name: "Marco Santini", email: "marco.s@email.com", phone: "+1-555-5007", age: "38", gender: "Male", playingAge: "32-42", headshot: maleHeadshots[1], notes: "Italian heritage, period gangster experience." },
    { id: "sub-5-8", castingCallId: "cc-10", castingCallTitle: "Bootlegger - Vincent", data: {}, submittedAt: new Date(Date.now() - 34 * 60 * 60 * 1000), isNew: false, name: "Antonio Reyes", email: "antonio.r@email.com", phone: "+1-555-5008", age: "40", gender: "Male", playingAge: "35-45", headshot: maleHeadshots[2], notes: "Menacing presence, romantic lead capable." },
    { id: "sub-5-9", castingCallId: "cc-10", castingCallTitle: "Bootlegger - Vincent", data: {}, submittedAt: new Date(Date.now() - 46 * 60 * 60 * 1000), isNew: false, name: "Dominic Caruso", email: "dom.c@email.com", phone: "+1-555-5009", age: "42", gender: "Male", playingAge: "36-46", headshot: maleHeadshots[3], notes: "Method actor, prohibition era specialist." },
    { id: "sub-5-10", castingCallId: "cc-10", castingCallTitle: "Bootlegger - Vincent", data: {}, submittedAt: new Date(Date.now() - 58 * 60 * 60 * 1000), isNew: false, name: "Nicholas Romano", email: "nick.r@email.com", phone: "+1-555-5010", age: "39", gender: "Male", playingAge: "34-44", headshot: maleHeadshots[4], notes: "Authentic New York accent, charming villain." },
  ]

  return [
    {
      id: "proj-1",
      name: "Midnight Echo",
      castingCalls: [
        { id: "cc-1", title: "Lead Role - Sarah", description: "Seeking a dynamic actress for the lead role of Sarah, a journalist uncovering a conspiracy.", projectName: "Midnight Echo", fields: standardFields, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), isActive: true, shareableLink: "https://gogreenlight.ai/cast/me-sarah", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being added to the talent pool for future thriller projects." },
        { id: "cc-2", title: "Supporting - Detective Barnes", description: "Looking for an experienced actor for the role of Detective Barnes.", projectName: "Midnight Echo", fields: minimalFields, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), isActive: true, shareableLink: "https://gogreenlight.ai/cast/me-barnes", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being considered for future crime drama productions." },
      ],
      submissions: midnightEchoSubmissions,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: "proj-2",
      name: "The Whitmore Estate",
      castingCalls: [
        { id: "cc-3", title: "Eleanor Whitmore", description: "Seeking a commanding actress for the role of the dying family matriarch.", projectName: "The Whitmore Estate", fields: standardFields, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), isActive: false, isCompleted: true, shareableLink: "https://gogreenlight.ai/cast/we-eleanor", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being added to the talent pool for period drama projects." },
        { id: "cc-4", title: "James Whitmore", description: "Looking for a charming yet desperate actor for the role of the failed son.", projectName: "The Whitmore Estate", fields: minimalFields, createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), isActive: false, isCompleted: true, shareableLink: "https://gogreenlight.ai/cast/we-james", talentPoolConsentEnabled: false },
      ],
      submissions: whitmoreSubmissions,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    },
    {
      id: "proj-3",
      name: "Neon Requiem",
      castingCalls: [
        { id: "cc-5", title: "Zero - Lead Hacker", description: "Seeking an athletic actress for the lead role of Zero, an elite hacker turned revolutionary.", projectName: "Neon Requiem", fields: standardFields, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), isActive: true, shareableLink: "https://gogreenlight.ai/cast/nr-zero", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being added to the sci-fi/action talent pool." },
        { id: "cc-6", title: "Marcus Cole - Resistance Leader", description: "Looking for a charismatic actor for Marcus, leader of the underground resistance.", projectName: "Neon Requiem", fields: standardFields, createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), isActive: true, shareableLink: "https://gogreenlight.ai/cast/nr-marcus", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being considered for future action productions." },
      ],
      submissions: neonSubmissions,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      id: "proj-4",
      name: "Harbor Lights",
      castingCalls: [
        { id: "cc-7", title: "Captain Tom Reilly", description: "Seeking a weathered actor for the role of a veteran harbor pilot facing retirement.", projectName: "Harbor Lights", fields: standardFields, createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), isActive: false, isCompleted: true, shareableLink: "https://gogreenlight.ai/cast/hl-tom", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being added to the family drama talent pool." },
        { id: "cc-8", title: "Maya Reilly-Washington", description: "Looking for an actress for Maya, Tom's daughter caught between family and principles.", projectName: "Harbor Lights", fields: minimalFields, createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000), isActive: false, isCompleted: true, shareableLink: "https://gogreenlight.ai/cast/hl-maya", talentPoolConsentEnabled: false },
      ],
      submissions: harborSubmissions,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    },
    {
      id: "proj-5",
      name: "The Jazz Age",
      castingCalls: [
        { id: "cc-9", title: "Jazz Singer - Dolores", description: "Seeking a powerful vocalist and actress for Dolores, a Harlem Renaissance singer.", projectName: "The Jazz Age", fields: standardFields, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), isActive: true, shareableLink: "https://gogreenlight.ai/cast/ja-dolores", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being added to the period drama and musical talent pool." },
        { id: "cc-10", title: "Bootlegger - Vincent", description: "Looking for a charismatic actor for Vincent, an ambitious bootlegger with dangerous charm.", projectName: "The Jazz Age", fields: standardFields, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), isActive: true, shareableLink: "https://gogreenlight.ai/cast/ja-vincent", talentPoolConsentEnabled: true, talentPoolConsentText: "I consent to being considered for future 1920s period productions." },
      ],
      submissions: periodSubmissions,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  ]
}

export function PublicCastingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PublicCastingState>({
    projects: createDemoData(),
    currentProject: null,
    currentCastingCall: null,
    newSubmissionsCount: 12, // Updated to reflect new demo data with new submissions
    castingGroups: [],
  })

  const createProject = useCallback((name: string): PublicCastingProject => {
    const newProject: PublicCastingProject = {
      id: `proj-${Date.now()}`,
      name,
      castingCalls: [],
      submissions: [],
      createdAt: new Date(),
    }
    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
      currentProject: newProject,
    }))
    return newProject
  }, [])

  const selectProject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      currentProject: prev.projects.find((p) => p.id === id) || null,
      currentCastingCall: null,
    }))
  }, [])

  const updateProject = useCallback((id: string, updates: Partial<PublicCastingProject>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentProject: prev.currentProject?.id === id ? { ...prev.currentProject, ...updates } : prev.currentProject,
    }))
  }, [])

  const deleteProject = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      currentProject: prev.currentProject?.id === id ? null : prev.currentProject,
    }))
  }, [])

  const createCastingCall = useCallback(
    (projectId: string, title: string, description: string, projectName: string, fields: CastingCallField[], headerImageUrl?: string, talentPoolConsentEnabled?: boolean, talentPoolConsentText?: string): CastingCall => {
      const newCastingCall: CastingCall = {
        id: `cc-${Date.now()}`,
        title,
        description,
        projectName,
        headerImageUrl,
        fields,
        createdAt: new Date(),
        isActive: true,
        shareableLink: `https://gogreenlight.ai/cast/${Math.random().toString(36).substring(2, 8)}`,
        talentPoolConsentEnabled,
        talentPoolConsentText,
      }
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, castingCalls: [...p.castingCalls, newCastingCall] } : p
        ),
        currentProject:
          prev.currentProject?.id === projectId
            ? { ...prev.currentProject, castingCalls: [...prev.currentProject.castingCalls, newCastingCall] }
            : prev.currentProject,
      }))
      return newCastingCall
    },
    []
  )

  const updateCastingCall = useCallback((projectId: string, castingCallId: string, updates: Partial<CastingCall>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              castingCalls: p.castingCalls.map((cc) => (cc.id === castingCallId ? { ...cc, ...updates } : cc)),
            }
          : p
      ),
    }))
  }, [])

  const deleteCastingCall = useCallback((projectId: string, castingCallId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, castingCalls: p.castingCalls.filter((cc) => cc.id !== castingCallId) } : p
      ),
    }))
  }, [])

  const selectCastingCall = useCallback((id: string) => {
    setState((prev) => {
      const castingCall = prev.currentProject?.castingCalls.find((cc) => cc.id === id) || null
      return { ...prev, currentCastingCall: castingCall }
    })
  }, [])

  const addSubmission = useCallback((castingCallId: string, data: Record<string, string | string[]>) => {
    setState((prev) => {
      const project = prev.projects.find((p) => p.castingCalls.some((cc) => cc.id === castingCallId))
      if (!project) return prev

      const castingCall = project.castingCalls.find((cc) => cc.id === castingCallId)
      if (!castingCall) return prev

      // Helper to get string value from data
      const getString = (key: string, altKey?: string): string | undefined => {
        const val = data[key] || (altKey ? data[altKey] : undefined)
        return typeof val === "string" ? val : undefined
      }

      // Helper to get array value from data
      const getArray = (key: string, altKey?: string): string[] | undefined => {
        const val = data[key] || (altKey ? data[altKey] : undefined)
        return Array.isArray(val) ? val : undefined
      }

      // Extract images - could be in headshot field or image fields
      const headshotImages = getArray("Headshot") || getArray("headshot") || getArray("Photos") || getArray("photos")
      const singleHeadshot = getString("Headshot") || getString("headshot") || getString("Headshot URL")

      // Extract video URLs
      const videoUrls = getArray("Video URL") || getArray("video_url") || getArray("Videos") || getArray("videos") || 
                        getArray("Demo Reel") || getArray("demo_reel")

      const newSubmission: CastingSubmission = {
        id: `sub-${Date.now()}`,
        castingCallId,
        castingCallTitle: castingCall.title,
        data,
        submittedAt: new Date(),
        isNew: true,
        name: getString("name") || getString("Full Name") || "Unknown",
        email: getString("email") || getString("Email") || "",
        phone: getString("phone") || getString("Phone"),
        age: getString("age") || getString("Age"),
        playingAge: getString("playingAge") || getString("Playing Age Range"),
        headshot: singleHeadshot || (headshotImages && headshotImages[0]),
        headshots: headshotImages,
        videoUrls: videoUrls,
        notes: getString("notes") || getString("Additional Notes"),
      }

      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, submissions: [...p.submissions, newSubmission] } : p
        ),
        newSubmissionsCount: prev.newSubmissionsCount + 1,
      }
    })
  }, [])

  const updateSubmission = useCallback((submissionId: string, updates: Partial<CastingSubmission>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => ({
        ...p,
        submissions: p.submissions.map((s) =>
          s.id === submissionId ? { ...s, ...updates } : s
        ),
      })),
    }))
  }, [])

  const deleteSubmission = useCallback((submissionId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => ({
        ...p,
        submissions: p.submissions.filter((s) => s.id !== submissionId),
      })),
    }))
  }, [])

  const markSubmissionsAsRead = useCallback((projectId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? { ...p, submissions: p.submissions.map((s) => ({ ...s, isNew: false })) }
          : p
      ),
      newSubmissionsCount: 0,
    }))
  }, [])

  const getSubmissionsForProject = useCallback(
    (projectId: string): CastingSubmission[] => {
      const project = state.projects.find((p) => p.id === projectId)
      return project?.submissions || []
    },
    [state.projects]
  )

  const getTotalSubmissions = useCallback((): number => {
    return state.projects.reduce((total, p) => total + p.submissions.length, 0)
  }, [state.projects])

  const getNewSubmissionsCount = useCallback((): number => {
    return state.projects.reduce(
      (total, p) => total + p.submissions.filter((s) => s.isNew).length,
      0
    )
  }, [state.projects])

  const createCastingGroup = useCallback((name: string, projectIds: string[], imageUrl?: string): CastingGroup => {
    const newGroup: CastingGroup = {
      id: `group-${Date.now()}`,
      name,
      imageUrl,
      projectIds,
      isExpanded: true,
      createdAt: new Date(),
    }
    setState((prev) => ({
      ...prev,
      castingGroups: [...prev.castingGroups, newGroup],
    }))
    return newGroup
  }, [])

  const updateCastingGroup = useCallback((id: string, updates: Partial<CastingGroup>) => {
    setState((prev) => ({
      ...prev,
      castingGroups: prev.castingGroups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }))
  }, [])

  const deleteCastingGroup = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      castingGroups: prev.castingGroups.filter((g) => g.id !== id),
    }))
  }, [])

  const toggleCastingGroupExpanded = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      castingGroups: prev.castingGroups.map((g) =>
        g.id === id ? { ...g, isExpanded: !g.isExpanded } : g
      ),
    }))
  }, [])

  return (
    <PublicCastingContext.Provider
      value={{
        state,
        createProject,
        selectProject,
        updateProject,
        deleteProject,
        createCastingCall,
        updateCastingCall,
        deleteCastingCall,
        selectCastingCall,
        addSubmission,
        updateSubmission,
        deleteSubmission,
        markSubmissionsAsRead,
        getSubmissionsForProject,
        getTotalSubmissions,
        getNewSubmissionsCount,
        createCastingGroup,
        updateCastingGroup,
        deleteCastingGroup,
        toggleCastingGroupExpanded,
      }}
    >
      {children}
    </PublicCastingContext.Provider>
  )
}

export function usePublicCasting() {
  const context = useContext(PublicCastingContext)
  if (!context) {
    throw new Error("usePublicCasting must be used within a PublicCastingProvider")
  }
  return context
}
