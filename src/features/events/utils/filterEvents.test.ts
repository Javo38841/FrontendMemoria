import { describe, it, expect } from 'vitest'
import {
  filterEvents,
  haversineKm,
  normalizeText,
  getDatePresetRange,
  hasActiveFilters,
  toLocalDateString,
  EMPTY_FILTER_CRITERIA,
} from './filterEvents'
import type { Event } from '../types/events.types'

const SANTIAGO = { latitude: -33.4489, longitude: -70.6693 }
const CONCEPCION = { latitude: -36.8261, longitude: -73.0493 }
const VALPARAISO = { latitude: -33.0472, longitude: -71.6127 }

const makeEvent = (overrides: Partial<Event> & { id: number }): Event => ({
  title: 'Evento',
  description: 'Descripción',
  date: '2099-12-01',
  location: 'Lugar',
  ...overrides,
})

const rock = makeEvent({
  id: 1,
  title: 'Festival de Rock',
  description: 'Bandas en vivo toda la noche',
  location: 'Concepción, Biobío',
  date: '2025-03-10',
  ...CONCEPCION,
})
const jazz = makeEvent({
  id: 2,
  title: 'Noche de Jazz',
  description: 'Música en un bar íntimo',
  location: 'Santiago, Providencia',
  date: '2025-03-12',
  ...SANTIAGO,
})
const electro = makeEvent({
  id: 3,
  title: 'Fiesta Electrónica',
  description: 'DJ internacionales',
  location: 'Valparaíso',
  date: '2025-03-15',
  ...VALPARAISO,
})
const sinCoordenadas = makeEvent({
  id: 4,
  title: 'Evento online',
  description: 'Transmisión por streaming',
  location: 'Santiago (virtual)',
  date: '2025-03-12',
})

const all = [rock, jazz, electro, sinCoordenadas]
const ids = (events: Event[]) => events.map((e) => e.id)

describe('normalizeText', () => {
  it('lowercases, removes accents and trims', () => {
    expect(normalizeText('  CONCEPCIÓN  ')).toBe('concepcion')
    expect(normalizeText('Ñuñoa')).toBe('nunoa')
  })
})

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(-33.4, -70.6, -33.4, -70.6)).toBe(0)
  })

  it('computes ~111 km per degree of latitude', () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1)
  })

  it('computes a known distance Santiago–Valparaíso (~100 km)', () => {
    const d = haversineKm(SANTIAGO.latitude, SANTIAGO.longitude, VALPARAISO.latitude, VALPARAISO.longitude)
    expect(d).toBeGreaterThan(95)
    expect(d).toBeLessThan(105)
  })

  it('is symmetric', () => {
    const ab = haversineKm(SANTIAGO.latitude, SANTIAGO.longitude, CONCEPCION.latitude, CONCEPCION.longitude)
    const ba = haversineKm(CONCEPCION.latitude, CONCEPCION.longitude, SANTIAGO.latitude, SANTIAGO.longitude)
    expect(ab).toBeCloseTo(ba, 10)
  })
})

describe('filterEvents — sin filtros', () => {
  it('returns all events when criteria is empty', () => {
    expect(ids(filterEvents(all, {}))).toEqual([1, 2, 3, 4])
    expect(ids(filterEvents(all, EMPTY_FILTER_CRITERIA))).toEqual([1, 2, 3, 4])
  })

  it('returns an empty array for an empty list', () => {
    expect(filterEvents([], { text: 'rock' })).toEqual([])
    expect(filterEvents([], {})).toEqual([])
  })

  it('treats whitespace-only text as no filter', () => {
    expect(ids(filterEvents(all, { text: '   ', location: '  ' }))).toEqual([1, 2, 3, 4])
  })
})

describe('filterEvents — texto', () => {
  it('matches title', () => {
    expect(ids(filterEvents(all, { text: 'jazz' }))).toEqual([2])
  })

  it('matches description', () => {
    expect(ids(filterEvents(all, { text: 'streaming' }))).toEqual([4])
  })

  it('matches location', () => {
    expect(ids(filterEvents(all, { text: 'biobío' }))).toEqual([1])
  })

  it('ignores case', () => {
    expect(ids(filterEvents(all, { text: 'FESTIVAL' }))).toEqual([1])
  })

  it('ignores accents in both directions', () => {
    expect(ids(filterEvents(all, { text: 'concepcion' }))).toEqual([1])
    expect(ids(filterEvents(all, { text: 'Electronica' }))).toEqual([3])
    expect(ids(filterEvents(all, { text: 'musica' }))).toEqual([2])
    expect(ids(filterEvents([makeEvent({ id: 9, title: 'Concierto', location: 'Concepcion' })], { text: 'Concepción' }))).toEqual([9])
  })

  it('returns nothing when there is no match', () => {
    expect(filterEvents(all, { text: 'reggaeton' })).toEqual([])
  })
})

