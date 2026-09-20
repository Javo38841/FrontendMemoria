import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { EventFilters } from './EventFilters'
import { EMPTY_FILTER_CRITERIA } from '../utils/filterEvents'
import type { EventFilterCriteria } from '../utils/filterEvents'
import { findNearestComuna, loadComunaGeometry } from '../utils/nearestComuna'

// Usa la geometría real; solo permite forzar un fallo puntual de carga
vi.mock('../utils/nearestComuna', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/nearestComuna')>()
  return { ...actual, findNearestComuna: vi.fn(actual.findNearestComuna) }
})

const CONCEPCION_CENTRO = { latitude: -36.827, longitude: -73.0503 }
const MENDOZA_ARGENTINA = { latitude: -32.8895, longitude: -68.8458 }

// --- Mock de navigator.geolocation -------------------------------------------
const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation')

const setGeolocation = (value: unknown) => {
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true })
}

const makeGeoError = (code: 1 | 2 | 3) => ({
  code,
  message: 'error de prueba',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
})

const mockGeolocationSuccess = (coords = CONCEPCION_CENTRO) => {
  const getCurrentPosition = vi.fn((onSuccess: PositionCallback) => {
    onSuccess({ coords } as GeolocationPosition)
  })
  setGeolocation({ getCurrentPosition })
  return getCurrentPosition
}

const mockGeolocationError = (code: 1 | 2 | 3) => {
  const getCurrentPosition = vi.fn(
    (_ok: PositionCallback, onError?: PositionErrorCallback | null) => {
      onError?.(makeGeoError(code) as GeolocationPositionError)
    }
  )
  setGeolocation({ getCurrentPosition })
  return getCurrentPosition
}

// Geolocalización que queda pendiente hasta que el test la resuelva
const mockGeolocationPending = (coords = CONCEPCION_CENTRO) => {
  let resolve: PositionCallback = () => {}
  const getCurrentPosition = vi.fn((onSuccess: PositionCallback) => {
    resolve = onSuccess
  })
  setGeolocation({ getCurrentPosition })
  return {
    getCurrentPosition,
    resolve: () => resolve({ coords } as GeolocationPosition),
  }
}

beforeEach(() => {
  setGeolocation(undefined)
})

afterEach(() => {
  vi.useRealTimers()
  if (originalGeolocation) {
    Object.defineProperty(navigator, 'geolocation', originalGeolocation)
  } else {
    delete (navigator as { geolocation?: unknown }).geolocation
  }
})

// --- Helpers de render -------------------------------------------------------
// Con un `criteria` fijo el input controlado no acumula texto, por eso los
// tests de interacción usan un padre con estado, igual que EventsPage.
function renderControlled(initial: EventFilterCriteria = EMPTY_FILTER_CRITERIA) {
  const onChange = vi.fn()
  const onClear = vi.fn()
  const latest = { current: initial }

  function Harness() {
    const [criteria, setCriteria] = useState<EventFilterCriteria>(initial)
    useEffect(() => {
      latest.current = criteria
    }, [criteria])
    return (
      <EventFilters
        criteria={criteria}
        onChange={(patch) => {
          onChange(patch)
          setCriteria((prev) => ({ ...prev, ...patch }))
        }}
        onClear={() => {
          onClear()
          setCriteria(EMPTY_FILTER_CRITERIA)
        }}
      />
    )
  }

  const utils = render(<Harness />)
  return { ...utils, onChange, onClear, getCriteria: () => latest.current }
}

function renderStatic(criteria: EventFilterCriteria = EMPTY_FILTER_CRITERIA) {
  const onChange = vi.fn()
  const onClear = vi.fn()
  const utils = render(<EventFilters criteria={criteria} onChange={onChange} onClear={onClear} />)
  return { ...utils, onChange, onClear }
}

const nearbyButton = () => screen.getByRole('button', { name: /cerca de mí|ubicando/i })
const clearButton = () => screen.getByRole('button', { name: 'Limpiar filtros' })
const locationInput = () => screen.getByRole('combobox', { name: 'Ciudad o comuna' })

