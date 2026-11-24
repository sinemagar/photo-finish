import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { PLAYBACK } from '@/config/playback'
import {
  advanceRound,
  createProgramme,
  createRoundState,
  getRoundResult,
  isRoundFinished,
  runnerProgress,
  type Horse,
  type MeetingStatus,
  type Round,
  type RoundResult,
  type RoundState,
} from '@/domain'

import { useSessionStore } from './session'
import { useStableStore } from './stable'

/** A runner as the track needs it: who it is, where it is and how it finished. */
export interface TrackRunner {
  lane: number
  horse: Horse
  /** Share of the distance covered, from 0 to 1. */
  progress: number
  /** Finishing position, or null while the runner is still on its way. */
  position: number | null
}

export type ToggleLabel = 'Start' | 'Pause' | 'Resume'

/**
 * Runs a race meeting as a state machine (see PRD §5.1):
 *
 *   idle → ready → running ⇄ paused
 *                  running → intermission → running → … → finished
 *
 * The store only orchestrates. Every rule is delegated to `@/domain`, and time enters
 * exclusively through `tick`, so the whole meeting can be driven from a test.
 */
export const useMeetingStore = defineStore('meeting', () => {
  const session = useSessionStore()
  const stable = useStableStore()

  const status = ref<MeetingStatus>('idle')
  const programme = shallowRef<Round[]>([])
  const currentRoundIndex = ref(0)
  // Replaced wholesale on every tick, so shallow reactivity is all it needs.
  const roundState = shallowRef<RoundState | null>(null)
  const results = ref<RoundResult[]>([])
  const intermissionRemaining = ref(0)

  const currentRound = computed<Round | null>(() =>
    status.value === 'idle' ? null : (programme.value[currentRoundIndex.value] ?? null),
  )

  const isLastRound = computed(() => currentRoundIndex.value >= programme.value.length - 1)

  /** A new programme may replace the current one unless a race is in progress. */
  const canGenerate = computed(() => status.value !== 'running' && status.value !== 'intermission')

  const canToggle = computed(
    () => status.value === 'ready' || status.value === 'running' || status.value === 'paused',
  )

  const toggleLabel = computed<ToggleLabel>(() => {
    if (status.value === 'running' || status.value === 'intermission') return 'Pause'
    if (status.value === 'paused') return 'Resume'
    return 'Start'
  })

  /** True while time should flow: a round is being run or an intermission is counting down. */
  const isClockRunning = computed(
    () => status.value === 'running' || status.value === 'intermission',
  )

  /**
   * The field as the track should draw it. Before the start it is the upcoming round lined
   * up on the starting line; afterwards it follows the live round state.
   */
  const trackRunners = computed<TrackRunner[]>(() => {
    const state = roundState.value
    const entries = state?.runners ?? currentRound.value?.runners ?? []

    const finishOrder = (state?.runners ?? [])
      .filter((runner) => runner.finishTime !== null)
      .sort((a, b) => (a.finishTime ?? 0) - (b.finishTime ?? 0) || a.lane - b.lane)
      .map((runner) => runner.lane)

    return entries.flatMap((entry) => {
      const horse = stable.getHorse(entry.horseId)
      if (!horse) return []

      const live = state?.runners.find((runner) => runner.lane === entry.lane)
      const finishIndex = finishOrder.indexOf(entry.lane)

      return [
        {
          lane: entry.lane,
          horse,
          progress: state && live ? runnerProgress(state, live) : 0,
          position: finishIndex === -1 ? null : finishIndex + 1,
        },
      ]
    })
  })

  function beginRound(index: number) {
    const round = programme.value[index]
    if (!round) return

    currentRoundIndex.value = index
    roundState.value = createRoundState(round, stable.horses, session.random)
    status.value = 'running'
  }

  function completeCurrentRound(state: RoundState) {
    results.value.push(getRoundResult(state))

    if (isLastRound.value) {
      status.value = 'finished'
      return
    }

    intermissionRemaining.value = PLAYBACK.intermissionMs
    status.value = 'intermission'
  }

  function generateProgramme() {
    if (!canGenerate.value) return
    if (stable.horses.length === 0) stable.generate()

    programme.value = createProgramme(stable.horses, session.random)
    currentRoundIndex.value = 0
    roundState.value = null
    results.value = []
    intermissionRemaining.value = 0
    status.value = 'ready'
  }

  function start() {
    if (status.value === 'ready') beginRound(0)
  }

  function pause() {
    if (status.value === 'running') status.value = 'paused'
  }

  function resume() {
    if (status.value === 'paused') status.value = 'running'
  }

  /** Single entry point for the Start / Pause / Resume control. */
  function toggle() {
    if (status.value === 'ready') start()
    else if (status.value === 'running') pause()
    else if (status.value === 'paused') resume()
  }

  /**
   * Moves the meeting forward by `elapsedMs` of real time. Does nothing unless a round is
   * running or an intermission is counting down.
   */
  function tick(elapsedMs: number) {
    if (elapsedMs <= 0) return

    if (status.value === 'running' && roundState.value) {
      const raceSeconds = (elapsedMs / 1000) * PLAYBACK.timeScale * session.speed
      const next = advanceRound(roundState.value, raceSeconds, session.random)

      roundState.value = next
      if (isRoundFinished(next)) completeCurrentRound(next)
      return
    }

    if (status.value === 'intermission') {
      intermissionRemaining.value -= elapsedMs * session.speed
      if (intermissionRemaining.value <= 0) {
        intermissionRemaining.value = 0
        beginRound(currentRoundIndex.value + 1)
      }
    }
  }

  return {
    status,
    programme,
    currentRoundIndex,
    roundState,
    results,
    currentRound,
    canGenerate,
    canToggle,
    toggleLabel,
    isClockRunning,
    trackRunners,
    generateProgramme,
    start,
    pause,
    resume,
    toggle,
    tick,
  }
})
