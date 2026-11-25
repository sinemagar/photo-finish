import { COURSE, laneOffset, pointOnCourse, type CourseShape } from './course'

/** The camera views the player can choose between. */
export type CameraMode = 'tv' | 'chase' | 'aerial'

export const CAMERA_MODES: readonly CameraMode[] = ['tv', 'chase', 'aerial']

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface CameraPose {
  position: Vec3
  target: Vec3
}

/** What the cameras need to know about the field at a given moment. */
export interface FieldView {
  /** Arc length of the leading horse, or null when no horse is on the course. */
  leaderArc: number | null
  /** Average arc length of the field, or null when no horse is on the course. */
  centreArc: number | null
  /** Metres the leader still has to run; null when unknown. */
  leaderMetresToGo: number | null
  /** Whether the round has begun; before that the field waits at the start. */
  started: boolean
  /** Whether every horse has crossed the line. */
  finished: boolean
  /** Width over height of the picture. */
  aspect: number
  /** Vertical field of view in degrees. */
  fov: number
}

/** One horse as the cameras see it. */
export interface FieldEntry {
  /** Unwrapped arc length, as given by `raceArc`. */
  arc: number
  /** Metres still to run; 0 once finished. */
  metresToGo: number
  finished: boolean
  /** Share of the distance covered, from 0 to 1. */
  progress: number
}

/**
 * Sums the field up for the cameras: where the leader and the middle of the field are,
 * how far the leader still has to go, and whether the round has begun or ended.
 * Arcs must be unwrapped, otherwise a field passing the lap start would average out to a
 * point on the far side of the course.
 */
export function describeField(
  entries: readonly FieldEntry[],
  shape: CourseShape = COURSE,
): Omit<FieldView, 'aspect' | 'fov'> {
  if (entries.length === 0) {
    return {
      leaderArc: null,
      centreArc: null,
      leaderMetresToGo: null,
      started: false,
      finished: false,
    }
  }

  const finished = entries.every((entry) => entry.finished)
  const started = entries.some((entry) => entry.progress > 0)
  if (finished) {
    return {
      leaderArc: shape.finishAt,
      centreArc: shape.finishAt,
      leaderMetresToGo: 0,
      started,
      finished,
    }
  }

  const running = entries.filter((entry) => !entry.finished)
  const leader = running.reduce((best, entry) =>
    entry.metresToGo < best.metresToGo ? entry : best,
  )
  const centreArc = entries.reduce((total, entry) => total + entry.arc, 0) / entries.length

  return {
    leaderArc: leader.arc,
    centreArc,
    leaderMetresToGo: leader.metresToGo,
    started,
    finished,
  }
}

/** In the TV view, the camera cuts to the finish line for the last metres of a round. */
export const PHOTO_FINISH_METRES = 90

const LANES = 10
const MIDDLE_OFFSET = laneOffset((LANES + 1) / 2)
const OUTER_EDGE = laneOffset(LANES) + COURSE.laneWidth

const at = (arc: number, offset: number, height: number, shape: CourseShape): Vec3 => {
  const point = pointOnCourse(arc, offset, shape)
  return { x: point.x, y: height, z: point.z }
}

/** The whole oval from above, framed to fit the picture; used before any horse is out. */
export function overheadPose(aspect: number, fov: number, shape: CourseShape = COURSE): CameraPose {
  const halfWidth = shape.straight / 2 + shape.radius + OUTER_EDGE + 12
  const halfDepth = shape.radius + OUTER_EDGE + 12
  const tan = Math.tan(((fov / 2) * Math.PI) / 180)
  const height = Math.max(halfDepth / tan, halfWidth / (tan * aspect)) * 1.02

  return { position: { x: 0, y: height, z: height * 0.32 }, target: { x: 0, y: 0, z: 0 } }
}

/** Side-on across the finish line, as a photo-finish camera would see it. */
export function finishPose(shape: CourseShape = COURSE): CameraPose {
  return {
    position: at(shape.finishAt + 1, OUTER_EDGE + 9, 2.6, shape),
    target: at(shape.finishAt - 1, MIDDLE_OFFSET, 1.1, shape),
  }
}

/** Three-quarters from the front of the field lined up at the start. */
export function startPose(arc: number, shape: CourseShape = COURSE): CameraPose {
  return {
    position: at(arc + 13, OUTER_EDGE + 7, 3.4, shape),
    target: at(arc - 1, MIDDLE_OFFSET, 1, shape),
  }
}

/** The field pulling up after the line, seen from outside the course. */
export function pulledUpPose(shape: CourseShape = COURSE): CameraPose {
  return {
    position: at(shape.finishAt + 6, OUTER_EDGE + 14, 4.5, shape),
    target: at(shape.finishAt + 16, MIDDLE_OFFSET, 1, shape),
  }
}

/**
 * The whole course from high above the home straight, used while no horse is out: an
 * inviting view of the racecourse behind the welcome card.
 */
export function standPose(shape: CourseShape = COURSE): CameraPose {
  return {
    // From beyond the back straight, so the grandstand faces the camera across the course.
    position: { x: 0, y: shape.radius * 1.3, z: -(shape.radius + 170) },
    target: { x: 0, y: 0, z: shape.radius * 0.2 },
  }
}

/** Where a camera should be for the chosen view, given the field. */
export function cameraPose(
  mode: CameraMode,
  field: FieldView,
  shape: CourseShape = COURSE,
): CameraPose {
  if (field.leaderArc === null || field.centreArc === null) {
    return mode === 'aerial' ? overheadPose(field.aspect, field.fov, shape) : standPose(shape)
  }

  if (mode === 'aerial') {
    // A drone high above the outside rail, looking down on the leading group at an angle.
    const focus = field.finished
      ? shape.finishAt + 12
      : Math.max(field.centreArc, field.leaderArc - 10)
    return {
      position: at(focus - 22, OUTER_EDGE + 16, 30, shape),
      target: at(focus + 6, MIDDLE_OFFSET, 0, shape),
    }
  }

  if (mode === 'chase') {
    // Just behind the leading group: in a long round the back markers can be far behind.
    const focus = Math.max(field.centreArc, field.leaderArc - 12)
    return {
      position: at(focus - 16, MIDDLE_OFFSET, 5.5, shape),
      target: at(focus + 14, MIDDLE_OFFSET, 1, shape),
    }
  }

  if (field.finished) return pulledUpPose(shape)
  if (!field.started) return startPose(field.leaderArc, shape)

  if (field.leaderMetresToGo !== null && field.leaderMetresToGo <= PHOTO_FINISH_METRES) {
    return finishPose(shape)
  }

  // TV: a camera on a rail outside the course, keeping pace with the leaders.
  const focus = field.leaderArc - 4
  return {
    position: at(focus - 3, OUTER_EDGE + 11, 4, shape),
    target: at(focus + 2, MIDDLE_OFFSET, 1.1, shape),
  }
}
