import { describe, expect, it } from 'vitest'

import { ROUND_DISTANCES } from '@/domain'

import { COURSE, arcForRunner, courseLength, laneOffset, pointOnCourse, wrapArc } from './course'

const distanceBetween = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z)

describe('the oval course', () => {
  const length = courseLength()

  it('is two straights and two half circles long', () => {
    expect(length).toBeCloseTo(2 * COURSE.straight + 2 * Math.PI * COURSE.radius)
  })

  it('is long enough for the longest round to be run without passing the finish twice', () => {
    const longest = Math.max(...ROUND_DISTANCES)

    expect(longest * COURSE.unitsPerMetre).toBeLessThan(length)
  })

  it('wraps arc lengths into a single lap', () => {
    expect(wrapArc(length + 10)).toBeCloseTo(10)
    expect(wrapArc(-10)).toBeCloseTo(length - 10)
  })

  it('is a closed, continuous loop', () => {
    const steps = 2000
    const stepLength = length / steps
    let previous = pointOnCourse(0)

    for (let step = 1; step <= steps; step++) {
      const point = pointOnCourse(step * stepLength)

      expect(distanceBetween(point, previous)).toBeCloseTo(stepLength, 5)
      previous = point
    }
  })

  it('always faces along the rail and has a unit outward vector at right angles to it', () => {
    for (let arc = 0; arc < length; arc += 37) {
      const point = pointOnCourse(arc)

      expect(Math.hypot(point.dirX, point.dirZ)).toBeCloseTo(1)
      expect(Math.hypot(point.outX, point.outZ)).toBeCloseTo(1)
      expect(point.dirX * point.outX + point.dirZ * point.outZ).toBeCloseTo(0)
      // The infield is on the same side of the horses all the way round.
      expect(point.dirX * point.outZ - point.dirZ * point.outX).toBeCloseTo(1)
    }
  })

  it('moves a point away from the infield by the offset it is given', () => {
    for (let arc = 0; arc < length; arc += 53) {
      const rail = pointOnCourse(arc)
      const outside = pointOnCourse(arc, 4)

      expect(distanceBetween(rail, outside)).toBeCloseTo(4)
      expect(Math.hypot(outside.x, outside.z)).toBeGreaterThan(Math.hypot(rail.x, rail.z))
    }
  })

  it('puts the finish line on the home straight', () => {
    const finish = pointOnCourse(COURSE.finishAt)

    expect(finish.z).toBeCloseTo(COURSE.radius)
    expect(finish.dirX).toBe(1)
  })
})

describe('laneOffset', () => {
  it('places lanes side by side outwards from the rail', () => {
    expect(laneOffset(2) - laneOffset(1)).toBeCloseTo(COURSE.laneWidth)
    expect(laneOffset(1)).toBeGreaterThan(COURSE.railGap)
  })
})

describe('arcForRunner', () => {
  it('starts every round at the right distance before the finish line', () => {
    for (const distance of ROUND_DISTANCES) {
      const start = arcForRunner(distance, 0)
      const ahead = wrapArc(COURSE.finishAt - start)

      expect(ahead).toBeCloseTo(distance * COURSE.unitsPerMetre)
    }
  })

  it('reaches the finish line exactly when the distance is covered', () => {
    expect(arcForRunner(1600, 1600)).toBeCloseTo(COURSE.finishAt)
  })

  it('moves forwards as the horse covers ground', () => {
    const early = arcForRunner(1200, 100)
    const later = arcForRunner(1200, 700)

    expect(wrapArc(later - early)).toBeCloseTo(600 * COURSE.unitsPerMetre)
  })
})
