export interface Location {
  id: string
  name: string
  type: "INT" | "EXT"
  timeOfDay: "DAY" | "NIGHT" | "DAWN" | "DUSK"
  description: string
  scoutingNotes: string
}

export interface LocationProject {
  id: string
  name: string
  locations: Location[]
  createdAt: Date
  updatedAt: Date
}
