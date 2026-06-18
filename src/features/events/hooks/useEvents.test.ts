import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEvents } from './useEvents'
import { eventsService } from '../services/events.services'

vi.mock('../services/events.services')
vi.mock('../../auth/hooks/useAuth')

import { useAuth } from '../../auth/hooks/useAuth'

const mockUseAuth = vi.mocked(useAuth)
const mockEventsService = vi.mocked(eventsService)

const mockUser = { id: 1, username: 'tomas' }

const mockEvent = {
  id: 1,
  title: 'Evento test',
  description: 'Descripción del evento',
  date: '2099-12-01',
  location: 'Santiago',
  latitude: -33.4,
  longitude: -70.6,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    token: 'token123',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  })
})

describe('useEvents — fetchEvents', () => {
  it('loads events and clears loading state', async () => {
    mockEventsService.getAll.mockResolvedValue([mockEvent])

    const { result } = renderHook(() => useEvents())

    await act(async () => { await result.current.fetchEvents() })

    expect(result.current.events).toEqual([mockEvent])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets error message on API failure', async () => {
    mockEventsService.getAll.mockRejectedValue({ response: { data: { message: 'Server error' } } })

    const { result } = renderHook(() => useEvents())

    await act(async () => { await result.current.fetchEvents() })

    expect(result.current.error).toBe('Server error')
    expect(result.current.events).toEqual([])
  })
})

describe('useEvents — createEvent', () => {
  it('adds the new event to the list and returns true', async () => {
    mockEventsService.create.mockResolvedValue(mockEvent)

    const { result } = renderHook(() => useEvents())
    let success: boolean

    await act(async () => {
      success = await result.current.createEvent({
        title: mockEvent.title,
        description: mockEvent.description,
        date: mockEvent.date,
        location: mockEvent.location,
        latitude: mockEvent.latitude,
        longitude: mockEvent.longitude,
      })
    })

    expect(success!).toBe(true)
    expect(result.current.events).toContainEqual(mockEvent)
  })

  it('returns false when user is not set', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    const { result } = renderHook(() => useEvents())
    let success: boolean

    await act(async () => {
      success = await result.current.createEvent({
        title: 'test',
        description: 'desc',
        date: '2099-01-01',
        location: 'lugar',
        latitude: 0,
        longitude: 0,
      })
    })

    expect(success!).toBe(false)
    expect(mockEventsService.create).not.toHaveBeenCalled()
  })
})

describe('useEvents — updateEvent', () => {
  it('replaces the event in the list and returns true', async () => {
    const updated = { ...mockEvent, title: 'Título actualizado' }
    mockEventsService.getAll.mockResolvedValue([mockEvent])
    mockEventsService.update.mockResolvedValue(updated)

    const { result } = renderHook(() => useEvents())

    await act(async () => { await result.current.fetchEvents() })

    let success: boolean
    await act(async () => {
      success = await result.current.updateEvent(mockEvent.id, {
        title: updated.title,
        description: mockEvent.description,
        date: mockEvent.date,
        location: mockEvent.location,
        latitude: mockEvent.latitude,
        longitude: mockEvent.longitude,
      })
    })

    expect(success!).toBe(true)
    expect(result.current.events[0].title).toBe('Título actualizado')
  })
})

describe('useEvents — deleteEvent', () => {
  it('removes the event from the list and returns true', async () => {
    mockEventsService.getAll.mockResolvedValue([mockEvent])
    mockEventsService.delete.mockResolvedValue(undefined)

    const { result } = renderHook(() => useEvents())

    await act(async () => { await result.current.fetchEvents() })
    await act(async () => { await result.current.deleteEvent(mockEvent.id) })

    expect(result.current.events).toHaveLength(0)
  })

  it('sets error on failure', async () => {
    mockEventsService.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } })

    const { result } = renderHook(() => useEvents())

    await act(async () => { await result.current.deleteEvent(999) })

    expect(result.current.error).toBe('Not found')
  })
})
