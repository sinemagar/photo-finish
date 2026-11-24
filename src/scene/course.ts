/**
 * Geometry of the oval racecourse used by the 3D renderer.
 *
 * The course is a "stadium" shape: two straights joined by two half circles. Positions are
 * measured as arc length along the inner rail, starting where the home straight begins and
 * running anticlockwise when seen from above. Everything here is plain maths with no
 * dependency on three.js, so it is unit-tested like the rest of the game logic.
 */
export interface CourseShape {
  /** Length of each straight, in scene units. */
  straight: number
  /** Radius of each bend at the inner rail, in scene units. */
  radius: number
  /** Width of one lane, in scene units. */
  laneWidth: number
  /** Gap between the inner rail and the first lane, in scene units. */
  railGap: number
  /** Arc length, from the start of the home straight, at which the finish line sits. */
  finishAt: number
  /** Scene units per metre of race distance. Below 1, the course is drawn to a smaller scale. */
  unitsPerMetre: number
}

export const COURSE: CourseShape = {
  straight: 160,
  radius: 75,
  laneWidth: 1.9,
  railGap: 1.2,
  finishAt: 120,
  // Drawn at a reduced scale so that horses do not appear to fly at the playback speed.
  unitsPerMetre: 0.28,
}

/** A point on the course, with the direction a horse running there is facing. */
export interface CoursePoint {
  x: number
  z: number
  /** Unit vector of the direction of travel. */
  dirX: number
  dirZ: number
  /** Unit vector pointing away from the infield. */
  outX: number
  outZ: number
  /** Rotation about the vertical axis for a model that faces +z. */
  heading: number
}

/** Length of one lap along the inner rail. */
export function courseLength(shape: CourseShape = COURSE): number {
  return 2 * shape.straight + 2 * Math.PI * shape.radius
}

/** Wraps any arc length into the range [0, lap length). */
export function wrapArc(arc: number, shape: CourseShape = COURSE): number {
  const length = courseLength(shape)
  return ((arc % length) + length) % length
}

/** Lateral offset of the centre of a lane (1-based) from the inner rail. */
export function laneOffset(lane: number, shape: CourseShape = COURSE): number {
  return shape.railGap + (lane - 0.5) * shape.laneWidth
}

/**
 * The point at a given arc length along the inner rail, moved outwards by `offset`.
 *
 * Segments, in running order: the home straight along z = +radius heading +x, the far
 * bend, the back straight along z = -radius heading -x, and the near bend back to the start.
 */
export function pointOnCourse(arc: number, offset = 0, shape: CourseShape = COURSE): CoursePoint {
  const { straight, radius } = shape
  const half = straight / 2
  const bend = Math.PI * radius
  let s = wrapArc(arc, shape)

  let x: number
  let z: number
  let dirX: number
  let dirZ: number
  let outX: number
  let outZ: number

  if (s < straight) {
    x = -half + s
    z = radius
    ;[dirX, dirZ, outX, outZ] = [1, 0, 0, 1]
  } else if ((s -= straight) < bend) {
    const angle = Math.PI / 2 - s / radius
    ;[outX, outZ] = [Math.cos(angle), Math.sin(angle)]
    x = half + radius * outX
    z = radius * outZ
    ;[dirX, dirZ] = [outZ, -outX]
  } else if ((s -= bend) < straight) {
    x = half - s
    z = -radius
    ;[dirX, dirZ, outX, outZ] = [-1, 0, 0, -1]
  } else {
    s -= straight
    const angle = -Math.PI / 2 - s / radius
    ;[outX, outZ] = [Math.cos(angle), Math.sin(angle)]
    x = -half + radius * outX
    z = radius * outZ
    ;[dirX, dirZ] = [outZ, -outX]
  }

  return {
    x: x + outX * offset,
    z: z + outZ * offset,
    dirX,
    dirZ,
    outX,
    outZ,
    heading: Math.atan2(dirX, dirZ),
  }
}

/**
 * Arc length at which a horse stands, given the round distance and the metres it has
 * covered. Every round finishes at the same line, so longer rounds start further back.
 */
export function arcForRunner(
  distance: number,
  covered: number,
  shape: CourseShape = COURSE,
): number {
  return wrapArc(shape.finishAt - (distance - covered) * shape.unitsPerMetre, shape)
}
