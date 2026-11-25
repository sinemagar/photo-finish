import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Scene,
} from 'three'

import { COURSE, courseLength, laneOffset, pointOnCourse } from '../geometry/course'

const LANES = 10
const INNER_EDGE = 0
const OUTER_EDGE = laneOffset(LANES) + COURSE.laneWidth
const STRIPE_LENGTH = 12

const TURF = new Color('#3f8f4a')
const TURF_ALT = new Color('#367f41')
const INFIELD = '#2f6f3a'
const GROUND = '#2b5f33'
const RAIL = '#f4f6f2'

/** Samples the course at regular intervals, at a given offset from the inner rail. */
function sample(offset: number, step: number, height = 0): Vector3[] {
  const length = courseLength()
  const points: Vector3[] = []

  for (let arc = 0; arc < length; arc += step) {
    const point = pointOnCourse(arc, offset)
    points.push(new Vector3(point.x, height, point.z))
  }

  return points
}

/** The racing surface, mown in bands across the course. */
function createTurf(): Mesh {
  const length = courseLength()
  const segments = Math.ceil(length / 2)
  const positions: number[] = []
  const colors: number[] = []

  for (let index = 0; index < segments; index++) {
    const from = (index * length) / segments
    const to = ((index + 1) * length) / segments
    const a = pointOnCourse(from, INNER_EDGE)
    const b = pointOnCourse(from, OUTER_EDGE)
    const c = pointOnCourse(to, INNER_EDGE)
    const d = pointOnCourse(to, OUTER_EDGE)
    const color = Math.floor(from / STRIPE_LENGTH) % 2 === 0 ? TURF : TURF_ALT

    positions.push(a.x, 0, a.z, b.x, 0, b.z, c.x, 0, c.z, c.x, 0, c.z, b.x, 0, b.z, d.x, 0, d.z)
    for (let vertex = 0; vertex < 6; vertex++) colors.push(color.r, color.g, color.b)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
  geometry.computeVertexNormals()

  const turf = new Mesh(geometry, new MeshLambertMaterial({ vertexColors: true }))
  turf.position.y = 0.02
  return turf
}

/** A white running rail with posts, at a given offset from the inner rail. */
function createRail(offset: number): Group {
  const rail = new Group()
  const material = new MeshLambertMaterial({ color: RAIL })

  const curve = new CatmullRomCurve3(sample(offset, 6, 1.1), true)
  rail.add(new Mesh(new TubeGeometry(curve, 400, 0.07, 6, true), material))

  const postPoints = sample(offset, 5)
  const posts = new InstancedMesh(
    new CylinderGeometry(0.05, 0.05, 1.1, 5),
    material,
    postPoints.length,
  )
  const dummy = new Object3D()
  postPoints.forEach((point, index) => {
    dummy.position.set(point.x, 0.55, point.z)
    dummy.updateMatrix()
    posts.setMatrixAt(index, dummy.matrix)
  })
  rail.add(posts)

  return rail
}

/** The finish line painted across the course, and the post beside it. */
function createFinish(): Group {
  const finish = new Group()
  const start = pointOnCourse(COURSE.finishAt, INNER_EDGE)
  const end = pointOnCourse(COURSE.finishAt, OUTER_EDGE)

  const line = new Mesh(
    new PlaneGeometry(0.35, OUTER_EDGE),
    new MeshBasicMaterial({ color: '#ffffff' }),
  )
  line.rotation.x = -Math.PI / 2
  line.position.set((start.x + end.x) / 2, 0.04, (start.z + end.z) / 2)
  finish.add(line)

  const post = pointOnCourse(COURSE.finishAt, OUTER_EDGE + 0.8)
  const pole = new Mesh(
    new CylinderGeometry(0.12, 0.12, 5, 8),
    new MeshLambertMaterial({ color: RAIL }),
  )
  pole.position.set(post.x, 2.5, post.z)
  finish.add(pole)

  const disc = new Mesh(
    new CylinderGeometry(0.8, 0.8, 0.12, 24),
    new MeshLambertMaterial({ color: '#d62f2f' }),
  )
  disc.rotation.z = Math.PI / 2
  disc.position.set(post.x, 5.2, post.z)
  finish.add(disc)

  return finish
}

/** A stepped grandstand with a roof, facing the home straight. */
function createGrandstand(): Group {
  const stand = new Group()
  const centre = pointOnCourse(COURSE.finishAt - 30, OUTER_EDGE + 22)
  const seats = new MeshLambertMaterial({ color: '#c9ccc4' })
  const roof = new MeshLambertMaterial({ color: '#1f5a3a' })
  const crowd = ['#d94841', '#f2c14e', '#3c7dd9', '#f4f1ea', '#7a5cd6', '#2f2f35']

  for (let step = 0; step < 6; step++) {
    const tier = new Mesh(new BoxGeometry(90, 1.4, 3), seats)
    tier.position.set(centre.x, 0.7 + step * 1.4, centre.z + step * 2.6)
    stand.add(tier)

    // A row of spectators as small coloured blocks.
    const people = new InstancedMesh(new BoxGeometry(0.6, 0.9, 0.5), new MeshLambertMaterial(), 70)
    const dummy = new Object3D()
    for (let seat = 0; seat < 70; seat++) {
      dummy.position.set(
        centre.x - 42 + seat * 1.22,
        1.85 + step * 1.4,
        centre.z + step * 2.6 - 0.6,
      )
      dummy.updateMatrix()
      people.setMatrixAt(seat, dummy.matrix)
      people.setColorAt(seat, new Color(crowd[(seat * 7 + step * 3) % crowd.length]))
    }
    stand.add(people)
  }

  const cover = new Mesh(new BoxGeometry(94, 0.6, 18), roof)
  cover.position.set(centre.x, 13, centre.z + 6.5)
  stand.add(cover)

  return stand
}

/** Trees around the course and in the infield, for depth. */
function createTrees(): Group {
  const trees = new Group()
  const spots: [number, number][] = []
  const length = courseLength()

  for (let arc = 0; arc < length; arc += 22) {
    const outside = pointOnCourse(arc, OUTER_EDGE + 40 + (arc % 3) * 6)
    const near = pointOnCourse(COURSE.finishAt - 30, 0)
    // Leave the view from the stand open.
    if (Math.abs(outside.x - near.x) < 70 && outside.z > COURSE.radius) continue
    spots.push([outside.x, outside.z])
  }
  for (let index = 0; index < 14; index++) {
    spots.push([-100 + index * 15, ((index * 37) % 50) - 25])
  }

  const crowns = new InstancedMesh(
    new ConeGeometry(3.2, 9, 7),
    new MeshLambertMaterial({ color: '#24522f' }),
    spots.length,
  )
  const trunks = new InstancedMesh(
    new CylinderGeometry(0.4, 0.5, 2.5, 5),
    new MeshLambertMaterial({ color: '#5a4030' }),
    spots.length,
  )
  const dummy = new Object3D()
  spots.forEach(([x, z], index) => {
    const scale = 0.8 + ((index * 13) % 7) / 10
    dummy.scale.setScalar(scale)
    dummy.position.set(x, 1.25 * scale, z)
    dummy.updateMatrix()
    trunks.setMatrixAt(index, dummy.matrix)
    dummy.position.set(x, (2.5 + 4.5) * scale, z)
    dummy.updateMatrix()
    crowns.setMatrixAt(index, dummy.matrix)
  })
  trees.add(trunks, crowns)

  return trees
}

/** A soft round shadow texture, shared by every horse. */
export function createShadowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 64, 64)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** A vertical gradient for the sky, lighter towards the horizon. */
function createSkyTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#5f9fd6')
    gradient.addColorStop(0.65, '#b7d6ea')
    gradient.addColorStop(1, '#e6eef0')
    context.fillStyle = gradient
    context.fillRect(0, 0, 2, 256)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Builds everything that does not move: sky, light, ground, course, rails, stand and trees. */
export function buildEnvironment(scene: Scene): void {
  scene.background = createSkyTexture()
  scene.fog = new Fog('#bcd6e6', 380, 1300)

  scene.add(new HemisphereLight('#e8f3ff', '#3a5a2e', 1.6))
  const sun = new DirectionalLight('#fff4e0', 1.8)
  sun.position.set(-120, 200, 160)
  scene.add(sun)

  const ground = new Mesh(new PlaneGeometry(2400, 2400), new MeshLambertMaterial({ color: GROUND }))
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  const infield = new Mesh(
    new PlaneGeometry(COURSE.straight + 2 * COURSE.radius, 2 * COURSE.radius),
    new MeshStandardMaterial({ color: INFIELD, roughness: 1 }),
  )
  infield.rotation.x = -Math.PI / 2
  infield.position.y = 0.01
  scene.add(infield)

  scene.add(createTurf())
  scene.add(createRail(INNER_EDGE - 0.3))
  scene.add(createRail(OUTER_EDGE + 0.3))
  scene.add(createFinish())
  scene.add(createGrandstand())
  scene.add(createTrees())
}
