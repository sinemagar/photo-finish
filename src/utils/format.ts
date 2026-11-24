/** Formats a distance in metres, e.g. `1200 m`. */
export function formatDistance(metres: number): string {
  return `${metres} m`
}

/** Formats race seconds as minutes, seconds and hundredths, e.g. `1:15.32`. */
export function formatRaceTime(seconds: number): string {
  const hundredths = Math.round(seconds * 100)
  const minutes = Math.floor(hundredths / 6000)
  const rest = ((hundredths % 6000) / 100).toFixed(2).padStart(5, '0')

  return `${minutes}:${rest}`
}

/** Formats a positive integer as an English ordinal, e.g. `1st`, `22nd`, `13th`. */
export function formatOrdinal(value: number): string {
  const lastTwo = value % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`

  const suffix = { 1: 'st', 2: 'nd', 3: 'rd' }[value % 10] ?? 'th'
  return `${value}${suffix}`
}
