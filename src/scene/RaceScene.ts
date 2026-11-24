import { PerspectiveCamera, Scene, SRGBColorSpace, Timer, Vector3, WebGLRenderer } from 'three'

import type { TrackRunner } from '@/stores/meeting'

import {
  cameraPose,
  describeField,
  type CameraMode,
  type CameraPose,
  type FieldEntry,
  type FieldView,
} from './cameras'
import { laneOffset, pointOnCourse, raceArc } from './course'
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
  /** Whether the meeting is paused, which freezes every horse where it stands. */
  paused: boolean
}

const FOV = 40
/** Distance in which a horse comes to a halt after the line, in scene units. */
const PULL_UP_DISTANCE = 16
/** Ground covered by one gallop stride, in scene units; sets how fast the legs move. */
const GALLOP_STRIDE = 7.3
/** Length of the gallop clip in seconds. */
const GALLOP_CLIP = 0.583
/** Ground covered by one walking stride, in scene units. */
const WALK_STRIDE = 1.4
/** Speeds, in scene units per second, between which the gait changes. */
const WALK_SPEED = 0.6
const GALLOP_SPEED = 6
/** Fastest the legs may move, as a multiple of the clip's own speed. */
const MAX_LEG_RATE = 3
/** How quickly the camera catches up with where it should be; higher is snappier. */
const CAMERA_STIFFNESS = 2.6
/** From the bone under the saddle to the top of the saddle, in the horse's own space. */
const SEAT_OFFSET = new Vector3(0, 0.32, 0.1)

/** How one horse is moving, carried from frame to frame. */
interface Motion {
  arc: number
  /** Ground speed in scene units per second. */
  speed: number
  /** Deceleration used to pull up after the line, fixed when the horse finishes. */
  braking: number | null
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/**
 * The 3D renderer. It only draws the state it is given: the race itself is simulated by
 * the stores and the domain, exactly as for the 2D track.
 */
export class RaceScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(FOV, 16 / 9, 0.3, 2500)
  private readonly timer = new Timer()
  private readonly shadow = createShadowTexture()
  private readonly runners = new Map<number, HorseRunner>()
  private readonly motion = new Map<number, Motion>()
  private readonly lookAt = new Vector3()
  private readonly scratch = new Vector3()

  private field: FieldState = { runners: [], distance: null, paused: false }
  private mode: CameraMode = 'tv'
  private fieldKey = ''
  private snapCamera = true

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
    this.motion.clear()

    for (const runner of runners) {
      const horseRunner = createHorseRunner(this.template, runner.horse, runner.lane, this.shadow)
      this.runners.set(runner.lane, horseRunner)
      this.scene.add(horseRunner.root)
    }
  }

  /**
   * Moves a horse for this frame. While running it is exactly where the simulation puts
   * it; after the line it keeps its finishing speed and brakes evenly to a halt.
   */
  private move(runner: TrackRunner, distance: number, delta: number): Motion {
    const previous = this.motion.get(runner.lane)

    if (runner.position === null || !previous) {
      // Unwrapped, so that the field's average stays meaningful across the lap start.
      const arc = raceArc(distance, runner.progress * distance)
      if (!previous || delta === 0) return { arc, speed: previous?.speed ?? 0, braking: null }

      // Smooth the measured speed: it only drives the legs, and should not flicker.
      const measured = Math.max((arc - previous.arc) / delta, 0)
      return { arc, speed: previous.speed + (measured - previous.speed) * 0.2, braking: null }
    }

    const braking = previous.braking ?? previous.speed ** 2 / (2 * PULL_UP_DISTANCE)
    const speed = Math.max(previous.speed - braking * delta, 0)
    return { arc: previous.arc + speed * delta, speed, braking }
  }

  /** Blends idle, walk and gallop by ground speed, with the legs matched to the ground. */
  private setGait(horse: HorseRunner, speed: number): void {
    const gallop = clamp01((speed - WALK_SPEED) / (GALLOP_SPEED - WALK_SPEED))
    const walk = (1 - gallop) * clamp01(speed / WALK_SPEED)

    horse.gallop.setEffectiveWeight(gallop)
    horse.walk.setEffectiveWeight(walk)
    horse.idle.setEffectiveWeight(1 - gallop - walk)

    const gallopRate = speed / (GALLOP_STRIDE / GALLOP_CLIP)
    horse.gallop.timeScale = Math.min(Math.max(gallopRate, 0.6), MAX_LEG_RATE)
    horse.walk.timeScale = Math.min(Math.max(speed / WALK_STRIDE, 0.5), MAX_LEG_RATE)
  }

  /** Keeps the saddle and jockey on the horse's back as the back rises and falls. */
  private seat(horse: HorseRunner): void {
    if (!horse.saddleBone) return
    horse.saddleBone.getWorldPosition(this.scratch)
    horse.root.worldToLocal(this.scratch)
    horse.seat.position.copy(this.scratch).add(SEAT_OFFSET)
  }

  private frame(): void {
    this.timer.update()
    const { runners, distance, paused } = this.field
    const delta = paused ? 0 : Math.min(this.timer.getDelta(), 0.1)

    const entries: FieldEntry[] = []

    for (const runner of runners) {
      const horse = this.runners.get(runner.lane)
      if (!horse || distance === null) continue

      const motion = this.move(runner, distance, delta)
      this.motion.set(runner.lane, motion)

      const point = pointOnCourse(motion.arc, laneOffset(runner.lane))
      horse.root.position.set(point.x, 0, point.z)
      horse.root.rotation.y = point.heading

      this.setGait(horse, motion.speed)
      horse.mixer.update(delta)
      this.seat(horse)
      horse.marker.visible = this.mode === 'aerial'

      entries.push({
        arc: motion.arc,
        metresToGo: distance * (1 - runner.progress),
        finished: runner.position !== null,
        progress: runner.progress,
      })
    }

    const view: FieldView = { ...describeField(entries), aspect: this.camera.aspect, fov: FOV }
    this.moveCamera(cameraPose(this.mode, view), delta)

    this.renderer.render(this.scene, this.camera)
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
