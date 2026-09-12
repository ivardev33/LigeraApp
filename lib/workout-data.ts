export type RoutineExercise = {
  name: string
  sets: number
  repsMin: number
  repsMax: number
  rir: string
  note: string
  bodyweight?: boolean
  restSeconds: number
}

export type RoutineDay = {
  id: string
  title: string
  exercises: RoutineExercise[]
}

export const exerciseOptions = [
  'Press de Banca',
  'Remo Apoyado en Pecho',
  'Press Militar',
  'Dominadas Lastradas',
  'Cruces de Polea Alta a Baja',
  'Sentadilla Trasera',
  'Peso Muerto Rumano',
  'Prensa de Piernas 45°',
  'Curl Femoral Tumbado',
  'Gemelos de Pie en Máquina',
  'Press Inclinado con Mancuernas',
  'Fondos en Paralelas',
  'Press de Hombros Sentado',
  'Elevaciones Laterales en Polea',
  'Extensiones de Tríceps en Polea Alta',
  'Jalón al Pecho',
  'Remo con Mancuerna a Una Mano',
  'Face Pulls en Polea',
  'Curl de Bíceps Inclinado',
  'Curl Martillo',
  'Zancadas Búlgaras',
  'Curl Femoral Sentado',
  'Extensiones de Cuádriceps',
  'Gemelos Sentado',
  'Rueda Abdominal',
]

