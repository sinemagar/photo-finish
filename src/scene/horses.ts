import {
  AnimationMixer,
  Box3,
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  Group,
  LoopRepeat,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  type AnimationAction,
  type AnimationClip,
  type Bone,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'

import type { Horse } from '@/domain'

import { coatFor, type Coat } from './coats'

/** Nose-to-tail length of a horse in scene units. */
const HORSE_LENGTH = 2.6

/** The loaded model, ready to be copied once per runner. */
export interface HorseTemplate {
  scene: Object3D
  clips: AnimationClip[]
  scale: number
}

export async function loadHorseTemplate(url: string): Promise<HorseTemplate> {
  const gltf = await new GLTFLoader().loadAsync(url)
  const size = new Box3().setFromObject(gltf.scene).getSize(new Vector3())

  return { scene: gltf.scene, clips: gltf.animations, scale: HORSE_LENGTH / size.z }
}

/** Material names in the model, mapped to the part of a coat they show. */
const COAT_PARTS: Record<string, keyof Omit<Coat, 'name'>> = {
  Main: 'body',
  Main_Dark: 'shade',
  Main_Light: 'light',
  Hair: 'hair',
  Muzzle: 'muzzle',
}

function paintCoat(model: Object3D, coat: Coat): void {
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return

    const original = object.material as MeshStandardMaterial
    const part = COAT_PARTS[original.name]
    const material = original.clone()
    material.metalness = 0
    material.roughness = 0.85
    if (part) material.color.set(coat[part])
    object.material = material
    object.frustumCulled = false
  })
}

