import { PerspectiveCamera, Timer, Scene, SRGBColorSpace, Vector3, WebGLRenderer } from 'three'

import type { TrackRunner } from '@/stores/meeting'

import { cameraPose, type CameraMode, type CameraPose, type FieldView } from './cameras'
import { COURSE, arcForRunner, laneOffset, pointOnCourse } from './course'
import { buildEnvironment, createShadowTexture } from './environment'
import {
  createHorseRunner,
  disposeHorseRunner,
  loadHorseTemplate,
  type HorseRunner,
  type HorseTemplate,
} from './horses'

/** Everything the scene needs to draw one moment of the meeting. */
export interface FieldState {
  runners: TrackRunner[]
  /** Distance of the round on the track, in metres. */
  distance: number | null
  /** Whether the race is moving right now. */
  racing: boolean
  /** Playback speed multiplier, used to pace the gallop. */
  speed: number
}

const FOV = 40
/** How far past the line a horse pulls up after finishing, in scene units. */
const RUN_OUT = 8
/** Gap between finishers as they pull up, in scene units. */
const RUN_OUT_GAP = 1.6
/** Speed of the gallop clip at normal playback speed. */
const GALLOP_RATE = 1.3
/** How quickly the camera catches up with where it should be; higher is snappier. */
const CAMERA_STIFFNESS = 2.6
const RIDER_OFFSET = new Vector3(0, 0.08, -0.08)

/**
 * The 3D renderer. It only draws the state it is given: the race itself is simulated by
 * the stores and the domain, exactly as for the 2D track.
 */