// --- Tests -------------------------------------------------------------------
describe('EventFilters — renderizado', () => {
  it('renders all controls', () => {
    renderStatic()
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
    expect(locationInput()).toBeInTheDocument()
    expect(screen.getByLabelText('Desde')).toBeInTheDocument()
    expect(screen.getByLabelText('Hasta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hoy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próximos' })).toBeInTheDocument()
    expect(nearbyButton()).toBeInTheDocument()
    expect(clearButton()).toBeInTheDocument()
  })

  it('no longer offers a radius selector', () => {
    renderStatic()
    expect(screen.queryByLabelText('Radio')).not.toBeInTheDocument()
  })

  it('shows the values from criteria', () => {
    renderStatic({ text: 'rock', location: 'Concepción', dateFrom: '2025-03-01', dateTo: '2025-03-31' })
    expect(screen.getByLabelText('Buscar')).toHaveValue('rock')
    expect(locationInput()).toHaveValue('Concepción')
    expect(screen.getByLabelText('Desde')).toHaveValue('2025-03-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2025-03-31')
  })

  it('does not show an error alert or a located-comuna notice initially', () => {
    renderStatic()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('EventFilters — texto y ubicación', () => {
  it('reports each keystroke of the text search as a patch', async () => {
    const user = userEvent.setup()
    const { onChange, getCriteria } = renderControlled()

    await user.type(screen.getByLabelText('Buscar'), 'jazz')

    expect(onChange).toHaveBeenCalledTimes(4)
    expect(onChange).toHaveBeenLastCalledWith({ text: 'jazz' })
    expect(getCriteria().text).toBe('jazz')
  })

  it('reports the location input independently from the text search', async () => {
    const user = userEvent.setup()
    const { getCriteria } = renderControlled()

    await user.type(screen.getByLabelText('Buscar'), 'rock')
    await user.type(locationInput(), 'Ñuñoa')

    expect(getCriteria().text).toBe('rock')
    expect(getCriteria().location).toBe('Ñuñoa')
  })

  it('sets the location when a comuna is picked from the list', async () => {
    const user = userEvent.setup()
    const { getCriteria } = renderControlled()

    await user.type(locationInput(), 'conce')
    await user.click(screen.getByRole('option', { name: /^Concepción/ }))

    expect(getCriteria().location).toBe('Concepción')
    expect(locationInput()).toHaveValue('Concepción')
  })
})

describe('EventFilters — fechas', () => {
  it('reports the dateFrom and dateTo inputs', async () => {
    const user = userEvent.setup()
    const { getCriteria } = renderControlled()

    await user.type(screen.getByLabelText('Desde'), '2025-03-10')
    await user.type(screen.getByLabelText('Hasta'), '2025-03-20')

    expect(getCriteria().dateFrom).toBe('2025-03-10')
    expect(getCriteria().dateTo).toBe('2025-03-20')
  })

  describe('atajos', () => {
    beforeEach(() => {
      // Miércoles 12 de marzo de 2025 (hora local); solo se falsea Date
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2025, 2, 12, 15, 0))
    })

    it('"Hoy" sets both dates to today', async () => {
      const user = userEvent.setup()
      const { onChange } = renderControlled()

      await user.click(screen.getByRole('button', { name: 'Hoy' }))

      expect(onChange).toHaveBeenCalledWith({ dateFrom: '2025-03-12', dateTo: '2025-03-12' })
      expect(screen.getByLabelText('Desde')).toHaveValue('2025-03-12')
      expect(screen.getByLabelText('Hasta')).toHaveValue('2025-03-12')
    })

    it('"Esta semana" sets Monday to Sunday', async () => {
      const user = userEvent.setup()
      const { onChange } = renderControlled()

      await user.click(screen.getByRole('button', { name: 'Esta semana' }))

      expect(onChange).toHaveBeenCalledWith({ dateFrom: '2025-03-10', dateTo: '2025-03-16' })
    })

    it('"Próximos" sets dateFrom to today and leaves dateTo empty', async () => {
      const user = userEvent.setup()
      const { onChange } = renderControlled()

      await user.click(screen.getByRole('button', { name: 'Próximos' }))

      expect(onChange).toHaveBeenCalledWith({ dateFrom: '2025-03-12', dateTo: '' })
      expect(screen.getByLabelText('Hasta')).toHaveValue('')
    })

    it('marks the active shortcut with aria-pressed and clears it when clicked again', async () => {
      const user = userEvent.setup()
      renderControlled()
      const hoy = screen.getByRole('button', { name: 'Hoy' })

      expect(hoy).toHaveAttribute('aria-pressed', 'false')
      await user.click(hoy)
      expect(hoy).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'Próximos' })).toHaveAttribute('aria-pressed', 'false')

      await user.click(hoy)
      expect(hoy).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByLabelText('Desde')).toHaveValue('')
      expect(screen.getByLabelText('Hasta')).toHaveValue('')
    })

    it('deactivates the shortcut when the dates are edited manually', async () => {
      const user = userEvent.setup()
      renderControlled()
      const hoy = screen.getByRole('button', { name: 'Hoy' })

      await user.click(hoy)
      await user.clear(screen.getByLabelText('Hasta'))
      await user.type(screen.getByLabelText('Hasta'), '2025-03-30')

      expect(hoy).toHaveAttribute('aria-pressed', 'false')
    })
  })
})