/** A square texture with the horse's number on its silks colour. */
function numberTexture(number: number, colour: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')

  if (context) {
    context.fillStyle = colour
    context.fillRect(0, 0, 64, 64)
    context.fillStyle = '#ffffff'
    context.beginPath()
    context.arc(32, 32, 21, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#101814'
    context.font = 'bold 30px system-ui, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(String(number), 32, 34)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** A capsule running from one point to another, for limbs and bodies. */
function limb(from: Vector3, to: Vector3, radius: number, material: MeshStandardMaterial): Mesh {
  const direction = to.clone().sub(from)
  const length = direction.length()
  const mesh = new Mesh(
    new CapsuleGeometry(radius, Math.max(length - 2 * radius, 0.01), 4, 8),
    material,
  )
  mesh.position.copy(from).add(to).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize())
  return mesh
}

const point = (x: number, y: number, z: number) => new Vector3(x, y, z)

/**
 * The saddle, saddle cloths and a jockey in racing crouch: short stirrups, knees high,
 * body low over the withers and hands on the neck. Built from simple shapes in the same
 * low-poly style as the horse, around the top of the saddle, with the horse facing +z.
 */
function createSeat(silks: string, number: number): Group {
  const seat = new Group()
  const silk = new MeshStandardMaterial({ color: silks, roughness: 0.55 })
  const breeches = new MeshStandardMaterial({ color: '#f3f1ea', roughness: 0.8 })
  const leather = new MeshStandardMaterial({ color: '#2a1d16', roughness: 0.7 })
  const skin = new MeshStandardMaterial({ color: '#e2b293', roughness: 0.8 })

  const saddle = new Mesh(new BoxGeometry(0.46, 0.06, 0.5), leather)
  saddle.position.set(0, 0.01, 0)
  seat.add(saddle)

  // Saddle cloth on both flanks, in the horse's colour with its number.
  const cloth = new MeshStandardMaterial({ map: numberTexture(number, silks), roughness: 0.9 })
  for (const side of [-1, 1]) {
    const panel = new Mesh(new PlaneGeometry(0.56, 0.4), cloth)
    panel.rotation.y = (side * Math.PI) / 2
    panel.position.set(side * 0.37, -0.2, -0.04)
    seat.add(panel)
  }

  const hips = point(0, 0.2, -0.06)
  const shoulders = point(0, 0.4, 0.4)
  seat.add(limb(hips, shoulders, 0.15, silk))

  const head = new Mesh(new SphereGeometry(0.115, 14, 10), skin)
  head.position.set(0, 0.5, 0.58)
  const cap = new Mesh(new SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), silk)
  cap.position.set(0, 0.52, 0.57)
  const peak = new Mesh(new BoxGeometry(0.16, 0.02, 0.1), silk)
  peak.position.set(0, 0.52, 0.71)
  seat.add(head, cap, peak)

  for (const side of [-1, 1]) {
    const hip = point(side * 0.16, 0.17, -0.06)
    const knee = point(side * 0.3, 0.2, 0.26)
    const foot = point(side * 0.36, -0.24, 0.12)
    const shoulder = point(side * 0.14, 0.38, 0.4)
    const hand = point(side * 0.08, 0.18, 0.86)

    seat.add(limb(hip, knee, 0.075, breeches))
    seat.add(limb(knee, foot, 0.06, leather))
    seat.add(limb(shoulder, hand, 0.055, silk))
  }

  return seat
}

/** One runner on the course: the horse, its rider and everything that moves with it. */
export interface HorseRunner {
  root: Group
  mixer: AnimationMixer
  gallop: AnimationAction
  idle: AnimationAction
  walk: AnimationAction
  /** A numbered marker above the horse, shown in the aerial view. */
  marker: Sprite
  /** The bone under the saddle, followed every frame so the rider moves with the horse. */
  saddleBone: Bone | null
  /** Saddle, saddle cloths and jockey. */
  seat: Group
}

const SADDLE_BONE = 'Torso2'

export function createHorseRunner(
  template: HorseTemplate,
  horse: Horse,
  lane: number,
  shadow: Texture,
): HorseRunner {
  const root = new Group()
  const model = cloneSkinned(template.scene)
  model.scale.multiplyScalar(template.scale)
  paintCoat(model, coatFor(horse))
  root.add(model)

  const seat = createSeat(horse.color.hex, lane)
  root.add(seat)

  const ground = new Mesh(
    new PlaneGeometry(1.4, 3.2),
    new MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.05
  root.add(ground)

  const marker = new Sprite(
    new SpriteMaterial({
      map: numberTexture(lane, horse.color.hex),
      depthTest: false,
      sizeAttenuation: false,
    }),
  )
  marker.scale.setScalar(0.028)
  marker.position.y = 3.2
  marker.renderOrder = 10
  marker.visible = false
  root.add(marker)

  const mixer = new AnimationMixer(model)
  const clip = (name: string) => {
    const found = template.clips.find((candidate) => candidate.name === name)
    if (!found) throw new Error(`The horse model has no "${name}" animation`)
    return found
  }
  const gallop = mixer.clipAction(clip('Gallop')).setLoop(LoopRepeat, Infinity)
  const idle = mixer.clipAction(clip('Idle')).setLoop(LoopRepeat, Infinity)
  const walk = mixer.clipAction(clip('Walk')).setLoop(LoopRepeat, Infinity)
  // All three gaits play at once; the scene blends them by setting their weights.
  for (const action of [gallop, walk, idle]) action.play()
  gallop.setEffectiveWeight(0)
  walk.setEffectiveWeight(0)
  idle.setEffectiveWeight(1)
  // Horses that start together should not move in step.
  mixer.setTime((lane * 0.137) % 1)

  let saddleBone: Bone | null = null
  model.traverse((object) => {
    if (object.name === SADDLE_BONE && (object as Bone).isBone) saddleBone = object as Bone
  })

  return { root, mixer, gallop, idle, walk, marker, saddleBone, seat }
}

/** Frees the GPU memory held by a runner. */
export function disposeHorseRunner(runner: HorseRunner): void {
  runner.root.traverse((object) => {
    if (!(object instanceof Mesh) && !(object instanceof Sprite)) return
    object.geometry?.dispose()
    const materials = ([] as Material[]).concat(object.material as Material | Material[])
    for (const material of materials) {
      ;(material as MeshStandardMaterial).map?.dispose()
      material.dispose()
    }
  })
  runner.mixer.stopAllAction()
}
