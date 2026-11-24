export interface HorseColor {
  /** Human-readable name, so colour is never the only way to tell horses apart. */
  name: string
  hex: string
}

export interface Horse {
  id: number
  name: string
  color: HorseColor
  /** Fitness from 1 to 100. A higher value means a higher average speed. */
  condition: number
}

/** A horse entered in a round, with the lane it starts from. */
export interface Runner {
  horseId: Horse['id']
  lane: number
}

export interface Round {
  /** 1-based position of the round within the programme. */
  number: number
  /** Race distance in metres. */
  distance: number
  runners: Runner[]
}

/** Live state of one runner while a round is being simulated. */
export interface RunnerState extends Runner {
  /** Average speed for this round in metres per second, already including form. */
  cruisingSpeed: number
  /** Momentary deviation from the cruising speed, as a fraction of it. */
  surge: number
  /** Metres covered so far, capped at the round distance. */
  covered: number
  /** Race time in seconds at which the runner crossed the line, or null while running. */
  finishTime: number | null
}

export interface RoundState {
  roundNumber: number
  distance: number
  /** Simulated race time in seconds. */
  elapsed: number
  /** Race time received but not yet simulated, always shorter than one step. */
  pending: number
  runners: RunnerState[]
}

export interface Placing {
  position: number
  horseId: Horse['id']
  lane: number
  /** Finish time in race seconds. */
  time: number
}

export interface RoundResult {
  roundNumber: number
  distance: number
  placings: Placing[]
}

export type MeetingStatus = 'idle' | 'ready' | 'running' | 'paused' | 'intermission' | 'finished'
