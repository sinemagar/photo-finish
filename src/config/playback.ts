/**
 * How the simulation is played back on screen. These values affect presentation only;
 * the rules of the race live in `@/domain`.
 */
export const PLAYBACK = {
  /**
   * Seconds of race time simulated per second of real time. A 1200 m round takes about
   * 15 s and a 2200 m round about 27 s; fast enough to watch, slow enough to look like a race.
   */
  timeScale: 5,
  /** Real-time pause between two rounds, in milliseconds. */
  intermissionMs: 2500,
} as const
