import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { forwardRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Event } from '../../types/events.types'

// Captura la instancia real del mapa de Leaflet para poder leer su vista
let map: LeafletMap
vi.mock('react-leaflet', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-leaflet')>()
  const MapContainer = forwardRef<LeafletMap, React.ComponentProps<typeof actual.MapContainer>>(
    (props, ref) => (
      <actual.MapContainer
        {...props}
        ref={(instance) => {
          if (instance) map = instance
          if (typeof ref === 'function') ref(instance)
        }}
      />
    )
  )
  return { ...actual, MapContainer }
})

import { MapView } from './MapView'

// jsdom mide 0x0; Leaflet necesita un tamaño para calcular el zoom de fitBounds
const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 1000 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 500 })
})
afterAll(() => {
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalWidth)
  else delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
  if (originalHeight) Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalHeight)
  else delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
})

const make = (id: number, latitude: number, longitude: number): Event => ({
  id, title: `Evento ${id}`, description: 'Descripción de prueba', date: '2099-01-01', location: 'Chile', latitude, longitude,
})

// Tres ciudades
const santiago = [make(1, -33.4489, -70.6693), make(2, -33.4257, -70.6108), make(3, -33.5100, -70.7570)]
const concepcion = [make(4, -36.8270, -73.0503), make(5, -36.7249, -73.1168)]
const valparaiso = [make(6, -33.0393, -71.6273), make(7, -33.0245, -71.5518)]
const all = [...santiago, ...concepcion, ...valparaiso]

const ui = (events: Event[], props: Partial<React.ComponentProps<typeof MapView>> = {}) => (
  <MemoryRouter><MapView events={events} {...props} /></MemoryRouter>
)

const contains = (events: Event[]) =>
  events.every((e) => map.getBounds().contains([e.latitude!, e.longitude!]))
const view = () => ({ center: map.getCenter(), zoom: map.getZoom() })

beforeEach(() => {
  // cada test parte con un mapa nuevo
  map = undefined as unknown as LeafletMap
})

describe('MapView — vista inicial', () => {
  it('fits every event when mounted with several of them', () => {
    render(ui(all))
    expect(contains(all)).toBe(true)
  })

  it('centers on the event with the given zoom when there is only one', () => {
    render(ui([concepcion[0]], { zoom: 15 }))
    expect(map.getCenter().lat).toBeCloseTo(-36.827, 3)
    expect(map.getCenter().lng).toBeCloseTo(-73.0503, 3)
    expect(map.getZoom()).toBe(15)
  })

  it('uses the default center when there are no events', () => {
    render(ui([], { center: [-36.8261, -73.0493], zoom: 13 }))
    expect(map.getCenter().lat).toBeCloseTo(-36.8261, 3)
    expect(map.getZoom()).toBe(13)
  })
})

describe('MapView — al filtrar', () => {
  it('moves and zooms to the events left after filtering by city', () => {
    const { rerender } = render(ui(all))
    const before = view()

    rerender(ui(concepcion))

    expect(contains(concepcion)).toBe(true)
    expect(map.getCenter().lat).toBeLessThan(-36)      // ahora está en Concepción, no en la zona central
    expect(map.getCenter().lat).not.toBeCloseTo(before.center.lat, 0)
    expect(map.getZoom()).toBeGreaterThan(before.zoom) // más cerca que con todo el país
  })

  it('follows the filter from one city to another', () => {
    const { rerender } = render(ui(santiago))
    rerender(ui(valparaiso))
    expect(contains(valparaiso)).toBe(true)
    expect(map.getCenter().lng).toBeLessThan(-71) // Valparaíso queda al oeste de Santiago
    rerender(ui(concepcion))
    expect(contains(concepcion)).toBe(true)
    expect(map.getCenter().lat).toBeLessThan(-36)
  })

  it('centers on the event when the filter leaves a single one', () => {
    const { rerender } = render(ui(all, { zoom: 13 }))
    rerender(ui([valparaiso[0]], { zoom: 13 }))
    expect(map.getCenter().lat).toBeCloseTo(-33.0393, 3)
    expect(map.getCenter().lng).toBeCloseTo(-71.6273, 3)
    expect(map.getZoom()).toBe(13)
  })

  it('does not move the map when the filter leaves no events', () => {
    const { rerender } = render(ui(concepcion))
    const before = view()
    rerender(ui([]))
    expect(view()).toEqual(before)
  })

  it('fits the events again when they come back after an empty result', () => {
    const { rerender } = render(ui(santiago))
    rerender(ui([]))
    rerender(ui(valparaiso))
    expect(contains(valparaiso)).toBe(true)
  })

  it('fits all events again when the filter is cleared', () => {
    const { rerender } = render(ui(all))
    rerender(ui(concepcion))
    rerender(ui(all))
    expect(contains(all)).toBe(true)
  })

  it('ignores events without coordinates when fitting', () => {
    const sinCoordenadas: Event = { id: 99, title: 'Online', description: 'Sin ubicación', date: '2099-01-01', location: 'Online' }
    const { rerender } = render(ui(all))
    rerender(ui([sinCoordenadas, ...concepcion]))
    expect(contains(concepcion)).toBe(true)
  })
})

describe('MapView — no molesta al usuario', () => {
  it('does not reset the view on a re-render with the same events', () => {
    const { rerender } = render(ui(concepcion))
    map.setView([-30, -71], 8) // el usuario mueve el mapa
    const moved = view()

    rerender(ui([...concepcion])) // mismo contenido, arreglo nuevo (como hace el filtrado)

    expect(view()).toEqual(moved)
  })

  it('does not reset the view when only the height prop changes', () => {
    const { rerender } = render(ui(concepcion, { height: '500px' }))
    map.setView([-30, -71], 8)
    const moved = view()

    rerender(ui(concepcion, { height: '400px' }))

    expect(view()).toEqual(moved)
  })
})
