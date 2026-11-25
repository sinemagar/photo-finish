import type { MeetingStatus } from '@/domain'

/** One sentence per meeting status, shown or announced around the track. */
export const STATUS_MESSAGES: Record<MeetingStatus, string> = {
  idle: 'Generate a programme to set up the meeting.',
  ready: 'The field is at the start. Press Start to begin.',
  running: 'The race is on.',
  paused: 'Paused.',
  intermission: 'Round finished. The next round starts shortly.',
  finished: 'The meeting is over.',
}
