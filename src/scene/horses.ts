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

/**
 * A crouching jockey in the horse's silks, built from simple shapes in the same low-poly
 * style as the horse. Positioned in the horse's own space, where the horse faces +z.
 */
function createJockey(silks: string): Group {
  const jockey = new Group()
  const silk = new MeshStandardMaterial({ color: silks, roughness: 0.6 })
  const breeches = new MeshStandardMaterial({ color: '#f3f1ea', roughness: 0.8 })
  const boots = new MeshStandardMaterial({ color: '#141414', roughness: 0.7 })
  const skin = new MeshStandardMaterial({ color: '#e2b293', roughness: 0.8 })

  const body = new Mesh(new CapsuleGeometry(0.17, 0.42, 4, 8), silk)
  body.rotation.x = 1.05
  body.position.set(0, 0.36, 0.12)

  const head = new Mesh(new SphereGeometry(0.13, 12, 8), skin)
  head.position.set(0, 0.6, 0.42)

  const cap = new Mesh(new SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), silk)
  cap.position.set(0, 0.62, 0.42)

  const peak = new Mesh(new BoxGeometry(0.18, 0.02, 0.1), silk)
  peak.position.set(0, 0.62, 0.57)

  for (const side of [-1, 1]) {
    const thigh = new Mesh(new CapsuleGeometry(0.075, 0.28, 3, 6), breeches)
    thigh.rotation.x = -0.9
    thigh.position.set(side * 0.19, 0.12, 0.08)

    const shin = new Mesh(new CapsuleGeometry(0.06, 0.26, 3, 6), boots)
    shin.rotation.x = 0.5
    shin.position.set(side * 0.21, -0.06, 0.02)

    const arm = new Mesh(new CapsuleGeometry(0.055, 0.32, 3, 6), silk)
    arm.rotation.x = 1.4
    arm.position.set(side * 0.16, 0.42, 0.52)

    jockey.add(thigh, shin, arm)
  }

  jockey.add(body, head, cap, peak)
  return jockey
}

/** One runner on the course: the horse, its rider and everything that moves with it. */
export interface HorseRunner {
  root: Group
  mixer: AnimationMixer
  gallop: AnimationAction
  idle: AnimationAction
  /** A numbered marker above the horse, shown in the overhead view. */
  marker: Sprite
  /** The bone the rider sits on, followed every frame. */
  saddleBone: Bone | null
  rider: Group
}

const SADDLE_BONE = 'Torso'

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

  const silks = horse.color.hex
  const rider = createJockey(silks)
  root.add(rider)

  // Saddle cloth on both flanks, in the horse's colour with its number.
  const clothTexture = numberTexture(lane, silks)
  for (const side of [-1, 1]) {
    const cloth = new Mesh(
      new PlaneGeometry(0.62, 0.46),
      new MeshStandardMaterial({ map: clothTexture, roughness: 0.9 }),
    )
    cloth.rotation.y = (side * Math.PI) / 2
    cloth.position.set(side * 0.37, 1.32, -0.12)
    root.add(cloth)
  }

  const ground = new Mesh(
    new PlaneGeometry(1.4, 3.2),
    new MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.05
  root.add(ground)

  const marker = new Sprite(
    new SpriteMaterial({
      map: numberTexture(lane, silks),
      depthTest: false,
      sizeAttenuation: false,
    }),
  )
  marker.scale.setScalar(0.045)
  marker.position.y = 4
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
  idle.play()
  // Horses that start together should not move in step.
  mixer.setTime((lane * 0.137) % 1)

  let saddleBone: Bone | null = null
  model.traverse((object) => {
    if (object.name === SADDLE_BONE && (object as Bone).isBone) saddleBone = object as Bone
  })

  return { root, mixer, gallop, idle, marker, saddleBone, rider }
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
