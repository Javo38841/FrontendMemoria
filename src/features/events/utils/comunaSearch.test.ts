import { describe, it, expect } from 'vitest'
import { searchComunas } from './comunaSearch'
import { COMUNAS } from '../data/comunas'

const names = (list: { name: string }[]) => list.map((c) => c.name)

describe('COMUNAS', () => {
  it('has unique names, each with a region', () => {
    expect(COMUNAS.length).toBeGreaterThanOrEqual(340)
    expect(new Set(names(COMUNAS)).size).toBe(COMUNAS.length)
    expect(COMUNAS.every((c) => c.name && c.region)).toBe(true)
  })

  it('includes well-known comunas, with their proper accents', () => {
    const all = names(COMUNAS)
    for (const n of ['Concepción', 'Santiago', 'Ñuñoa', 'Viña del Mar', 'Valparaíso', 'Punta Arenas', 'Isla de Pascua']) {
      expect(all).toContain(n)
    }
  })

  it('is sorted alphabetically ignoring accents', () => {
    const all = names(COMUNAS)
    expect(all.indexOf('Chépica')).toBeLessThan(all.indexOf('Chile Chico'))
    expect(all.indexOf('Chile Chico')).toBeLessThan(all.indexOf('Chillán'))
  })
})

describe('searchComunas', () => {
  const sample = [
    { name: 'Santiago', region: 'RM' },
    { name: 'San Pedro de la Paz', region: 'Biobío' },
    { name: 'Puente Alto', region: 'RM' },
    { name: 'Las Condes', region: 'RM' },
    { name: 'Ñuñoa', region: 'RM' },
    { name: 'Concepción', region: 'Biobío' },
  ]

  it('returns every comuna for an empty or blank query', () => {
    expect(searchComunas('', sample)).toEqual(sample)
    expect(searchComunas('   ', sample)).toEqual(sample)
  })

  it('ignores case and accents in both directions', () => {
    expect(names(searchComunas('CONCEPCION', sample))).toEqual(['Concepción'])
    expect(names(searchComunas('nunoa', sample))).toEqual(['Ñuñoa'])
    expect(names(searchComunas('Ñuñ', sample))).toEqual(['Ñuñoa'])
  })

  it('matches anywhere in the name, with prefix matches first', () => {
    // "san" empieza Santiago y San Pedro; también está dentro de ninguna otra
    expect(names(searchComunas('san', sample))).toEqual(['Santiago', 'San Pedro de la Paz'])
    // "on" no empieza ningún nombre; aparece dentro de Las Condes y Concepción
    expect(names(searchComunas('on', sample))).toEqual(['Las Condes', 'Concepción'])
    // prefijos primero aunque vengan más tarde en la lista original
    expect(names(searchComunas('con', sample))).toEqual(['Concepción', 'Las Condes'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(searchComunas('zzz', sample)).toEqual([])
  })

  it('searches the real list', () => {
    expect(names(searchComunas('conce')).slice(0, 1)).toEqual(['Concepción'])
    expect(names(searchComunas('vina'))).toContain('Viña del Mar')
  })

  it('does not mutate the input list', () => {
    const copy = [...sample]
    searchComunas('san', sample)
    expect(sample).toEqual(copy)
  })
})
