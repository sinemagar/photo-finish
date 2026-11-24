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
        expect(runner.finished).toBe(false)
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
      expect(meeting.trackRunners.every((runner) => runner.finished)).toBe(true)
      expect(meeting.trackRunners.every((runner) => runner.progress === 1)).toBe(true)
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
      expect(meeting.trackRunners).toEqual([])
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