describe('filterEvents — ubicación por texto', () => {
  it('filters by city on the location field only', () => {
    expect(ids(filterEvents(all, { location: 'santiago' }))).toEqual([2, 4])
  })

  it('does not match against title or description', () => {
    // "Rock" está en el título, no en la ubicación
    expect(filterEvents(all, { location: 'rock' })).toEqual([])
  })

  it('ignores accents and case', () => {
    expect(ids(filterEvents(all, { location: 'VALPARAISO' }))).toEqual([3])
  })
})

describe('filterEvents — fecha', () => {
  it('filters by dateFrom only', () => {
    expect(ids(filterEvents(all, { dateFrom: '2025-03-12' }))).toEqual([2, 3, 4])
  })

  it('filters by dateTo only', () => {
    expect(ids(filterEvents(all, { dateTo: '2025-03-12' }))).toEqual([1, 2, 4])
  })

  it('filters by range', () => {
    expect(ids(filterEvents(all, { dateFrom: '2025-03-11', dateTo: '2025-03-14' }))).toEqual([2, 4])
  })

  it('includes events exactly on the boundary dates', () => {
    expect(ids(filterEvents(all, { dateFrom: '2025-03-10', dateTo: '2025-03-10' }))).toEqual([1])
    expect(ids(filterEvents(all, { dateFrom: '2025-03-15', dateTo: '2025-03-15' }))).toEqual([3])
  })

  it('excludes events one day outside the range', () => {
    expect(ids(filterEvents(all, { dateFrom: '2025-03-16' }))).toEqual([])
    expect(ids(filterEvents(all, { dateTo: '2025-03-09' }))).toEqual([])
  })

  it('returns nothing if dateFrom is after dateTo', () => {
    expect(filterEvents(all, { dateFrom: '2025-03-20', dateTo: '2025-03-01' })).toEqual([])
  })

  it('excludes events with a malformed date when a date filter is active', () => {
    const roto = makeEvent({ id: 5, date: 'no-es-fecha' })
    expect(filterEvents([roto], { dateFrom: '2025-01-01' })).toEqual([])
    // sin filtro de fecha se conserva
    expect(ids(filterEvents([roto], {}))).toEqual([5])
  })

  it('compares as a local calendar date, without timezone shifts', () => {
    // Un evento el 1 de enero debe quedar en "hoy" el 1 de enero local,
    // sea cual sea la zona horaria de la máquina.
    const newYear = makeEvent({ id: 6, date: '2026-01-01' })
    const { dateFrom, dateTo } = getDatePresetRange('today', new Date(2026, 0, 1, 0, 30))
    expect(ids(filterEvents([newYear], { dateFrom, dateTo }))).toEqual([6])
    const lateNight = getDatePresetRange('today', new Date(2026, 0, 1, 23, 59))
    expect(ids(filterEvents([newYear], lateNight))).toEqual([6])
  })
})

