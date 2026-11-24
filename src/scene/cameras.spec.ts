import { describe, expect, it } from 'vitest'

import {
  PHOTO_FINISH_METRES,
  cameraPose,
  finishPose,
  overheadPose,
  pulledUpPose,
  standPose,
  startPose,
  type FieldView,
} from './cameras'
import { COURSE, pointOnCourse } from './course'

const field = (overrides: Partial<FieldView> = {}): FieldView => ({
  leaderArc: 700,
  centreArc: 690,
  leaderMetresToGo: 500,
  started: true,
  finished: false,
  aspect: 16 / 9,
  fov: 40,
  ...overrides,
})

const horizontal = (a: { x: number; z: number }, b: { x: number; z: number }) =>
  Math.hypot(a.x - b.x, a.z - b.z)

describe('cameraPose', () => {
  it('watches the home straight from the stand while no horse is on the course', () => {
    const empty = field({ leaderArc: null, centreArc: null, leaderMetresToGo: null })

    expect(cameraPose('tv', empty)).toEqual(standPose())
    expect(cameraPose('chase', empty)).toEqual(standPose())
  })

  it('follows the field from outside the course in the TV view', () => {
    const pose = cameraPose('tv', field())
    const leader = pointOnCourse(700)

    expect(horizontal(pose.position, leader)).toBeLessThan(40)
    expect(Math.hypot(pose.position.x, pose.position.z)).toBeGreaterThan(
      Math.hypot(leader.x, leader.z),
    )
    expect(pose.position.y).toBeGreaterThan(pose.target.y)
  })

  it('cuts to the finish line for the last metres in the TV view', () => {
    expect(cameraPose('tv', field({ leaderMetresToGo: PHOTO_FINISH_METRES }))).toEqual(finishPose())
    expect(cameraPose('tv', field({ leaderMetresToGo: PHOTO_FINISH_METRES + 1 }))).not.toEqual(
      finishPose(),
    )
  })

  it('frames the field at the start before the round begins', () => {
    expect(cameraPose('tv', field({ started: false }))).toEqual(startPose(700))
  })

  it('shows the field pulling up once every horse has finished', () => {
    expect(cameraPose('tv', field({ finished: true, leaderMetresToGo: 0 }))).toEqual(pulledUpPose())
  })

  it('stays behind the field in the chase view, finish or not', () => {
    const pose = cameraPose('chase', field({ leaderMetresToGo: 10 }))
    const behind = pointOnCourse(700 - 12 - 16)

    expect(horizontal(pose.position, behind)).toBeLessThan(15)
    expect(pose).not.toEqual(finishPose())
  })

  it('keeps up with the leaders in the chase view when the field is strung out', () => {
    const pose = cameraPose('chase', field({ leaderArc: 700, centreArc: 600 }))

    expect(horizontal(pose.position, pointOnCourse(700 - 12 - 16))).toBeLessThan(15)
  })

  it('shows the whole oval from above in the aerial view before any horse is out', () => {
    const empty = field({ leaderArc: null, centreArc: null, leaderMetresToGo: null })

    expect(cameraPose('aerial', empty)).toEqual(overheadPose(16 / 9, 40))
  })

  it('looks down on the leaders at an angle in the aerial view', () => {
    const pose = cameraPose('aerial', field())
    const leaders = pointOnCourse(690)
    const drop = pose.position.y - pose.target.y
    const across = horizontal(pose.position, pose.target)

    expect(horizontal(pose.target, leaders)).toBeLessThan(25)
    // Neither flat nor straight down: somewhere between 30 and 60 degrees.
    expect(Math.atan2(drop, across)).toBeGreaterThan(Math.PI / 6)
    expect(Math.atan2(drop, across)).toBeLessThan(Math.PI / 3)
  })
})

describe('overheadPose', () => {
  it('rises higher for a narrow picture so that the whole oval still fits', () => {
    expect(overheadPose(0.8, 40).position.y).toBeGreaterThan(overheadPose(2, 40).position.y)
  })
})

describe('finishPose', () => {
  it('looks across the finish line from outside the course', () => {
    const pose = finishPose()
    const finish = pointOnCourse(COURSE.finishAt)

    expect(pose.position.z).toBeGreaterThan(finish.z)
    expect(Math.abs(pose.target.x - finish.x)).toBeLessThan(2)
  })
})
