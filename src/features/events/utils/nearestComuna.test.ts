import { describe, it, expect } from 'vitest'
import {
  findComunaAt,
  findNearestComuna,
  loadComunaGeometry,
  MAX_DISTANCE_KM,
} from './nearestComuna'
import type { ComunaGeometry } from './nearestComuna'

// Anillo plano [lat, lng, lat, lng, ...] de un rectángulo
const rect = (latMin: number, lngMin: number, latMax: number, lngMax: number) => [
  latMin, lngMin, latMin, lngMax, latMax, lngMax, latMax, lngMin,
]

// Norte = lat mayor. A y B son vecinas; A tiene un hueco donde está C (enclave).
const A: ComunaGeometry = {
  n: 'A',
  p: [[rect(0, 0, 1, 1), rect(0.4, 0.4, 0.6, 0.6)]],
}
const B: ComunaGeometry = { n: 'B', p: [[rect(0, 1, 1, 2)]] }
const C: ComunaGeometry = { n: 'C', p: [[rect(0.4, 0.4, 0.6, 0.6)]] }
// Comuna con dos partes separadas (como una comuna con islas)
const D: ComunaGeometry = { n: 'D', p: [[rect(10, 10, 11, 11)], [rect(20, 20, 21, 21)]] }
const fake = [A, B, C, D]

describe('findComunaAt — geometría sintética', () => {
  it('returns the comuna that contains the point, with distance 0', () => {
    expect(findComunaAt(0.2, 0.2, fake)).toEqual({ name: 'A', distanceKm: 0 })
    expect(findComunaAt(0.5, 1.5, fake)).toEqual({ name: 'B', distanceKm: 0 })
  })

  it('handles holes: a point in the hole belongs to the enclave, not to the outer comuna', () => {
    expect(findComunaAt(0.5, 0.5, fake)?.name).toBe('C')
    expect(findComunaAt(0.5, 0.5, [A])).not.toEqual({ name: 'A', distanceKm: 0 })
  })

  it('matches any part of a multi-part comuna', () => {
    expect(findComunaAt(10.5, 10.5, fake)?.name).toBe('D')
    expect(findComunaAt(20.5, 20.5, fake)?.name).toBe('D')
  })

  it('falls back to the nearest comuna when the point is just outside all of them', () => {
    // ~5,5 km al oeste del borde de A (0,05° de longitud en el ecuador)
    const match = findComunaAt(0.2, -0.05, fake)
    expect(match?.name).toBe('A')
    expect(match!.distanceKm).toBeGreaterThan(5)
    expect(match!.distanceKm).toBeLessThan(6)
  })

  it('picks the closer of two candidates', () => {
    const near = findComunaAt(0.2, 2.03, fake) // más cerca de B (borde este en lng 2)
    expect(near?.name).toBe('B')
  })

  it('returns null beyond the max distance', () => {
    expect(findComunaAt(0.2, -0.5, fake)).toBeNull() // ~55 km
    expect(findComunaAt(0.2, -0.05, fake, 2)).toBeNull() // límite propio más estricto
  })

  it('uses a 10 km default limit', () => {
    expect(MAX_DISTANCE_KM).toBe(10)
    expect(findComunaAt(0.2, -0.08, fake)?.name).toBe('A') // ~8,9 km
    expect(findComunaAt(0.2, -0.12, fake)).toBeNull() // ~13 km
  })

  it('returns null for non-finite coordinates and for an empty list', () => {
    expect(findComunaAt(NaN, 0, fake)).toBeNull()
    expect(findComunaAt(0, Infinity, fake)).toBeNull()
    expect(findComunaAt(0.2, 0.2, [])).toBeNull()
  })
})

describe('loadComunaGeometry', () => {
  it('loads the comuna data once and caches it', async () => {
    const first = loadComunaGeometry()
    const second = loadComunaGeometry()
    expect(second).toBe(first)

    const data = await first
    expect(data.length).toBeGreaterThanOrEqual(340)
    expect(new Set(data.map((c) => c.n)).size).toBe(data.length)
    expect(data.every((c) => c.p.length > 0 && c.p[0][0].length >= 6)).toBe(true)
  })
})

describe('findNearestComuna — límites reales de Chile', () => {
  const cities: [string, number, number, string][] = [
    ['Concepción (centro)', -36.827, -73.0503, 'Concepción'],
    ['Talcahuano', -36.7249, -73.1168, 'Talcahuano'],
    ['San Pedro de la Paz', -36.8433, -73.1003, 'San Pedro de la Paz'],
    ['Antofagasta (centro)', -23.6509, -70.3975, 'Antofagasta'],
    ['Santiago (centro)', -33.4372, -70.6506, 'Santiago'],
    ['Providencia', -33.4257, -70.6108, 'Providencia'],
    ['Ñuñoa', -33.456, -70.598, 'Ñuñoa'],
    ['Las Condes', -33.408, -70.567, 'Las Condes'],
    ['Viña del Mar', -33.0245, -71.5518, 'Viña del Mar'],
    ['Valparaíso (Plaza Sotomayor)', -33.0393, -71.6273, 'Valparaíso'],
    ['La Serena', -29.9027, -71.2519, 'La Serena'],
    ['Coquimbo', -29.9533, -71.3436, 'Coquimbo'],
    ['Temuco', -38.7359, -72.5904, 'Temuco'],
    ['Puerto Montt', -41.4693, -72.9424, 'Puerto Montt'],
    ['Punta Arenas', -53.1638, -70.9171, 'Punta Arenas'],
    ['Arica', -18.4783, -70.3126, 'Arica'],
    ['Chillán', -36.6063, -72.1034, 'Chillán'],
    ['Hanga Roa', -27.15, -109.4333, 'Isla de Pascua'],
  ]

  it.each(cities)('%s -> %s', async (_label, lat, lng, expected) => {
    const match = await findNearestComuna(lat, lng)
    expect(match).toEqual({ name: expected, distanceKm: 0 })
  })

  it('returns the nearest comuna for a point in the sea close to the coast', async () => {
    const match = await findNearestComuna(-33.05, -71.75) // ~5 km frente a Valparaíso
    expect(match?.name).toBe('Valparaíso')
    expect(match!.distanceKm).toBeGreaterThan(0)
    expect(match!.distanceKm).toBeLessThan(MAX_DISTANCE_KM)
  })

  it.each([
    ['Mendoza (Argentina)', -32.8895, -68.8458],
    ['Buenos Aires (Argentina)', -34.6, -58.4],
    ['Ushuaia (Argentina, frente a Navarino)', -54.8019, -68.303],
    ['Pacífico lejano', -30, -120],
  ])('%s is not in Chile -> null', async (_label, lat, lng) => {
    expect(await findNearestComuna(lat, lng)).toBeNull()
  })
})
