/**
 * How the simulation is played back on screen. These values affect presentation only;
 * the rules of the race live in `@/domain`.
 */
export const PLAYBACK = {
  /** Seconds of race time simulated per second of real time. A 1200 m round takes about 8 s. */
  timeScale: 9,
  /** Real-time pause between two rounds, in milliseconds. */
  intermissionMs: 2500,
} as const