describe('EventFilters — "Cerca de mí" elige la comuna más cercana', () => {
  it('requests the position once and fills the location with the comuna', async () => {
    const user = userEvent.setup()
    const getCurrentPosition = mockGeolocationSuccess()
    const { onChange, getCriteria } = renderControlled()

    await user.click(nearbyButton())

    expect(await screen.findByRole('status')).toHaveTextContent('Comuna más cercana: Concepción')
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ location: 'Concepción' })
    expect(getCriteria().location).toBe('Concepción')
    expect(locationInput()).toHaveValue('Concepción')
    expect(getCriteria().nearby ?? null).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('picks the comuna that contains the position even when another centroid is closer', async () => {
    // Antofagasta es una comuna enorme: su centroide queda a ~120 km de la ciudad
    const user = userEvent.setup()
    mockGeolocationSuccess({ latitude: -23.6509, longitude: -70.3975 })
    const { getCriteria } = renderControlled()

    await user.click(nearbyButton())

    expect(await screen.findByRole('status')).toHaveTextContent('Antofagasta')
    expect(getCriteria().location).toBe('Antofagasta')
  })

  it('shows a loading state and disables the button while waiting', async () => {
    const user = userEvent.setup()
    const geo = mockGeolocationPending()
    const { onChange, getCriteria } = renderControlled()

    await user.click(nearbyButton())

    expect(screen.getByRole('button', { name: 'Ubicando...' })).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()

    await act(async () => geo.resolve())

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(nearbyButton()).toBeEnabled()
    expect(getCriteria().location).toBe('Concepción')
  })

  it('hides the notice when the user edits the location afterwards', async () => {
    const user = userEvent.setup()
    mockGeolocationSuccess()
    renderControlled()

    await user.click(nearbyButton())
    expect(await screen.findByRole('status')).toBeInTheDocument()

    await user.type(locationInput(), ' Centro')

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('reports that no comuna was found when the position is outside Chile', async () => {
    const user = userEvent.setup()
    mockGeolocationSuccess(MENDOZA_ARGENTINA)
    const { onChange, getCriteria } = renderControlled()

    await user.click(nearbyButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(/no encontré una comuna/i)
    expect(onChange).not.toHaveBeenCalled()
    expect(getCriteria().location).toBe('')
    expect(nearbyButton()).toBeEnabled()
  })

  it('shows an error when the comuna data cannot be loaded, and can retry', async () => {
    const user = userEvent.setup()
    mockGeolocationSuccess()
    vi.mocked(findNearestComuna).mockRejectedValueOnce(new Error('sin red'))
    const { getCriteria } = renderControlled()

    await user.click(nearbyButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudieron cargar los datos de comunas/i)
    expect(nearbyButton()).toBeEnabled()

    await user.click(nearbyButton())
    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getCriteria().location).toBe('Concepción')
  })

  it('ignores a late position response after the component is unmounted', async () => {
    const user = userEvent.setup()
    const geo = mockGeolocationPending()
    const { onChange, unmount } = renderControlled()

    await user.click(nearbyButton())
    unmount()
    await act(async () => {
      geo.resolve()
      await loadComunaGeometry() // deja terminar la carga diferida antes de comprobar
    })

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('EventFilters — geolocalización con error', () => {
  it('shows a message when the permission is denied and does not change the location', async () => {
    const user = userEvent.setup()
    const getCurrentPosition = mockGeolocationError(1)
    const { onChange, getCriteria } = renderControlled()

    await user.click(nearbyButton())

    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveTextContent(/permiso de ubicación denegado/i)
    expect(onChange).not.toHaveBeenCalled()
    expect(getCriteria().location).toBe('')
    expect(nearbyButton()).toBeEnabled()
  })

  it('shows a message when the position is unavailable', async () => {
    const user = userEvent.setup()
    mockGeolocationError(2)
    renderControlled()

    await user.click(nearbyButton())

    expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo determinar tu ubicación/i)
  })

  it('shows a message on timeout', async () => {
    const user = userEvent.setup()
    mockGeolocationError(3)
    renderControlled()

    await user.click(nearbyButton())

    expect(screen.getByRole('alert')).toHaveTextContent(/se agotó el tiempo/i)
  })

  it('shows a message when the browser has no geolocation support', async () => {
    const user = userEvent.setup()
    setGeolocation(undefined)
    const { onChange } = renderControlled()

    await user.click(nearbyButton())

    expect(screen.getByRole('alert')).toHaveTextContent(/no soporta geolocalización/i)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clears the error message and can succeed on a retry', async () => {
    const user = userEvent.setup()
    mockGeolocationError(1)
    const { getCriteria } = renderControlled()

    await user.click(nearbyButton())
    expect(screen.getByRole('alert')).toBeInTheDocument()

    mockGeolocationSuccess()
    await user.click(nearbyButton())

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getCriteria().location).toBe('Concepción')
  })
})

describe('EventFilters — limpiar filtros', () => {
  it('is disabled when there are no active filters', () => {
    renderStatic()
    expect(clearButton()).toBeDisabled()
  })

  it.each([
    ['text', { text: 'rock' }],
    ['location', { location: 'Santiago' }],
    ['dateFrom', { dateFrom: '2025-01-01' }],
    ['dateTo', { dateTo: '2025-01-01' }],
  ])('is enabled when %s is active', (_name, criteria) => {
    renderStatic(criteria)
    expect(clearButton()).toBeEnabled()
  })

  it('calls onClear when clicked', async () => {
    const user = userEvent.setup()
    const { onClear } = renderStatic({ text: 'rock' })

    await user.click(clearButton())

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('resets every field and the located-comuna notice', async () => {
    const user = userEvent.setup()
    mockGeolocationSuccess()
    const { getCriteria } = renderControlled()

    await user.type(screen.getByLabelText('Buscar'), 'rock')
    await user.type(screen.getByLabelText('Desde'), '2025-03-10')
    await user.click(nearbyButton())
    expect(await screen.findByRole('status')).toBeInTheDocument()

    await user.click(clearButton())

    expect(getCriteria()).toEqual(EMPTY_FILTER_CRITERIA)
    expect(screen.getByLabelText('Buscar')).toHaveValue('')
    expect(locationInput()).toHaveValue('')
    expect(screen.getByLabelText('Desde')).toHaveValue('')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(clearButton()).toBeDisabled()
  })

  it('dismisses a geolocation error message', async () => {
    const user = userEvent.setup()
    mockGeolocationError(1)
    renderControlled()

    await user.click(nearbyButton())
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // con solo el error visible, el botón sigue habilitado para poder descartarlo
    expect(clearButton()).toBeEnabled()
    await user.click(clearButton())

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
