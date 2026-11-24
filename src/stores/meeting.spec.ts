import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { PLAYBACK } from '@/config/playback'
import type { MeetingStatus } from '@/domain'

import { useMeetingStore } from './meeting'
import { useSessionStore } from './session'
import { useStableStore } from './stable'

type MeetingStore = ReturnType<typeof useMeetingStore>

const FRAME_MS = 16

/** Ticks frame by frame until the meeting leaves the given status. */
function tickWhile(meeting: MeetingStore, status: MeetingStatus) {
  let frames = 0

  while (meeting.status === status) {
    meeting.tick(FRAME_MS)
    if (++frames > 100_000) throw new Error(`Meeting is stuck in "${status}"`)
  }
}

function finishRound(meeting: MeetingStore) {
  tickWhile(meeting, 'running')
}

function runWholeMeeting(meeting: MeetingStore) {
  meeting.generateProgramme()
  meeting.start()

  while (meeting.status !== 'finished') {
    tickWhile(meeting, meeting.status)
  }
}

function setup(seed = 1) {
  setActivePinia(createPinia())
  // A high speed keeps the tests fast without changing what is simulated.
  useSessionStore().configure({ seed, speed: 40 })

  return useMeetingStore()
}

describe('meeting store', () => {
  let meeting: MeetingStore

  beforeEach(() => {
    meeting = setup()
  })

  describe('idle', () => {
    it('starts with nothing scheduled', () => {
      expect(meeting.status).toBe('idle')
      expect(meeting.programme).toEqual([])
      expect(meeting.results).toEqual([])
      expect(meeting.currentRound).toBeNull()
      expect(meeting.trackRunners).toEqual([])
    })

    it('allows generating but not starting', () => {
      expect(meeting.canGenerate).toBe(true)
      expect(meeting.canToggle).toBe(false)
      expect(meeting.toggleLabel).toBe('Start')
    })

    it('ignores start, pause, resume, toggle and tick', () => {
      meeting.start()
      meeting.pause()
      meeting.resume()
      meeting.toggle()
      meeting.tick(1000)

      expect(meeting.status).toBe('idle')
    })
  })

  describe('generating a programme', () => {
    it('creates six rounds and becomes ready', () => {
      meeting.generateProgramme()

      expect(meeting.status).toBe('ready')
      expect(meeting.programme).toHaveLength(6)
      expect(meeting.currentRound?.number).toBe(1)
      expect(meeting.canToggle).toBe(true)
      expect(meeting.toggleLabel).toBe('Start')
    })

    it('creates the stable when it does not exist yet', () => {
      const stable = useStableStore()
      expect(stable.horses).toHaveLength(0)

      meeting.generateProgramme()

      expect(stable.horses).toHaveLength(20)
    })

    it('keeps an existing stable', () => {
      const stable = useStableStore()
      stable.generate()
      const horses = stable.horses

      meeting.generateProgramme()

      expect(stable.horses).toEqual(horses)
    })

    it('does not move while only ready', () => {
      meeting.generateProgramme()
      meeting.tick(1000)

      expect(meeting.status).toBe('ready')
      expect(meeting.roundState).toBeNull()
    })

    it('lines the first round up on the starting line', () => {
      meeting.generateProgramme()

      expect(meeting.trackRunners.map((runner) => runner.lane)).toEqual(
        meeting.currentRound?.runners.map((runner) => runner.lane),
      )
      expect(meeting.trackRunners.every((runner) => runner.progress === 0)).toBe(true)
      expect(meeting.trackRunners.every((runner) => runner.position === null)).toBe(true)
    })
  })

  describe('running a round', () => {
    beforeEach(() => {
      meeting.generateProgramme()
      meeting.start()
    })

    it('puts ten runners on the starting line', () => {
      expect(meeting.status).toBe('running')
      expect(meeting.toggleLabel).toBe('Pause')
      expect(meeting.trackRunners).toHaveLength(10)
      expect(meeting.trackRunners.every((runner) => runner.progress === 0)).toBe(true)
    })

    it('exposes each runner with its horse and lane', () => {
      const round = meeting.currentRound
      const stable = useStableStore()

      expect(meeting.trackRunners.map((runner) => runner.lane)).toEqual(
        round?.runners.map((runner) => runner.lane),
      )
      expect(meeting.trackRunners.map((runner) => runner.horse)).toEqual(
        round?.runners.map((runner) => stable.getHorse(runner.horseId)),
      )
    })

    it('moves the runners on every tick', () => {
      meeting.tick(FRAME_MS)

      for (const runner of meeting.trackRunners) {
        expect(runner.progress).toBeGreaterThan(0)
        expect(runner.progress).toBeLessThan(1)
        expect(runner.position).toBeNull()
      }
    })

    it('scales the simulated time with the session speed', () => {
      meeting.tick(FRAME_MS)
      const fast = meeting.roundState?.elapsed ?? 0

      const slow = setup()
      useSessionStore().configure({ seed: 1, speed: 1 })
      slow.generateProgramme()
      slow.start()
      slow.tick(FRAME_MS * 40)

      expect(fast).toBeGreaterThan(0)
      expect(slow.roundState?.elapsed).toBeCloseTo(fast)
    })

    it('hands out positions in the order the runners cross the line', () => {
      while (meeting.trackRunners.every((runner) => runner.position === null)) {
        meeting.tick(1)
      }

      const finished = meeting.trackRunners.filter((runner) => runner.position !== null)

      expect(meeting.status).toBe('running')
      expect(finished.map((runner) => runner.position).sort()).toEqual(
        finished.map((_, index) => index + 1),
      )
      expect(finished.every((runner) => runner.progress === 1)).toBe(true)
    })

    it('blocks generating a new programme', () => {
      const programme = meeting.programme

      expect(meeting.canGenerate).toBe(false)
      meeting.generateProgramme()

      expect(meeting.programme).toBe(programme)
      expect(meeting.status).toBe('running')
    })

    it('ignores a second start', () => {
      meeting.tick(FRAME_MS)
      const state = meeting.roundState

      meeting.start()

      expect(meeting.roundState).toBe(state)
    })

    it('ignores zero and negative time', () => {
      const state = meeting.roundState

      meeting.tick(0)
      meeting.tick(-50)

      expect(meeting.roundState).toBe(state)
    })
  })

  describe('pausing', () => {
    beforeEach(() => {
      meeting.generateProgramme()
      meeting.start()
      meeting.tick(FRAME_MS)
    })

    it('freezes every runner until resumed', () => {
      meeting.pause()
      const frozen = meeting.trackRunners.map((runner) => runner.progress)

      meeting.tick(5000)

      expect(meeting.status).toBe('paused')
      expect(meeting.toggleLabel).toBe('Resume')
      expect(meeting.trackRunners.map((runner) => runner.progress)).toEqual(frozen)

      meeting.resume()
      meeting.tick(FRAME_MS)

      expect(meeting.status).toBe('running')
      meeting.trackRunners.forEach((runner, index) => {
        expect(runner.progress).toBeGreaterThan(frozen[index] ?? 0)
      })
    })

    it('toggles between running and paused', () => {
      meeting.toggle()
      expect(meeting.status).toBe('paused')

      meeting.toggle()
      expect(meeting.status).toBe('running')
    })

    it('does not change the outcome of the round', () => {
      meeting.pause()
      meeting.tick(5000)
      meeting.resume()
      finishRound(meeting)
      const withPause = meeting.results[0]

      const uninterrupted = setup()
      uninterrupted.generateProgramme()
      uninterrupted.start()
      finishRound(uninterrupted)

      expect(withPause).toEqual(uninterrupted.results[0])
    })

    it('allows replacing the programme, which resets the meeting', () => {
      meeting.pause()
      expect(meeting.canGenerate).toBe(true)

      meeting.generateProgramme()

      expect(meeting.status).toBe('ready')
      expect(meeting.roundState).toBeNull()
      expect(meeting.currentRoundIndex).toBe(0)
    })

    it('ignores resume while running and pause while paused', () => {
      meeting.resume()
      expect(meeting.status).toBe('running')

      meeting.pause()
      meeting.pause()
      expect(meeting.status).toBe('paused')
    })
  })

  describe('finishing a round', () => {
    beforeEach(() => {
      meeting.generateProgramme()
      meeting.start()
      finishRound(meeting)
    })

    it('records the result once and enters the intermission', () => {
      expect(meeting.status).toBe('intermission')
      expect(meeting.results).toHaveLength(1)
      expect(meeting.results[0]?.roundNumber).toBe(1)
      expect(meeting.results[0]?.placings).toHaveLength(10)
    })

    it('leaves the runners on the finish line during the intermission', () => {
      expect(meeting.currentRound?.number).toBe(1)
      expect(meeting.trackRunners.every((runner) => runner.progress === 1)).toBe(true)
    })

    it('gives every runner the position it has in the result', () => {
      const placings = meeting.results[0]?.placings ?? []

      for (const runner of meeting.trackRunners) {
        const placing = placings.find((candidate) => candidate.lane === runner.lane)

        expect(runner.position).toBe(placing?.position)
      }
    })

    it('cannot be paused, started or regenerated during the intermission', () => {
      expect(meeting.canToggle).toBe(false)
      expect(meeting.canGenerate).toBe(false)

      meeting.toggle()
      meeting.pause()
      meeting.start()
      meeting.generateProgramme()

      expect(meeting.status).toBe('intermission')
      expect(meeting.results).toHaveLength(1)
    })

    it('starts the next round by itself after the intermission', () => {
      const speed = useSessionStore().speed

      meeting.tick(PLAYBACK.intermissionMs / speed - 1)
      expect(meeting.status).toBe('intermission')

      meeting.tick(1)

      expect(meeting.status).toBe('running')
      expect(meeting.currentRound?.number).toBe(2)
      expect(meeting.trackRunners.every((runner) => runner.progress === 0)).toBe(true)
      expect(meeting.results).toHaveLength(1)
    })
  })

  describe('live standings', () => {
    beforeEach(() => {
      meeting.generateProgramme()
    })

    it('has no ranks before the round is under way', () => {
      expect(meeting.trackRunners.every((runner) => runner.rank === null)).toBe(true)

      meeting.start()
      expect(meeting.trackRunners.every((runner) => runner.rank === null)).toBe(true)
    })

    it('ranks the field from 1 to 10 by distance covered', () => {
      meeting.start()
      meeting.tick(200)

      const byRank = [...meeting.trackRunners].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

      expect(byRank.map((runner) => runner.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      byRank.slice(1).forEach((runner, index) => {
        expect(runner.progress).toBeLessThanOrEqual(byRank[index]?.progress ?? 0)
      })
    })

    it('ends on the finishing positions', () => {
      meeting.start()
      finishRound(meeting)

      for (const runner of meeting.trackRunners) {
        expect(runner.rank).toBe(runner.position)
      }
    })
  })

  describe('between rounds', () => {
    beforeEach(() => {
      meeting.generateProgramme()
      meeting.start()
    })

    it('knows the latest result and the round that comes next', () => {
      expect(meeting.latestResult).toBeNull()
      expect(meeting.nextRound?.number).toBe(2)

      finishRound(meeting)

      expect(meeting.latestResult).toBe(meeting.results[0])
      expect(meeting.nextRound?.number).toBe(2)
    })

    it('counts the break down in whole seconds and only during the break', () => {
      const speed = useSessionStore().speed
      expect(meeting.nextRoundCountdown).toBeNull()

      finishRound(meeting)
      expect(meeting.nextRoundCountdown).toBe(Math.ceil(PLAYBACK.intermissionMs / 1000))

      meeting.tick((PLAYBACK.intermissionMs - 900) / speed)
      expect(meeting.nextRoundCountdown).toBe(1)

      meeting.tick(900 / speed)
      expect(meeting.status).toBe('running')
      expect(meeting.nextRoundCountdown).toBeNull()
    })

    it('has no next round during the last one', () => {
      runWholeMeeting(setup())
      const finished = useMeetingStore()

      expect(finished.nextRound).toBeNull()
    })
  })

  describe('standings', () => {
    it('are empty until a round has finished', () => {
      meeting.generateProgramme()
      meeting.start()

      expect(meeting.standings).toEqual([])
    })

    it('sum up the whole meeting, best first', () => {
      runWholeMeeting(meeting)
      const winners = meeting.results.map((result) => result.placings[0]?.horseId)
      const [leader] = meeting.standings

      expect(leader?.wins).toBeGreaterThanOrEqual(1)
      expect(winners).toContain(leader?.horseId)
      expect(meeting.standings.reduce((total, record) => total + record.wins, 0)).toBe(6)
      expect(meeting.standings.reduce((total, record) => total + record.races, 0)).toBe(60)
    })
  })

  describe('the clock', () => {
    it('runs only during a round or an intermission', () => {
      expect(meeting.isClockRunning).toBe(false)

      meeting.generateProgramme()
      expect(meeting.isClockRunning).toBe(false)

      meeting.start()
      expect(meeting.isClockRunning).toBe(true)

      meeting.pause()
      expect(meeting.isClockRunning).toBe(false)

      meeting.resume()
      finishRound(meeting)
      expect(meeting.status).toBe('intermission')
      expect(meeting.isClockRunning).toBe(true)
    })

    it('stops when the meeting is finished', () => {
      runWholeMeeting(meeting)

      expect(meeting.isClockRunning).toBe(false)
    })
  })

  describe('a whole meeting', () => {
    beforeEach(() => runWholeMeeting(meeting))

    it('finishes after six rounds with one result per round, in order', () => {
      expect(meeting.status).toBe('finished')
      expect(meeting.results.map((result) => result.roundNumber)).toEqual([1, 2, 3, 4, 5, 6])
      expect(meeting.results.map((result) => result.distance)).toEqual(
        meeting.programme.map((round) => round.distance),
      )
    })

    it('ranks exactly the horses that were entered in each round', () => {
      meeting.results.forEach((result, index) => {
        const entered = meeting.programme[index]?.runners.map((runner) => runner.horseId) ?? []

        expect(result.placings.map((placing) => placing.horseId).sort()).toEqual(entered.sort())
      })
    })

    it('stops reacting to time and to the start control', () => {
      const results = meeting.results.length

      meeting.tick(10_000)
      meeting.toggle()
      meeting.start()

      expect(meeting.status).toBe('finished')
      expect(meeting.results).toHaveLength(results)
      expect(meeting.canToggle).toBe(false)
    })

    it('can be followed by a new programme, which clears the results', () => {
      const previous = meeting.programme

      expect(meeting.canGenerate).toBe(true)
      meeting.generateProgramme()

      expect(meeting.status).toBe('ready')
      expect(meeting.results).toEqual([])
      expect(meeting.programme).not.toEqual(previous)
      expect(meeting.trackRunners.every((runner) => runner.progress === 0)).toBe(true)
    })

    it('is reproducible from the seed', () => {
      const replay = setup(1)
      runWholeMeeting(replay)

      expect(replay.results).toEqual(meeting.results)
    })

    it('differs for another seed', () => {
      const other = setup(2)
      runWholeMeeting(other)

      expect(other.results).not.toEqual(meeting.results)
    })
  })
})