export const routineDays: RoutineDay[] = [
  {
    id: 'day-1',
    title: 'Día 1 · Torso Fuerza',
    exercises: [
      {
        name: 'Press de Banca',
        sets: 4,
        repsMin: 5,
        repsMax: 7,
        rir: '1.5–2',
        note: 'Controlar la fase excéntrica de manera estricta.',
        restSeconds: 180,
      },
      {
        name: 'Remo Apoyado en Pecho',
        sets: 4,
        repsMin: 6,
        repsMax: 8,
        rir: '1–2',
        note: 'Máxima tracción sin balanceo de la zona lumbar.',
        restSeconds: 120,
      },
      {
        name: 'Press Militar',
        sets: 3,
        repsMin: 6,
        repsMax: 8,
        rir: '2',
        note: 'Bloqueo completo de glúteos y core para estabilidad.',
        restSeconds: 180,
      },
      {
        name: 'Dominadas Lastradas',
        sets: 3,
        repsMin: 6,
        repsMax: 8,
        rir: '1–2',
        note: 'Agarre prono o neutro.',
        restSeconds: 120,
      },
      {
        name: 'Cruces de Polea Alta a Baja',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'Aislamiento pectoral, enfoque en el bombeo inferior/media.',
        restSeconds: 60,
      },
    ],
  },
  {
    id: 'day-2',
    title: 'Día 2 · Pierna Fuerza',
    exercises: [
      {
        name: 'Sentadilla Trasera',
        sets: 4,
        repsMin: 6,
        repsMax: 8,
        rir: '2',
        note: 'Romper la paralela (más de 90° de flexión).',
        restSeconds: 180,
      },
      {
        name: 'Peso Muerto Rumano',
        sets: 4,
        repsMin: 6,
        repsMax: 8,
        rir: '1.5',
        note: 'Bisagra de cadera pura, máximo estiramiento femoral.',
        restSeconds: 180,
      },
      {
        name: 'Prensa de Piernas 45°',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'Enfoque cuádriceps, pies media-baja en la plataforma.',
        restSeconds: 120,
      },
      {
        name: 'Curl Femoral Tumbado',
        sets: 3,
        repsMin: 8,
        repsMax: 10,
        rir: '1',
        note: 'Aislamiento de cadena posterior.',
        restSeconds: 90,
      },
      {
        name: 'Gemelos de Pie en Máquina',
        sets: 4,
        repsMin: 10,
        repsMax: 12,
        rir: '0',
        note: 'Negativa lenta de 3 segundos',
        restSeconds: 60,
      },
    ],
  },
  {
    id: 'day-3',
    title: 'Día 3 · Empuje (Push)',
    exercises: [
      {
        name: 'Press Inclinado con Mancuernas',
        sets: 4,
        repsMin: 8,
        repsMax: 10,
        rir: '1',
        note: 'Inclinación ideal a ~30°.',
        restSeconds: 120,
      },
      {
        name: 'Fondos en Paralelas',
        sets: 3,
        repsMin: 8,
        repsMax: 10,
        rir: '1',
        note: 'Lastrados si es necesario.',
        bodyweight: true,
        restSeconds: 120,
      },
      {
        name: 'Press de Hombros Sentado',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'Con mancuernas.',
        restSeconds: 120,
      },
      {
        name: 'Elevaciones Laterales en Polea',
        sets: 4,
        repsMin: 12,
        repsMax: 15,
        rir: '0',
        note: 'Separar la cuerda al final de la extensión.',
        restSeconds: 60,
      },
      {
        name: 'Extensiones de Tríceps en Polea Alta',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '0',
        note: 'En polea alta con cuerda, terminar al fallo.',
        restSeconds: 60,
      },
    ],
  },
  {
    id: 'day-4',
    title: 'Día 4 · Tirón (Pull)',
    exercises: [
      {
        name: 'Jalón al Pecho',
        sets: 4,
        repsMin: 8,
        repsMax: 10,
        rir: '1',
        note: 'Llevar los codos hacia la cadera.',
        restSeconds: 120,
      },
      {
        name: 'Remo con Mancuerna a Una Mano',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'A una mano apoyado.',
        restSeconds: 90,
      },
      {
        name: 'Face Pulls en Polea',
        sets: 3,
        repsMin: 12,
        repsMax: 12,
        rir: '1',
        note: 'Llevar la cuerda hacia los ojos, salud del manguito.',
        restSeconds: 60,
      },
      {
        name: 'Curl de Bíceps Inclinado',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'Sentado en banco inclinado.',
        restSeconds: 60,
      },
      {
        name: 'Curl Martillo',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'Con mancuernas, alterno.',
        restSeconds: 60,
      },
    ],
  },
  {
    id: 'day-5',
    title: 'Día 5 · Pierna Volumen',
    exercises: [
      {
        name: 'Zancadas Búlgaras',
        sets: 3,
        repsMin: 10,
        repsMax: 12,
        rir: '1',
        note: 'Con mancuernas, trabajo unilateral brutal.',
        restSeconds: 120,
      },
      {
        name: 'Curl Femoral Sentado',
        sets: 4,
        repsMin: 10,
        repsMax: 12,
        rir: '0',
        note: 'Mayor rango de estiramiento que tumbado.',
        restSeconds: 90,
      },
      {
        name: 'Extensiones de Cuádriceps',
        sets: 4,
        repsMin: 15,
        repsMax: 15,
        rir: '0',
        note: 'Pausa isométrica de 1 segundo en la contracción.',
        restSeconds: 60,
      },
      {
        name: 'Gemelos Sentado',
        sets: 3,
        repsMin: 15,
        repsMax: 15,
        rir: '0',
        note: 'Enfoque en el sóleo.',
        restSeconds: 60,
      },
      {
        name: 'Rueda Abdominal',
        sets: 3,
        repsMin: 12,
        repsMax: 12,
        rir: '0',
        note: 'Movimiento controlado sin rebotar.',
        bodyweight: true,
        restSeconds: 60,
      },
    ],
  },
]

export type DraftSet = {
  id: string
  kg: number
  reps: number
  done: boolean
  rir?: number | null
}

export type DraftExercise = {
  id: string
  name: string
  target?: string
  nextKg?: number
  sets: DraftSet[]
}

function repsText(ex: RoutineExercise): string {
  return ex.repsMax > ex.repsMin ? `${ex.repsMin}–${ex.repsMax}` : `${ex.repsMin}`
}

export function targetText(ex: RoutineExercise): string {
  return `${ex.sets} × ${repsText(ex)} · RIR ${ex.rir}`
}

export function restSecondsFor(name: string): number {
  for (const day of routineDays) {
    const ex = day.exercises.find((e) => e.name === name)
    if (ex) return ex.restSeconds
  }
  return 85
}