describe('getDatePresetRange', () => {
  it('"today" is the same local day on both ends', () => {
    expect(getDatePresetRange('today', new Date(2025, 2, 12, 15, 0))).toEqual({
      dateFrom: '2025-03-12',
      dateTo: '2025-03-12',
    })
  })

  it('"upcoming" starts today and has no end', () => {
    expect(getDatePresetRange('upcoming', new Date(2025, 2, 12))).toEqual({
      dateFrom: '2025-03-12',
      dateTo: '',
    })
  })

  it('"week" goes Monday to Sunday (Wednesday 2025-03-12)', () => {
    expect(getDatePresetRange('week', new Date(2025, 2, 12))).toEqual({
      dateFrom: '2025-03-10',
      dateTo: '2025-03-16',
    })
  })

  it('"week" on a Monday starts that same day', () => {
    expect(getDatePresetRange('week', new Date(2025, 2, 10)).dateFrom).toBe('2025-03-10')
  })

  it('"week" on a Sunday ends that same day', () => {
    expect(getDatePresetRange('week', new Date(2025, 2, 16))).toEqual({
      dateFrom: '2025-03-10',
      dateTo: '2025-03-16',
    })
  })

  it('"week" crosses month and year boundaries', () => {
    // Jueves 2026-01-01 -> semana del lunes 2025-12-29 al domingo 2026-01-04
    expect(getDatePresetRange('week', new Date(2026, 0, 1))).toEqual({
      dateFrom: '2025-12-29',
      dateTo: '2026-01-04',
    })
  })

  it('uses local date parts, not UTC', () => {
    expect(toLocalDateString(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31')
    expect(toLocalDateString(new Date(2025, 0, 1, 0, 0))).toBe('2025-01-01')
  })
})

describe('filterEvents — cercanía', () => {
  const desdeSantiago = (radiusKm: number) => ({ nearby: { ...SANTIAGO, radiusKm } })

  it('keeps only events within the radius', () => {
    expect(ids(filterEvents(all, desdeSantiago(10)))).toEqual([2])
    expect(ids(filterEvents(all, desdeSantiago(150)))).toEqual([2, 3])
  })

  it('excludes events without coordinates when active', () => {
    expect(ids(filterEvents(all, desdeSantiago(5000)))).toEqual([1, 2, 3])
  })

  it('does not exclude events without coordinates when inactive', () => {
    expect(ids(filterEvents(all, { nearby: null }))).toContain(4)
  })

  it('excludes events with only one coordinate or non-finite values', () => {
    const half = makeEvent({ id: 7, latitude: -33.4 })
    const nan = makeEvent({ id: 8, latitude: NaN, longitude: -70.6 })
    expect(filterEvents([half, nan], desdeSantiago(5000))).toEqual([])
  })

  it('includes an event exactly at the radius boundary', () => {
    const d = haversineKm(SANTIAGO.latitude, SANTIAGO.longitude, VALPARAISO.latitude, VALPARAISO.longitude)
    expect(ids(filterEvents([electro], desdeSantiago(d)))).toEqual([3])
    expect(filterEvents([electro], desdeSantiago(d - 0.001))).toEqual([])
  })
})

describe('filterEvents — combinaciones (AND)', () => {
  it('combines text and date', () => {
    expect(ids(filterEvents(all, { text: 'santiago', dateFrom: '2025-03-12', dateTo: '2025-03-12' }))).toEqual([2, 4])
    expect(filterEvents(all, { text: 'santiago', dateFrom: '2025-03-13' })).toEqual([])
  })

  it('combines text, location and date', () => {
    expect(
      ids(filterEvents(all, { text: 'noche', location: 'providencia', dateFrom: '2025-03-01', dateTo: '2025-03-31' }))
    ).toEqual([2])
  })

  it('combines location and proximity', () => {
    expect(ids(filterEvents(all, { location: 'santiago', nearby: { ...SANTIAGO, radiusKm: 10 } }))).toEqual([2])
  })

  it('combines every filter at once', () => {
    const result = filterEvents(all, {
      text: 'jazz',
      location: 'santiago',
      dateFrom: '2025-03-12',
      dateTo: '2025-03-12',
      nearby: { ...SANTIAGO, radiusKm: 25 },
    })
    expect(ids(result)).toEqual([2])
  })

  it('returns nothing when filters contradict each other', () => {
    expect(filterEvents(all, { text: 'jazz', location: 'valparaíso' })).toEqual([])
  })
})

describe('filterEvents — inmutabilidad', () => {
  it('does not mutate the original array or its events', () => {
    const original = [rock, jazz, electro, sinCoordenadas]
    const snapshot = JSON.parse(JSON.stringify(original))
    Object.freeze(original)
    original.forEach(Object.freeze)

    expect(() =>
      filterEvents(original, { text: 'santiago', dateFrom: '2025-03-01', nearby: { ...SANTIAGO, radiusKm: 50 } })
    ).not.toThrow()

    expect(original).toEqual(snapshot)
    expect(original).toHaveLength(4)
  })

  it('returns a new array even when nothing is filtered out', () => {
    const result = filterEvents(all, {})
    expect(result).toEqual(all)
    expect(result).not.toBe(all)
  })

  it('preserves the original order', () => {
    expect(ids(filterEvents([electro, rock, jazz], {}))).toEqual([3, 1, 2])
  })
})

describe('hasActiveFilters', () => {
  it('is false for empty criteria', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(hasActiveFilters(EMPTY_FILTER_CRITERIA)).toBe(false)
    expect(hasActiveFilters({ text: '  ', location: ' ' })).toBe(false)
  })

  it('is true when any filter is set', () => {
    expect(hasActiveFilters({ text: 'a' })).toBe(true)
    expect(hasActiveFilters({ location: 'a' })).toBe(true)
    expect(hasActiveFilters({ dateFrom: '2025-01-01' })).toBe(true)
    expect(hasActiveFilters({ dateTo: '2025-01-01' })).toBe(true)
    expect(hasActiveFilters({ nearby: { ...SANTIAGO, radiusKm: 5 } })).toBe(true)
  })
})