export class RaceScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(FOV, 16 / 9, 0.5, 3000)
  private readonly timer = new Timer()
  private readonly shadow = createShadowTexture()
  private readonly runners = new Map<number, HorseRunner>()
  private readonly arcs = new Map<number, number>()
  private readonly lookAt = new Vector3()
  private readonly scratch = new Vector3()

  private field: FieldState = { runners: [], distance: null, racing: false, speed: 1 }
  private mode: CameraMode = 'tv'
  private fieldKey = ''
  private snapCamera = true
  private fog: Scene['fog'] = null

  private constructor(
    canvas: HTMLCanvasElement,
    private readonly template: HorseTemplate,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    buildEnvironment(this.scene)
    this.fog = this.scene.fog
    this.renderer.setAnimationLoop(() => this.frame())
  }

  /** Loads the horse model and starts drawing into the canvas. */
  static async create(canvas: HTMLCanvasElement, modelUrl: string): Promise<RaceScene> {
    const template = await loadHorseTemplate(modelUrl)
    return new RaceScene(canvas, template)
  }

  setField(field: FieldState): void {
    const key = `${field.distance}:${field.runners.map((runner) => `${runner.lane}-${runner.horse.id}`).join(',')}`

    if (key !== this.fieldKey) {
      this.fieldKey = key
      this.replaceRunners(field.runners)
      this.snapCamera = true
    }

    this.field = field
  }

  setCamera(mode: CameraMode): void {
    if (mode === this.mode) return
    this.mode = mode
    this.snapCamera = true
    // Haze helps the low views but would wash out the whole course seen from above.
    this.scene.fog = mode === 'overhead' ? null : this.fog
  }

  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null)
    for (const runner of this.runners.values()) disposeHorseRunner(runner)
    this.scene.traverse((object) => {
      const mesh = object as { geometry?: { dispose(): void } }
      mesh.geometry?.dispose()
    })
    this.shadow.dispose()
    this.renderer.dispose()
  }

  private replaceRunners(runners: TrackRunner[]): void {
    for (const runner of this.runners.values()) {
      this.scene.remove(runner.root)
      disposeHorseRunner(runner)
    }
    this.runners.clear()
    this.arcs.clear()

    for (const runner of runners) {
      const horseRunner = createHorseRunner(this.template, runner.horse, runner.lane, this.shadow)
      this.runners.set(runner.lane, horseRunner)
      this.scene.add(horseRunner.root)
    }
  }

  /** Where a horse should be: on its way, or pulling up past the line in finishing order. */
  private targetArc(runner: TrackRunner, distance: number): number {
    if (runner.position !== null) {
      return COURSE.finishAt + RUN_OUT + (10 - runner.position) * RUN_OUT_GAP
    }
    return arcForRunner(distance, runner.progress * distance)
  }

  private frame(): void {
    this.timer.update()
    const delta = Math.min(this.timer.getDelta(), 0.1)
    const { runners, distance, racing, speed } = this.field
    const smoothing = 1 - Math.exp(-delta * 3)

    let leaderArc: number | null = null
    let leaderToGo: number | null = null
    let arcSum = 0

    for (const runner of runners) {
      const horse = this.runners.get(runner.lane)
      if (!horse || distance === null) continue

      const target = this.targetArc(runner, distance)
      const previous = this.arcs.get(runner.lane)
      // Running horses follow the simulation exactly; finished ones glide to a halt.
      const arc =
        runner.position === null || previous === undefined
          ? target
          : previous + (target - previous) * smoothing
      this.arcs.set(runner.lane, arc)

      const point = pointOnCourse(arc, laneOffset(runner.lane))
      horse.root.position.set(point.x, 0, point.z)
      horse.root.rotation.y = point.heading

      const moving = racing && runner.position === null
      const pullingUp = racing && runner.position !== null && Math.abs(target - arc) > 0.2
      this.setGait(horse, moving || pullingUp, speed)
      horse.mixer.update(delta)
      this.seatRider(horse)
      horse.marker.visible = this.mode === 'overhead'

      const toGo = distance * (1 - runner.progress)
      if (runner.position === null && (leaderToGo === null || toGo < leaderToGo)) {
        leaderToGo = toGo
        leaderArc = arc
      }
      arcSum += arc
    }

    const finishedField = runners.length > 0 && runners.every((runner) => runner.position !== null)
    const view: FieldView = {
      leaderArc: finishedField ? COURSE.finishAt : leaderArc,
      centreArc:
        runners.length > 0 ? (finishedField ? COURSE.finishAt : arcSum / runners.length) : null,
      leaderMetresToGo: finishedField ? 0 : leaderToGo,
      started: runners.some((runner) => runner.progress > 0),
      finished: finishedField,
      aspect: this.camera.aspect,
      fov: FOV,
    }
    this.moveCamera(cameraPose(this.mode, view), delta)

    this.renderer.render(this.scene, this.camera)
  }

  private setGait(horse: HorseRunner, galloping: boolean, speed: number): void {
    if (galloping && !horse.gallop.isRunning()) {
      horse.gallop.reset().play()
      horse.idle.crossFadeTo(horse.gallop, 0.25, false)
    } else if (!galloping && horse.gallop.isRunning() && horse.gallop.getEffectiveWeight() > 0) {
      horse.idle.reset().play()
      horse.gallop.crossFadeTo(horse.idle, 0.4, false)
    }

    // The clip is one stride; faster playback means faster strides, within reason.
    horse.gallop.timeScale = GALLOP_RATE * Math.min(speed, 2.5)
  }

  private seatRider(horse: HorseRunner): void {
    if (!horse.saddleBone) return
    horse.saddleBone.getWorldPosition(this.scratch)
    horse.root.worldToLocal(this.scratch)
    horse.rider.position.copy(this.scratch).add(RIDER_OFFSET)
  }

  private moveCamera(pose: CameraPose, delta: number): void {
    const { position, target } = pose
    const blend = this.snapCamera ? 1 : 1 - Math.exp(-delta * CAMERA_STIFFNESS)
    this.snapCamera = false

    this.camera.position.lerp(this.scratch.set(position.x, position.y, position.z), blend)
    this.lookAt.lerp(this.scratch.set(target.x, target.y, target.z), blend)
    this.camera.lookAt(this.lookAt)
  }
}
