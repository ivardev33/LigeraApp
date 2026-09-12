export const exerciseOptions = [
  'Barbell Squat',
  'Barbell Bench Press',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
]

export type DraftSet = {
  id: string
  kg: number
  reps: number
  done: boolean
}

export type DraftExercise = {
  id: string
  name: string
  sets: DraftSet[]
}