import type { Horse, RoundResult } from './types'

/** How one horse did over the rounds it ran in. */
export interface HorseRecord {
  horseId: Horse['id']
  races: number
  wins: number
  /** Finishes in the first three, wins included. */
  podiums: number
  bestPosition: number
}

const PODIUM_SIZE = 3

/**
 * Sums up a meeting per horse, best first: most wins, then most podiums, then the best
 * single finish. Horses that are level on all three keep the order of their ids, so the
 * ranking is always deterministic.
 */
export function summariseMeeting(results: readonly RoundResult[]): HorseRecord[] {
  const records = new Map<Horse['id'], HorseRecord>()

  for (const { placings } of results) {
    for (const { horseId, position } of placings) {
      const record = records.get(horseId) ?? {
        horseId,
        races: 0,
        wins: 0,
        podiums: 0,
        bestPosition: position,
      }

      records.set(horseId, {
        horseId,
        races: record.races + 1,
        wins: record.wins + (position === 1 ? 1 : 0),
        podiums: record.podiums + (position <= PODIUM_SIZE ? 1 : 0),
        bestPosition: Math.min(record.bestPosition, position),
      })
    }
  }

  return [...records.values()].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.podiums - a.podiums ||
      a.bestPosition - b.bestPosition ||
      a.horseId - b.horseId,
  )
}
