export interface Actor {
  id: string
  name: string
  age: number
  playingAge: string
  phone: string
  email: string
  headshotUrl: string
  notes: string
}

export interface ActorListProject {
  id: string
  name: string
  actors: Actor[]
  createdAt: Date
  updatedAt: Date
}
