export interface Habit {
  id: number
  name: string
  why: string
  time: string // "08:00"
}

export interface User {
  id: string
  email?: string
  // add more from Supabase if needed
}

export interface DailyCheckins {
  [habitId: number]: boolean
}

export interface ChartData {
  day: string
  completion: number
}