import type { Horse } from '@/domain'

/**
 * Natural coat colours for the 3D horses. The unique colour of each horse required by the
 * brief is carried by its jockey's silks and saddle cloth, as on a real racecourse; the
 * coat is only there to make the field look like horses.
 */
export interface Coat {
  name: string
  /** Main body colour. */
  body: string
  /** Shaded areas such as the lower legs. */
  shade: string
  /** Highlights along the back. */
  light: string
  /** Mane and tail. */
  hair: string
  /** Nose and mouth. */
  muzzle: string
}

export const COATS: readonly Coat[] = [
  {
    name: 'Bay',
    body: '#7a4425',
    shade: '#4a2814',
    light: '#9a5c35',
    hair: '#16110e',
    muzzle: '#2a1d16',
  },
  {
    name: 'Chestnut',
    body: '#9b4f22',
    shade: '#6b3416',
    light: '#b8693a',
    hair: '#7a3a18',
    muzzle: '#3a2417',
  },
  {
    name: 'Black',
    body: '#1e1d1f',
    shade: '#121113',
    light: '#34323a',
    hair: '#0b0b0c',
    muzzle: '#151415',
  },
  {
    name: 'Grey',
    body: '#9a9a96',
    shade: '#72726e',
    light: '#bdbdb8',
    hair: '#5f5f5c',
    muzzle: '#4a4a48',
  },
  {
    name: 'White',
    body: '#e8e4da',
    shade: '#c4beb1',
    light: '#f6f3ec',
    hair: '#d9d3c6',
    muzzle: '#8d8478',
  },
  {
    name: 'Dark bay',
    body: '#4f2c1a',
    shade: '#2f190e',
    light: '#6a3d25',
    hair: '#0f0c0a',
    muzzle: '#22170f',
  },
  {
    name: 'Palomino',
    body: '#c9a35a',
    shade: '#9c7a3c',
    light: '#dfbf7d',
    hair: '#f1e6c8',
    muzzle: '#5c4a2f',
  },
  {
    name: 'Liver chestnut',
    body: '#5e3020',
    shade: '#3c1d12',
    light: '#7b412b',
    hair: '#4a2416',
    muzzle: '#2a1810',
  },
]

/** The coat of a horse. Always the same for the same horse, so a horse is recognisable. */
export function coatFor(horse: Pick<Horse, 'id'>): Coat {
  return COATS[(horse.id - 1) % COATS.length] as Coat
}
